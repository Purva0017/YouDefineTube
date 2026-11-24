import { Storage } from "@plasmohq/storage"
import { STORAGE_KEYS, TIMERS } from "~/lib/constants"
import {
  createEmptyDailyUsage,
  getLocalDateKey,
  getNextLocalMidnight,
  type DailyUsage,
  type TimeTrackingSnapshot
} from "~/lib/time-tracking"
import { MESSAGES } from "~/lib/messaging"
import { SettingsService } from "./SettingsService"

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
  private persistDirty = false
  private persistTimer: ReturnType<typeof setTimeout> | null = null
  private lastHistoryPersistAt = 0
  private historyDirty = false

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

    const now = Date.now()
    this.liveSessions = new Map(
      Object.entries(sessionData).map(([tabId, session]) => [
        Number(tabId),
        { ...(session as LiveSession), lastTickAt: now }
      ])
    )

    await this.checkDateChange()
    this.setupMidnightAlarm()
    this.watchTodayUsageStorage()

    this.settingsService.onSettingsChange((next, prev) => {
      void this.enqueue(async () => {
        if (prev.isExtensionEnabled && !next.isExtensionEnabled) {
          this.flushAllLiveSessions()
        }
        await this.flushPersist()
      })
    })
  }

  public async checkDateChange(): Promise<boolean> {
    const todayKey = getLocalDateKey()
    const storedToday = await this.storage.get<DailyUsage>(STORAGE_KEYS.TIME_TRACKING_TODAY)

    if (!storedToday || storedToday.date !== todayKey) {
      if (storedToday) {
        // Archive previous day's usage into history
        this.historyCache[storedToday.date] = storedToday
        this.historyDirty = true
        await this.storage.set(STORAGE_KEYS.TIME_TRACKING_HISTORY, this.historyCache)
      }
      const freshUsage = createEmptyDailyUsage(todayKey)
      this.historyCache[todayKey] = freshUsage
      await this.storage.set(STORAGE_KEYS.TIME_TRACKING_TODAY, freshUsage)

      // Reset daily time limit warnings on date reset
      void this.settingsService.updateSettings({
        timeLimitWarning50Dismissed: "",
        timeLimitWarning90Dismissed: "",
        timeLimitWarning100Dismissed: ""
      })
      return true
    } else {
      // Ensure historyCache holds the populated todayUsage and doesn't discard it
      const existing = this.historyCache[todayKey]
      this.historyCache[todayKey] = existing
        ? this.mergeTodayUsage(existing, storedToday)
        : storedToday
      return false
    }
  }

  public setupMidnightAlarm(): void {
    const now = Date.now()
    const midnight = getNextLocalMidnight(now)
    chrome.alarms.create("midnight-reset", { when: midnight })
  }

  public async handleReport(tabId: number, snapshot: TimeTrackingSnapshot): Promise<void> {
    const now = Date.now()

    if (!this.settingsService.settings.isExtensionEnabled) {
      await this.flushAndRemoveTabSession(tabId, now)
      return
    }

    // If this tab is reporting as active, deactivate other tabs in liveSessions
    // so multiple open tabs never double-count time simultaneously
    if (this.isSnapshotActive(snapshot)) {
      for (const [otherTabId, otherSession] of this.liveSessions.entries()) {
        if (otherTabId !== tabId && this.isSnapshotActive(otherSession)) {
          this.addDurationToHistory(otherSession.lastTickAt, now, otherSession)
          this.liveSessions.set(otherTabId, {
            ...otherSession,
            isDocumentVisible: false,
            isWindowFocused: false,
            lastTickAt: now
          })
        }
      }
    }

    const previous = this.liveSessions.get(tabId)

    if (previous) {
      this.addDurationToHistory(previous.lastTickAt, now, previous)
    }

    this.liveSessions.set(tabId, {
      ...snapshot,
      lastTickAt: now
    })

    // Immediately write today's usage so the UI always has fresh data.
    // The full persist (history + session) is debounced.
    await this.persistTodayImmediate()
    this.checkTimeLimitWarnings()
    this.schedulePersist()
  }

  public async handleTabActivated(tabId: number): Promise<void> {
    const now = Date.now()
    if (!this.settingsService.settings.isExtensionEnabled) return

    for (const [otherTabId, otherSession] of this.liveSessions.entries()) {
      if (otherTabId !== tabId && this.isSnapshotActive(otherSession)) {
        this.addDurationToHistory(otherSession.lastTickAt, now, otherSession)
        this.liveSessions.set(otherTabId, {
          ...otherSession,
          isDocumentVisible: false,
          isWindowFocused: false,
          lastTickAt: now
        })
      }
    }

    const current = this.liveSessions.get(tabId)
    if (current) {
      this.liveSessions.set(tabId, {
        ...current,
        isDocumentVisible: true,
        isWindowFocused: true,
        lastTickAt: now
      })
    }

    this.schedulePersist()
  }

  public async handleWindowFocusChanged(windowId: number): Promise<void> {
    const now = Date.now()
    if (!this.settingsService.settings.isExtensionEnabled) return

    if (windowId === chrome.windows.WINDOW_ID_NONE) {
      for (const [tabId, session] of this.liveSessions.entries()) {
        if (this.isSnapshotActive(session) && (!session.isVideoPlaying || session.pageType !== "watch")) {
          this.addDurationToHistory(session.lastTickAt, now, session)
          this.liveSessions.set(tabId, {
            ...session,
            isWindowFocused: false,
            lastTickAt: now
          })
        }
      }
      this.schedulePersist()
    }
  }

  public async handleTabRemoved(tabId: number): Promise<void> {
    const session = this.liveSessions.get(tabId)
    if (!session) return

    this.addDurationToHistory(session.lastTickAt, Date.now(), session)
    this.liveSessions.delete(tabId)

    await this.flushPersist()
  }

  private addDurationToHistory(startAt: number, endAt: number, snapshot: TimeTrackingSnapshot): void {
    if (endAt <= startAt || !this.isSnapshotActive(snapshot)) return

    // Cap single tick duration (max 60 seconds) to avoid abnormal jumps after machine sleep
    const MAX_TICK_GAP_MS = 60000
    const effectiveStartAt = Math.max(startAt, endAt - MAX_TICK_GAP_MS)

    const bucket = this.getBucketForSnapshot(snapshot)
    let cursor = effectiveStartAt

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
      this.historyDirty = true

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
    return (
      (snapshot.isDocumentVisible && snapshot.isWindowFocused) ||
      (snapshot.pageType === "watch" && snapshot.isVideoPlaying)
    )
  }

  private getBucketForSnapshot(snapshot: TimeTrackingSnapshot): "watchVideoMs" | "searchMs" | "browseMs" | null {
    if (!this.isSnapshotActive(snapshot)) return null
    if (snapshot.pageType === "watch" && snapshot.isVideoPlaying) return "watchVideoMs"
    if (snapshot.pageType === "search") return "searchMs"
    return "browseMs"
  }

  private flushAllLiveSessions(now = Date.now()): void {
    for (const [tabId, session] of this.liveSessions.entries()) {
      this.addDurationToHistory(session.lastTickAt, now, session)
      this.liveSessions.delete(tabId)
    }
  }

  private async flushAndRemoveTabSession(tabId: number, now: number): Promise<void> {
    const session = this.liveSessions.get(tabId)
    if (!session) return

    this.addDurationToHistory(session.lastTickAt, now, session)
    this.liveSessions.delete(tabId)
    await this.flushPersist()
  }

  private schedulePersist(): void {
    this.persistDirty = true
    if (this.persistTimer) return

    this.persistTimer = setTimeout(() => {
      this.persistTimer = null
      void this.enqueue(async () => {
        await this.flushPersist()
      })
    }, TIMERS.PERSIST_DEBOUNCE_MS)
  }

  private async flushPersist(): Promise<void> {
    if (this.persistTimer) {
      clearTimeout(this.persistTimer)
      this.persistTimer = null
    }
    if (!this.persistDirty && !this.historyDirty) return
    this.persistDirty = false
    await this.persistNow()
  }

  /** Lightweight persist: writes only TIME_TRACKING_TODAY so the popup UI
   *  always has up-to-date data even if the full persist hasn't fired yet. */
  private async persistTodayImmediate(): Promise<void> {
    const todayKey = getLocalDateKey()
    const storedToday = await this.storage.get<DailyUsage>(STORAGE_KEYS.TIME_TRACKING_TODAY)
    const cached = this.historyCache[todayKey] || createEmptyDailyUsage(todayKey)
    const todayUsage = this.mergeTodayUsage(cached, storedToday)
    this.historyCache[todayKey] = todayUsage
    await this.storage.set(STORAGE_KEYS.TIME_TRACKING_TODAY, todayUsage)
  }

  private async persistNow(): Promise<void> {
    const todayKey = getLocalDateKey()
    const storedToday = await this.storage.get<DailyUsage>(STORAGE_KEYS.TIME_TRACKING_TODAY)
    const cached = this.historyCache[todayKey] || createEmptyDailyUsage(todayKey)
    const todayUsage = this.mergeTodayUsage(cached, storedToday)
    this.historyCache[todayKey] = todayUsage

    const storageArea = chrome.storage.session || chrome.storage.local
    const now = Date.now()
    const shouldWriteHistory =
      this.historyDirty || now - this.lastHistoryPersistAt >= TIMERS.HISTORY_PERSIST_MS

    const writes: Promise<void>[] = [
      this.storage.set(STORAGE_KEYS.TIME_TRACKING_TODAY, todayUsage),
      storageArea.set({ [STORAGE_KEYS.LIVE_SESSIONS]: Object.fromEntries(this.liveSessions.entries()) })
    ]

    if (shouldWriteHistory) {
      writes.push(this.storage.set(STORAGE_KEYS.TIME_TRACKING_HISTORY, this.historyCache))
      this.lastHistoryPersistAt = now
      this.historyDirty = false
    }

    await Promise.all(writes)
  }

  private watchTodayUsageStorage(): void {
    this.storage.watch({
      [STORAGE_KEYS.TIME_TRACKING_TODAY]: (chg) => {
        const next = chg?.newValue as DailyUsage | undefined
        if (!next?.date) return
        const todayKey = getLocalDateKey()
        if (next.date !== todayKey) return

        const existing = this.historyCache[todayKey]
        if (existing) {
          this.historyCache[todayKey] = this.mergeTodayUsage(existing, next)
        } else {
          this.historyCache[todayKey] = next
        }
      }
    })
  }

  private mergeTodayUsage(cached: DailyUsage, stored?: DailyUsage | null): DailyUsage {
    if (!stored || stored.date !== cached.date) return cached

    return {
      date: cached.date,
      totalYoutubeMs: Math.max(cached.totalYoutubeMs || 0, stored.totalYoutubeMs || 0),
      watchVideoMs: Math.max(cached.watchVideoMs || 0, stored.watchVideoMs || 0),
      browseMs: Math.max(cached.browseMs || 0, stored.browseMs || 0),
      searchMs: Math.max(cached.searchMs || 0, stored.searchMs || 0),
      updatedAt: Math.max(cached.updatedAt || 0, stored.updatedAt || 0)
    }
  }

  public enqueue(task: () => Promise<void>): Promise<void> {
    this.writeQueue = this.writeQueue.then(task).catch((error) => {
      console.error("Time tracking update failed", error)
    })
    return this.writeQueue
  }

  /** Check if daily time limit thresholds (50%, 90%) have been crossed
   *  and broadcast a warning to all YouTube tabs + trigger native notification.
   *  Each threshold fires once per day. */
  private checkTimeLimitWarnings(): void {
    const settings = this.settingsService.settings
    if (!settings.enableDailyTimeLimit || !settings.dailyTimeLimitMinutes) return

    const todayKey = getLocalDateKey()
    const todayUsage = this.historyCache[todayKey]
    if (!todayUsage) return

    const limitMs = settings.dailyTimeLimitMinutes * 60 * 1000
    const usedMs = todayUsage.totalYoutubeMs || 0
    const usedPercent = (usedMs / limitMs) * 100

    // If user increased limit and usage is now below thresholds, allow warnings to re-arm
    if (usedPercent < 50 && settings.timeLimitWarning50Dismissed === todayKey) {
      void this.settingsService.updateSettings({ timeLimitWarning50Dismissed: "" })
    }
    if (usedPercent < 90 && settings.timeLimitWarning90Dismissed === todayKey) {
      void this.settingsService.updateSettings({ timeLimitWarning90Dismissed: "" })
    }
    if (usedPercent < 100 && settings.timeLimitWarning100Dismissed === todayKey) {
      void this.settingsService.updateSettings({ timeLimitWarning100Dismissed: "" })
    }

    // 100% HARD BLOCK (highest priority)
    if (usedPercent >= 100) {
      const payload = {
        level: 100 as const,
        usedMs,
        limitMs,
        limitMinutes: settings.dailyTimeLimitMinutes
      }
      this.broadcastToYouTubeTabs({
        type: MESSAGES.TIME_LIMIT_WARNING,
        payload
      })
      if (settings.timeLimitWarning100Dismissed !== todayKey) {
        this.showNativeNotification(payload)
        void this.settingsService.updateSettings({ timeLimitWarning100Dismissed: todayKey })
      }
      return
    }

    // 90% warning (higher priority — check first)
    if (usedPercent >= 90 && settings.timeLimitWarning90Dismissed !== todayKey) {
      const payload = {
        level: 90 as const,
        usedMs,
        limitMs,
        limitMinutes: settings.dailyTimeLimitMinutes
      }
      this.broadcastToYouTubeTabs({
        type: MESSAGES.TIME_LIMIT_WARNING,
        payload
      })
      this.showNativeNotification(payload)
      void this.settingsService.updateSettings({ timeLimitWarning90Dismissed: todayKey })
      return
    }

    // 50% warning
    if (usedPercent >= 50 && settings.timeLimitWarning50Dismissed !== todayKey) {
      const payload = {
        level: 50 as const,
        usedMs,
        limitMs,
        limitMinutes: settings.dailyTimeLimitMinutes
      }
      this.broadcastToYouTubeTabs({
        type: MESSAGES.TIME_LIMIT_WARNING,
        payload
      })
      this.showNativeNotification(payload)
      void this.settingsService.updateSettings({ timeLimitWarning50Dismissed: todayKey })
    }
  }

  /** Trigger a native Chrome notification for the time limit warning */
  private showNativeNotification(payload: {
    level: 50 | 90 | 100
    usedMs: number
    limitMs: number
    limitMinutes: number
  }): void {
    if (!chrome.notifications?.create) return

    const usedMinutes = Math.round(payload.usedMs / 60000)
    let title: string
    let message: string
    let priority = 1

    if (payload.level === 100) {
      title = "🛑 YouDefineTube: Daily Limit Reached!"
      message = `You've reached your daily limit of ${payload.limitMinutes} minutes on YouTube. YouTube is now blocked for today.`
      priority = 2
    } else if (payload.level === 90) {
      const remainingMinutes = Math.max(0, payload.limitMinutes - usedMinutes)
      title = "⚠️ YouDefineTube: 90% Daily Limit Reached!"
      message = `You have used ${usedMinutes} of ${payload.limitMinutes} minutes on YouTube today. Only ${remainingMinutes} min remaining!`
      priority = 2
    } else {
      title = "⏳ YouDefineTube: 50% Daily Limit Reached"
      message = `You've reached half of your daily YouTube limit (${usedMinutes} of ${payload.limitMinutes} min).`
      priority = 1
    }

    try {
      chrome.notifications.create(`ydt-limit-${payload.level}`, {
        type: "basic",
        iconUrl: chrome.runtime.getURL ? chrome.runtime.getURL("assets/icon.png") : "assets/icon.png",
        title,
        message,
        priority
      })
    } catch {
      // Ignore notification creation errors (e.g. In mock environments)
    }
  }

  /** Send a message to all open YouTube tabs */
  private broadcastToYouTubeTabs(message: unknown): void {
    chrome.tabs
      .query({ url: ["https://www.youtube.com/*", "https://m.youtube.com/*"] })
      .then((tabs) => {
        for (const tab of tabs) {
          if (tab.id) {
            chrome.tabs.sendMessage(tab.id, message).catch(() => {})
          }
        }
      })
      .catch(() => {})
  }
}
