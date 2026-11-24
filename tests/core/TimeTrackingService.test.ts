import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { STORAGE_KEYS } from "~/lib/constants"
import { createEmptyDailyUsage, getLocalDateKey } from "~/lib/time-tracking"

// In-memory fake storage store for @plasmohq/storage
const fakeStorageStore: Record<string, any> = {}
const fakeWatchers: Record<string, Array<(change: any) => void>> = {}

vi.mock("@plasmohq/storage", () => {
  return {
    Storage: class {
      async get(key: string) {
        return fakeStorageStore[key] ?? null
      }
      async set(key: string, value: any) {
        const oldValue = fakeStorageStore[key]
        fakeStorageStore[key] = value
        if (fakeWatchers[key]) {
          fakeWatchers[key].forEach((cb) => cb({ oldValue, newValue: value }))
        }
      }
      watch(map: Record<string, (change: any) => void>) {
        for (const [k, cb] of Object.entries(map)) {
          if (!fakeWatchers[k]) fakeWatchers[k] = []
          fakeWatchers[k].push(cb)
        }
      }
    }
  }
})

describe("TimeTrackingService", () => {
  let TimeTrackingServiceClass: any
  let service: any

  beforeEach(async () => {
    vi.useFakeTimers()
    for (const key of Object.keys(fakeStorageStore)) {
      delete fakeStorageStore[key]
    }
    for (const key of Object.keys(fakeWatchers)) {
      delete fakeWatchers[key]
    }

    // Mock chrome APIs
    const mockStorageArea = {
      get: vi.fn(async () => ({})),
      set: vi.fn(async () => {})
    }

    vi.stubGlobal("chrome", {
      alarms: {
        create: vi.fn()
      },
      notifications: {
        create: vi.fn()
      },
      runtime: {
        getURL: (path: string) => path
      },
      storage: {
        session: mockStorageArea,
        local: mockStorageArea
      },
      tabs: {
        query: vi.fn(async () => [{ id: 10 }]),
        sendMessage: vi.fn(async () => {})
      },
      windows: {
        WINDOW_ID_NONE: -1
      }
    })

    // Reset module registry so singleton is re-created cleanly
    vi.resetModules()
    const module = await import("~/core/background/TimeTrackingService")
    TimeTrackingServiceClass = module.TimeTrackingService
    service = TimeTrackingServiceClass.getInstance()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it("does not reset today's time to 0 when a new tab reports", async () => {
    const todayKey = getLocalDateKey()
    const initialUsage = {
      date: todayKey,
      totalYoutubeMs: 600000, // 10 minutes
      watchVideoMs: 400000,
      browseMs: 200000,
      searchMs: 0,
      updatedAt: Date.now()
    }
    fakeStorageStore[STORAGE_KEYS.TIME_TRACKING_TODAY] = initialUsage
    fakeStorageStore[STORAGE_KEYS.TIME_TRACKING_HISTORY] = {}

    await service.initialize()

    // Simulate a brand new tab (tabId = 99) sending a report
    await service.handleReport(99, {
      pageType: "watch",
      videoId: "abc123",
      isVideoPlaying: true,
      isDocumentVisible: true,
      isWindowFocused: true
    })

    // Flush persist queue
    await vi.advanceTimersByTimeAsync(10000)

    const stored = fakeStorageStore[STORAGE_KEYS.TIME_TRACKING_TODAY]
    expect(stored).toBeDefined()
    expect(stored.date).toBe(todayKey)
    // The previous 600,000 ms must NOT be wiped out!
    expect(stored.totalYoutubeMs).toBeGreaterThanOrEqual(600000)
    expect(stored.watchVideoMs).toBeGreaterThanOrEqual(400000)
  })

  it("accumulates active time correctly on heartbeat", async () => {
    const todayKey = getLocalDateKey()
    await service.initialize()

    // Initial report at t = 0
    await service.handleReport(1, {
      pageType: "watch",
      videoId: "abc",
      isVideoPlaying: true,
      isDocumentVisible: true,
      isWindowFocused: true
    })

    // Advance 15 seconds
    vi.advanceTimersByTime(15000)

    // Second report at t = 15s
    await service.handleReport(1, {
      pageType: "watch",
      videoId: "abc",
      isVideoPlaying: true,
      isDocumentVisible: true,
      isWindowFocused: true
    })

    await vi.advanceTimersByTimeAsync(10000)

    const stored = fakeStorageStore[STORAGE_KEYS.TIME_TRACKING_TODAY]
    expect(stored.totalYoutubeMs).toBe(15000)
    expect(stored.watchVideoMs).toBe(15000)
  })

  it("does not double-count time when user switches tabs", async () => {
    await service.initialize()

    // Tab 1 active at t = 0
    await service.handleReport(1, {
      pageType: "home",
      videoId: null,
      isVideoPlaying: false,
      isDocumentVisible: true,
      isWindowFocused: true
    })

    // Advance 10s
    vi.advanceTimersByTime(10000)

    // User switches to Tab 2; Tab 2 reports active at t = 10s
    await service.handleReport(2, {
      pageType: "search",
      videoId: null,
      isVideoPlaying: false,
      isDocumentVisible: true,
      isWindowFocused: true
    })

    // Advance 10s more
    vi.advanceTimersByTime(10000)

    // Tab 2 reports at t = 20s
    await service.handleReport(2, {
      pageType: "search",
      videoId: null,
      isVideoPlaying: false,
      isDocumentVisible: true,
      isWindowFocused: true
    })

    await vi.advanceTimersByTimeAsync(10000)

    const stored = fakeStorageStore[STORAGE_KEYS.TIME_TRACKING_TODAY]
    // Tab 1 had 10s (browseMs), Tab 2 had 10s (searchMs) = 20s total, NOT 30s
    expect(stored.totalYoutubeMs).toBe(20000)
    expect(stored.browseMs).toBe(10000)
    expect(stored.searchMs).toBe(10000)
  })

  it("archives previous day usage into history when midnight passes", async () => {
    const yesterdayTimestamp = new Date(2026, 7, 5, 20, 0).getTime()
    vi.setSystemTime(yesterdayTimestamp)

    const yesterdayKey = getLocalDateKey(yesterdayTimestamp)
    const yesterdayUsage = {
      date: yesterdayKey,
      totalYoutubeMs: 1800000,
      watchVideoMs: 1200000,
      browseMs: 600000,
      searchMs: 0,
      updatedAt: yesterdayTimestamp
    }
    fakeStorageStore[STORAGE_KEYS.TIME_TRACKING_TODAY] = yesterdayUsage
    fakeStorageStore[STORAGE_KEYS.TIME_TRACKING_HISTORY] = {}

    // Advance to next day 8 AM
    const todayTimestamp = new Date(2026, 7, 6, 8, 0).getTime()
    vi.setSystemTime(todayTimestamp)
    const todayKey = getLocalDateKey(todayTimestamp)

    await service.initialize()

    // Check that yesterday was archived to history
    const history = fakeStorageStore[STORAGE_KEYS.TIME_TRACKING_HISTORY]
    expect(history[yesterdayKey]).toBeDefined()
    expect(history[yesterdayKey].totalYoutubeMs).toBe(1800000)

    // Check that today is clean
    const todayStored = fakeStorageStore[STORAGE_KEYS.TIME_TRACKING_TODAY]
    expect(todayStored.date).toBe(todayKey)
    expect(todayStored.totalYoutubeMs).toBe(0)
  })

  it("caps abnormal gaps to 60s max when system wakes from sleep", async () => {
    await service.initialize()

    await service.handleReport(1, {
      pageType: "watch",
      videoId: "vid1",
      isVideoPlaying: true,
      isDocumentVisible: true,
      isWindowFocused: true
    })

    // Advance 2 hours (simulating sleep/hibernate)
    vi.advanceTimersByTime(2 * 60 * 60 * 1000)

    await service.handleReport(1, {
      pageType: "watch",
      videoId: "vid1",
      isVideoPlaying: true,
      isDocumentVisible: true,
      isWindowFocused: true
    })

    await vi.advanceTimersByTimeAsync(10000)

    const stored = fakeStorageStore[STORAGE_KEYS.TIME_TRACKING_TODAY]
    // Must be capped to 60,000ms instead of 2 hours (7,200,000ms)
    expect(stored.totalYoutubeMs).toBe(60000)
  })

  it("triggers 50% warning when 50% of daily time limit is reached", async () => {
    // 60 minutes limit = 3,600,000 ms. 50% = 1,800,000 ms (30 min)
    fakeStorageStore[STORAGE_KEYS.SETTINGS] = {
      isExtensionEnabled: true,
      enableDailyTimeLimit: true,
      dailyTimeLimitMinutes: 60,
      timeLimitWarning50Dismissed: "",
      timeLimitWarning90Dismissed: ""
    }
    const todayKey = getLocalDateKey()
    fakeStorageStore[STORAGE_KEYS.TIME_TRACKING_TODAY] = {
      date: todayKey,
      totalYoutubeMs: 1790000,
      watchVideoMs: 1790000,
      browseMs: 0,
      searchMs: 0,
      updatedAt: Date.now()
    }

    const { SettingsService } = await import("~/core/background/SettingsService")
    await SettingsService.getInstance().initialize()
    await service.initialize()

    // Tab reports at t=0
    await service.handleReport(1, {
      pageType: "watch",
      videoId: "v1",
      isVideoPlaying: true,
      isDocumentVisible: true,
      isWindowFocused: true
    })

    // Advance 20 seconds (crosses 1,800,000ms threshold)
    vi.advanceTimersByTime(20000)

    await service.handleReport(1, {
      pageType: "watch",
      videoId: "v1",
      isVideoPlaying: true,
      isDocumentVisible: true,
      isWindowFocused: true
    })

    await vi.advanceTimersByTimeAsync(10)

    // Verify chrome.tabs.sendMessage was called with 50% warning
    expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(
      10,
      expect.objectContaining({
        type: "YDT_TIME_LIMIT_WARNING",
        payload: expect.objectContaining({
          level: 50,
          limitMinutes: 60
        })
      })
    )

    // Verify chrome.notifications.create was called
    expect(chrome.notifications.create).toHaveBeenCalledWith(
      "ydt-limit-50",
      expect.objectContaining({
        title: expect.stringContaining("50% Daily Limit")
      })
    )
  })

  it("triggers 90% warning when 90% of daily time limit is reached", async () => {
    // 60 minutes limit = 3,600,000 ms. 90% = 3,240,000 ms (54 min)
    fakeStorageStore[STORAGE_KEYS.SETTINGS] = {
      isExtensionEnabled: true,
      enableDailyTimeLimit: true,
      dailyTimeLimitMinutes: 60,
      timeLimitWarning50Dismissed: getLocalDateKey(),
      timeLimitWarning90Dismissed: ""
    }
    const todayKey = getLocalDateKey()
    fakeStorageStore[STORAGE_KEYS.TIME_TRACKING_TODAY] = {
      date: todayKey,
      totalYoutubeMs: 3230000,
      watchVideoMs: 3230000,
      browseMs: 0,
      searchMs: 0,
      updatedAt: Date.now()
    }

    const { SettingsService } = await import("~/core/background/SettingsService")
    await SettingsService.getInstance().initialize()
    await service.initialize()

    await service.handleReport(1, {
      pageType: "watch",
      videoId: "v1",
      isVideoPlaying: true,
      isDocumentVisible: true,
      isWindowFocused: true
    })

    // Advance 20 seconds (crosses 3,240,000ms threshold)
    vi.advanceTimersByTime(20000)

    await service.handleReport(1, {
      pageType: "watch",
      videoId: "v1",
      isVideoPlaying: true,
      isDocumentVisible: true,
      isWindowFocused: true
    })

    await vi.advanceTimersByTimeAsync(10)

    // Verify 90% warning was dispatched
    expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(
      10,
      expect.objectContaining({
        type: "YDT_TIME_LIMIT_WARNING",
        payload: expect.objectContaining({
          level: 90,
          limitMinutes: 60
        })
      })
    )

    expect(chrome.notifications.create).toHaveBeenCalledWith(
      "ydt-limit-90",
      expect.objectContaining({
        title: expect.stringContaining("90% Daily Limit")
      })
    )
  })

  it("triggers 100% hard block warning when daily time limit is fully reached", async () => {
    // 60 minutes limit = 3,600,000 ms
    fakeStorageStore[STORAGE_KEYS.SETTINGS] = {
      isExtensionEnabled: true,
      enableDailyTimeLimit: true,
      dailyTimeLimitMinutes: 60,
      timeLimitWarning50Dismissed: getLocalDateKey(),
      timeLimitWarning90Dismissed: getLocalDateKey(),
      timeLimitWarning100Dismissed: ""
    }
    const todayKey = getLocalDateKey()
    fakeStorageStore[STORAGE_KEYS.TIME_TRACKING_TODAY] = {
      date: todayKey,
      totalYoutubeMs: 3590000,
      watchVideoMs: 3590000,
      browseMs: 0,
      searchMs: 0,
      updatedAt: Date.now()
    }

    const { SettingsService } = await import("~/core/background/SettingsService")
    await SettingsService.getInstance().initialize()
    await service.initialize()

    await service.handleReport(1, {
      pageType: "watch",
      videoId: "v1",
      isVideoPlaying: true,
      isDocumentVisible: true,
      isWindowFocused: true
    })

    // Advance 20 seconds (crosses 3,600,000ms threshold)
    vi.advanceTimersByTime(20000)

    await service.handleReport(1, {
      pageType: "watch",
      videoId: "v1",
      isVideoPlaying: true,
      isDocumentVisible: true,
      isWindowFocused: true
    })

    await vi.advanceTimersByTimeAsync(10)

    // Verify 100% hard block warning was dispatched to YouTube tabs
    expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(
      10,
      expect.objectContaining({
        type: "YDT_TIME_LIMIT_WARNING",
        payload: expect.objectContaining({
          level: 100,
          limitMinutes: 60
        })
      })
    )

    // Verify 100% native desktop notification was created
    expect(chrome.notifications.create).toHaveBeenCalledWith(
      "ydt-limit-100",
      expect.objectContaining({
        title: expect.stringContaining("Daily Limit Reached")
      })
    )
  })
})
