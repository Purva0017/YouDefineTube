import { Storage } from "@plasmohq/storage"
import { STORAGE_KEYS, TIMERS } from "~/lib/constants"
import {
  createEmptyDailyUsage,
  getLocalDateKey,
  getNextLocalMidnight,
  type DailyUsage,
  type TimeTrackingSnapshot
} from "~/lib/time-tracking"
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

    this.liveSessions = new Map(
      Object.entries(sessionData).map(([tabId, session]) => [Number(tabId), session as LiveSession])
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

    if (!this.settingsService.settings.isExtensionEnabled) {
      await this.flushAndRemoveTabSession(tabId, now)
      return
    }

    const previous = this.liveSessions.get(tabId)

    if (previous) {
      this.addDurationToHistory(previous.lastTickAt, now, previous)
    }

    this.liveSessions.set(tabId, {
      ...snapshot,
      lastTickAt: now
    })

    this.schedulePersist()
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
    return snapshot.isDocumentVisible && snapshot.isWindowFocused
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

  private getUnpersistedMsForDate(dateKey: string, now = Date.now()): number {
    let total = 0

    for (const session of this.liveSessions.values()) {
      if (!this.isSnapshotActive(session)) continue

      let cursor = session.lastTickAt
      while (cursor < now) {
        const segmentEnd = Math.min(getNextLocalMidnight(cursor), now)
        if (getLocalDateKey(cursor) === dateKey) {
          total += segmentEnd - cursor
        }
        cursor = segmentEnd
      }
    }

    return total
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

  private async persistNow(): Promise<void> {
    const todayKey = getLocalDateKey()
    const cached = this.historyCache[todayKey] || createEmptyDailyUsage(todayKey)
    const storedToday = await this.storage.get<DailyUsage>(STORAGE_KEYS.TIME_TRACKING_TODAY)
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
        const usage = this.touchUsage(next.date)
        usage.updatedAt = Math.max(usage.updatedAt || 0, next.updatedAt || 0)
      }
    })
  }

  private mergeTodayUsage(cached: DailyUsage, stored?: DailyUsage | null): DailyUsage {
    if (!stored || stored.date !== cached.date) return cached

    return {
      ...cached,
      updatedAt: Math.max(cached.updatedAt || 0, stored.updatedAt || 0)
    }
  }

  public enqueue(task: () => Promise<void>): Promise<void> {
    this.writeQueue = this.writeQueue.then(task).catch((error) => {
      console.error("Time tracking update failed", error)
    })
    return this.writeQueue
  }
}
