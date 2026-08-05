import { Storage } from "@plasmohq/storage"
import { STORAGE_KEYS } from "~/lib/constants"
import {
  createEmptyDailyUsage,
  getLocalDateKey,
  getNextLocalMidnight,
  type DailyUsage,
  type TimeTrackingSnapshot
} from "~/lib/time-tracking"
import { SettingsService } from "./SettingsService"
import { MESSAGES } from "~/lib/messaging"

type LiveSession = TimeTrackingSnapshot & {
  lastTickAt: number
}

type UsageHistory = Record<string, DailyUsage>

export class TimeTrackingService {
  private static instance: TimeTrackingService
  private storage = new Storage()
  private historyCache: UsageHistory = {}
  private liveSessions = new Map<number, LiveSession>()
  private writeQueue = Promise.resolve()
  private settingsService = SettingsService.getInstance()

  private constructor() { }

  public static getInstance(): TimeTrackingService {
    if (!TimeTrackingService.instance) {
      TimeTrackingService.instance = new TimeTrackingService()
    }
    return TimeTrackingService.instance
  }

  public async initialize(): Promise<void> {
    this.historyCache = (await this.storage.get<UsageHistory>(STORAGE_KEYS.TIME_TRACKING_HISTORY)) || {}

    // Fallback for chrome.storage.session (needed for some Firefox versions)
    const storageArea = chrome.storage.session || chrome.storage.local
    const sessionData = (await storageArea.get(STORAGE_KEYS.LIVE_SESSIONS))[STORAGE_KEYS.LIVE_SESSIONS] || {}

    this.liveSessions = new Map(
      Object.entries(sessionData).map(([tabId, session]) => [Number(tabId), session as LiveSession])
    )

    await this.checkDateChange()
    this.setupMidnightAlarm()

    this.settingsService.onSettingsChange((next, prev) => {
      void this.enqueue(async () => {
        const todayKey = getLocalDateKey()
        const todayUsage = this.touchUsage(todayKey)

        // If limit duration changed, reset extensions for the day
        if (prev.dailyLimitMinutes !== next.dailyLimitMinutes) {
          if ((todayUsage.extensionsUsed || 0) > 0) {
            todayUsage.extensionsUsed = 0
            todayUsage.updatedAt = Date.now()
            this.historyCache[todayKey] = todayUsage
          }
        }

        await this.maybeTriggerDailyLimitAlert()
        await this.persist()
      })
    })
  }

  public async checkDateChange(): Promise<boolean> {
    const todayKey = getLocalDateKey()
    const storedToday = await this.storage.get<DailyUsage>(STORAGE_KEYS.TIME_TRACKING_TODAY)

    if (!storedToday || storedToday.date !== todayKey) {
      const freshUsage = this.touchUsage(todayKey)
      await this.storage.set(STORAGE_KEYS.TIME_TRACKING_TODAY, freshUsage)
      return true
    }
    return false
  }

  public setupMidnightAlarm(): void {
    const now = Date.now()
    const midnight = getNextLocalMidnight(now)
    chrome.alarms.create("midnight-reset", { when: midnight })
  }

  public async handleReport(tabId: number, snapshot: TimeTrackingSnapshot): Promise<void> {
    const now = Date.now()
    const previous = this.liveSessions.get(tabId)

    if (previous) {
      this.addDurationToHistory(previous.lastTickAt, now, previous)
    }

    this.liveSessions.set(tabId, {
      ...snapshot,
      lastTickAt: now
    })

    await this.maybeTriggerDailyLimitAlert()
    await this.persist()
  }

  public async handleTabRemoved(tabId: number): Promise<void> {
    const session = this.liveSessions.get(tabId)
    if (!session) return

    this.addDurationToHistory(session.lastTickAt, Date.now(), session)
    this.liveSessions.delete(tabId)

    await this.maybeTriggerDailyLimitAlert()
    await this.persist()
  }

  public async requestExtension(): Promise<{ ok: boolean; extensionsUsed?: number; error?: string }> {
    const todayKey = getLocalDateKey()
    const todayUsage = this.touchUsage(todayKey)
    if ((todayUsage.extensionsUsed || 0) < 2) {
      todayUsage.extensionsUsed = (todayUsage.extensionsUsed || 0) + 1
      todayUsage.updatedAt = Date.now()
      this.historyCache[todayKey] = todayUsage
      await this.maybeTriggerDailyLimitAlert()
      await this.persist()
      return { ok: true, extensionsUsed: todayUsage.extensionsUsed }
    } else {
      return { ok: false, error: "No extensions left" }
    }
  }

  private addDurationToHistory(startAt: number, endAt: number, snapshot: TimeTrackingSnapshot): void {
    if (endAt <= startAt || !this.isSnapshotActive(snapshot)) return

    const bucket = this.getBucketForSnapshot(snapshot)
    let cursor = startAt

    while (cursor < endAt) {
      const segmentEnd = Math.min(getNextLocalMidnight(cursor), endAt)
      const segmentMs = segmentEnd - cursor
      const dateKey = getLocalDateKey(cursor)
      const usage = this.touchUsage(dateKey)

      usage.totalYoutubeMs += segmentMs
      if (bucket) {
        usage[bucket] += segmentMs
      }
      usage.updatedAt = Date.now()

      cursor = segmentEnd
    }
  }

  private touchUsage(dateKey: string): DailyUsage {
    const existing = this.historyCache[dateKey]
    if (existing) return existing

    const created = createEmptyDailyUsage(dateKey)
    this.historyCache[dateKey] = created
    return created
  }

  private isSnapshotActive(snapshot: TimeTrackingSnapshot): boolean {
    return snapshot.isDocumentVisible && snapshot.isWindowFocused
  }

  private getBucketForSnapshot(snapshot: TimeTrackingSnapshot): "watchVideoMs" | "searchMs" | "browseMs" | null {
    if (!this.isSnapshotActive(snapshot)) return null
    if (snapshot.pageType === "watch" && snapshot.isVideoPlaying) return "watchVideoMs"
    if (snapshot.pageType === "search") return "searchMs"
    return "browseMs"
  }

  private async persist(): Promise<void> {
    const todayKey = getLocalDateKey()
    const todayUsage = this.historyCache[todayKey] || createEmptyDailyUsage(todayKey)

    const storageArea = chrome.storage.session || chrome.storage.local

    await Promise.all([
      this.storage.set(STORAGE_KEYS.TIME_TRACKING_HISTORY, this.historyCache),
      this.storage.set(STORAGE_KEYS.TIME_TRACKING_TODAY, todayUsage),
      storageArea.set({ [STORAGE_KEYS.LIVE_SESSIONS]: Object.fromEntries(this.liveSessions.entries()) })
    ])
  }

  public async maybeTriggerDailyLimitAlert(): Promise<void> {
    const settings = this.settingsService.settings
    const todayKey = getLocalDateKey()
    const todayUsage = this.touchUsage(todayKey)

    if (!settings.enableDailyLimitAlert || settings.dailyLimitMinutes <= 0) {
      if (todayUsage.dailyLimitReachedAt) {
        todayUsage.dailyLimitReachedAt = null
        todayUsage.updatedAt = Date.now()
        this.historyCache[todayKey] = todayUsage
      }
      return
    }

    const currentTotalMinutes = Math.floor((todayUsage.totalYoutubeMs || 0) / 60000)
    const allowedLimitMinutes = (settings.dailyLimitMinutes || 0) + (todayUsage.extensionsUsed || 0) * 5

    if (currentTotalMinutes < allowedLimitMinutes) {
      if (todayUsage.dailyLimitReachedAt) {
        todayUsage.dailyLimitReachedAt = null
        todayUsage.updatedAt = Date.now()
        this.historyCache[todayKey] = todayUsage
      }
      return
    }

    if (todayUsage.dailyLimitReachedAt) return

    todayUsage.dailyLimitReachedAt = Date.now()
    todayUsage.updatedAt = Date.now()
    this.historyCache[todayKey] = todayUsage

    await chrome.notifications.create(`ydt-daily-limit-${todayKey}`, {
      type: "basic",
      iconUrl: chrome.runtime.getURL("assets/icon.png"),
      title: "YouDefineTube daily limit reached",
      message: `You've reached your ${settings.dailyLimitMinutes}-minute YouTube limit for today.`
    })

    await this.broadcastDailyLimitAlert(settings.dailyLimitMinutes, todayUsage.extensionsUsed || 0)
  }

  private async broadcastDailyLimitAlert(limitMinutes: number, extensionsUsed: number): Promise<void> {
    const tabs = await chrome.tabs.query({
      url: ["https://www.youtube.com/*", "https://m.youtube.com/*"]
    })

    const message = {
      type: MESSAGES.DAILY_LIMIT_REACHED,
      payload: { limitMinutes, extensionsUsed }
    }

    await Promise.all(
      tabs
        .filter((tab) => typeof tab.id === "number")
        .map(async (tab) => {
          try {
            await chrome.tabs.sendMessage(tab.id as number, message)
          } catch { }
        })
    )
  }

  public enqueue(task: () => Promise<void>): Promise<void> {
    this.writeQueue = this.writeQueue.then(task).catch((error) => {
      console.error("Time tracking update failed", error)
    })
    return this.writeQueue
  }
}
