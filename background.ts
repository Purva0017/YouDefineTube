import { Storage } from "@plasmohq/storage"

import { defaultSettings, type Settings } from "~/lib/settings"
import {
  CLOSE_ALL_TABS,
  CLOSE_CURRENT_TAB,
  DAILY_LIMIT_REACHED,
  REQUEST_EXTENSION,
  createEmptyDailyUsage,
  getLocalDateKey,
  getNextLocalMidnight,
  getNextCustomTime,
  TIME_TRACKING_HISTORY_KEY,
  TIME_TRACKING_REPORT,
  TIME_TRACKING_TODAY_KEY,
  type CloseTabsMessage,
  type CloseCurrentTabMessage,
  type DailyLimitReachedMessage,
  type DailyUsage,
  type ExtensionRequestMessage,
  type TimeTrackingReportMessage,
  type TimeTrackingSnapshot
} from "~/lib/time-tracking"

type LiveSession = TimeTrackingSnapshot & {
  lastTickAt: number
}

type UsageHistory = Record<string, DailyUsage>

const storage = new Storage()
const LIVE_SESSIONS_KEY = "timeTrackingLiveSessions"

let historyCache: UsageHistory = {}
let liveSessions = new Map<number, LiveSession>()
let settingsCache: Settings = { ...defaultSettings }
let initializePromise: Promise<void> | null = null
let writeQueue = Promise.resolve()

const isSnapshotActive = (snapshot: TimeTrackingSnapshot) => {
  return snapshot.isDocumentVisible && snapshot.isWindowFocused
}

const getBucketForSnapshot = (snapshot: TimeTrackingSnapshot) => {
  if (!isSnapshotActive(snapshot)) return null
  if (snapshot.pageType === "watch" && snapshot.isVideoPlaying) return "watchVideoMs"
  if (snapshot.pageType === "search") return "searchMs"
  return "browseMs"
}

const loadSettings = async () => {
  settingsCache = {
    ...defaultSettings,
    ...((await storage.get<Partial<Settings>>("settings")) || {})
  }
}

// Configuration for reset time (Default: 00:00 midnight)
const RESET_HOURS = 0
const RESET_MINUTES = 0

// Set this to true only for force-reset testing
const DEBUG_FORCE_RESET = false

const setupMidnightAlarm = async () => {
  const now = Date.now()
  const resetTime = getNextCustomTime(now, RESET_HOURS, RESET_MINUTES)
  
  // Clear any existing alarms to avoid duplicates
  await chrome.alarms.clear("midnight-reset")
  await chrome.alarms.create("midnight-reset", { when: resetTime })
  
  console.log(`[YDT] Alarm successfully scheduled for: ${new Date(resetTime).toLocaleString()} (DEBUG_FORCE_RESET is ${DEBUG_FORCE_RESET})`)
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "midnight-reset") {
    void (async () => {
      console.log(`[YDT] Reset alarm triggered at ${new Date().toLocaleTimeString()}!`)
      await enqueue(async () => {
        await ensureInitialized()
        
        const todayKey = getLocalDateKey()
        if (DEBUG_FORCE_RESET) {
          console.log(`[YDT] DEBUG: Clearing history for ${todayKey} to force 0m reset...`)
          delete historyCache[todayKey]
        }
        
        await checkDateChange()
        await setupMidnightAlarm()
      })
    })()
  }
})

const checkDateChange = async () => {
  const todayKey = getLocalDateKey()
  const storedToday = await storage.get<DailyUsage>(TIME_TRACKING_TODAY_KEY)
  
  if (DEBUG_FORCE_RESET || !storedToday || storedToday.date !== todayKey) {
    console.log(`[YDT] Resetting stats! (Force: ${DEBUG_FORCE_RESET}, Key Mismatch: ${storedToday?.date !== todayKey})`)
    const freshUsage = touchUsage(todayKey)
    await storage.set(TIME_TRACKING_TODAY_KEY, freshUsage)
    return true
  }
  return false
}

const ensureInitialized = async () => {
  if (!initializePromise) {
    initializePromise = (async () => {
      historyCache = (await storage.get<UsageHistory>(TIME_TRACKING_HISTORY_KEY)) || {}
      const sessionData =
        (await chrome.storage.session.get(LIVE_SESSIONS_KEY))[LIVE_SESSIONS_KEY] || {}

      liveSessions = new Map(
        Object.entries(sessionData).map(([tabId, session]) => [Number(tabId), session as LiveSession])
      )

      await loadSettings()
      await checkDateChange()
      await setupMidnightAlarm()

      storage.watch({
        settings: (chg) => {
          const oldSettings = chg?.oldValue as Partial<Settings>
          const newSettings = chg?.newValue as Partial<Settings>

          settingsCache = {
            ...defaultSettings,
            ...(newSettings || {})
          }

          void enqueue(async () => {
            await ensureInitialized()
            const todayKey = getLocalDateKey()
            const todayUsage = touchUsage(todayKey)

            // If limit duration changed, reset extensions for the day
            if (oldSettings?.dailyLimitMinutes !== newSettings?.dailyLimitMinutes) {
              if ((todayUsage.extensionsUsed || 0) > 0) {
                console.log(
                  `[YDT] Limit updated from ${oldSettings?.dailyLimitMinutes} to ${newSettings?.dailyLimitMinutes}, resetting extensions`
                )
                todayUsage.extensionsUsed = 0
                todayUsage.updatedAt = Date.now()
                historyCache[todayKey] = todayUsage
              }
            }

            await maybeTriggerDailyLimitAlert()
            await persistHistory()
          })
        }
      })
    })()
  }

  await initializePromise
}

const persistSessions = async () => {
  const sessionObject = Object.fromEntries(liveSessions.entries())
  await chrome.storage.session.set({ [LIVE_SESSIONS_KEY]: sessionObject })
}

const persistHistory = async () => {
  await storage.set(TIME_TRACKING_HISTORY_KEY, historyCache)
  await storage.set(
    TIME_TRACKING_TODAY_KEY,
    historyCache[getLocalDateKey()] || createEmptyDailyUsage(getLocalDateKey())
  )
}

const touchUsage = (dateKey: string) => {
  const existing = historyCache[dateKey]
  if (existing) {
    return existing
  }

  const created = createEmptyDailyUsage(dateKey)
  historyCache[dateKey] = created
  return created
}

const addDurationToHistory = (startAt: number, endAt: number, snapshot: TimeTrackingSnapshot) => {
  if (endAt <= startAt || !isSnapshotActive(snapshot)) return

  const bucket = getBucketForSnapshot(snapshot)
  let cursor = startAt

  while (cursor < endAt) {
    const segmentEnd = Math.min(getNextLocalMidnight(cursor), endAt)
    const segmentMs = segmentEnd - cursor
    const dateKey = getLocalDateKey(cursor)
    const usage = touchUsage(dateKey)

    usage.totalYoutubeMs += segmentMs
    if (bucket) {
      usage[bucket] += segmentMs
    }
    usage.updatedAt = Date.now()

    cursor = segmentEnd
  }
}

const broadcastDailyLimitAlert = async (limitMinutes: number, extensionsUsed: number) => {
  const tabs = await chrome.tabs.query({
    url: ["https://www.youtube.com/*", "https://m.youtube.com/*"]
  })

  const message: DailyLimitReachedMessage = {
    type: DAILY_LIMIT_REACHED,
    payload: {
      limitMinutes,
      extensionsUsed
    }
  }

  await Promise.all(
    tabs
      .filter((tab) => typeof tab.id === "number")
      .map(async (tab) => {
        try {
          await chrome.tabs.sendMessage(tab.id as number, message)
        } catch {}
      })
  )
}

const maybeTriggerDailyLimitAlert = async () => {
  await ensureInitialized()
  const todayKey = getLocalDateKey()
  const todayUsage = touchUsage(todayKey)

  console.log(`[YDT] Check Limit: enabled=${settingsCache.dailyLimitEnabled}, limit=${settingsCache.dailyLimitMinutes}, used=${todayUsage.totalYoutubeMs}ms (${Math.floor(todayUsage.totalYoutubeMs / 60000)}m)`)

  if (!settingsCache.dailyLimitEnabled || settingsCache.dailyLimitMinutes <= 0) {
    if (todayUsage.dailyLimitReachedAt) {
      console.log("[YDT] Limit disabled, clearing reached flag")
      todayUsage.dailyLimitReachedAt = null
      todayUsage.updatedAt = Date.now()
      historyCache[todayKey] = todayUsage
    }
    return
  }

  const currentTotalMinutes = Math.floor((todayUsage.totalYoutubeMs || 0) / 60000)
  const allowedLimitMinutes =
    (settingsCache.dailyLimitMinutes || 0) + (todayUsage.extensionsUsed || 0) * 5

  if (currentTotalMinutes < allowedLimitMinutes) {
    if (todayUsage.dailyLimitReachedAt) {
      console.log(`[YDT] Usage below limit (${currentTotalMinutes}m < ${allowedLimitMinutes}m), clearing reached flag`)
      todayUsage.dailyLimitReachedAt = null
      todayUsage.updatedAt = Date.now()
      historyCache[todayKey] = todayUsage
    }
    return
  }

  // Already reached, nothing to do
  if (todayUsage.dailyLimitReachedAt) {
    console.log(`[YDT] Limit already reached at ${new Date(todayUsage.dailyLimitReachedAt).toLocaleTimeString()}`)
    return
  }

  console.log(`[YDT] TRIGGERING LIMIT REACHED: ${currentTotalMinutes}m >= ${allowedLimitMinutes}m`)

  todayUsage.dailyLimitReachedAt = Date.now()
  todayUsage.updatedAt = Date.now()
  historyCache[todayKey] = todayUsage

  await chrome.notifications.create(`ydt-daily-limit-${todayKey}`, {
    type: "basic",
    iconUrl: chrome.runtime.getURL("assets/icon.png"),
    title: "YouDefineTube daily limit reached",
    message: `You've reached your ${settingsCache.dailyLimitMinutes}-minute YouTube limit for today.`
  })

  await broadcastDailyLimitAlert(settingsCache.dailyLimitMinutes, todayUsage.extensionsUsed || 0)
}

const handleReport = async (tabId: number, snapshot: TimeTrackingSnapshot) => {
  await ensureInitialized()

  const now = Date.now()
  const previous = liveSessions.get(tabId)

  if (previous) {
    addDurationToHistory(previous.lastTickAt, now, previous)
  }

  liveSessions.set(tabId, {
    ...snapshot,
    lastTickAt: now
  })

  await maybeTriggerDailyLimitAlert()
  await persistSessions()
  await persistHistory()
}

const handleTabRemoved = async (tabId: number) => {
  await ensureInitialized()

  const session = liveSessions.get(tabId)
  if (!session) return

  addDurationToHistory(session.lastTickAt, Date.now(), session)
  liveSessions.delete(tabId)

  await maybeTriggerDailyLimitAlert()
  await persistSessions()
  await persistHistory()
}

const enqueue = (task: () => Promise<void>) => {
  writeQueue = writeQueue.then(task).catch((error) => {
    console.error("Time tracking update failed", error)
  })

  return writeQueue
}

chrome.runtime.onMessage.addListener((message: any, sender, sendResponse) => {
  // Ensure background is initialized consistently
  const init = ensureInitialized()

  if (message?.type === REQUEST_EXTENSION) {
    void enqueue(async () => {
      await init
      const todayKey = getLocalDateKey()
      const todayUsage = touchUsage(todayKey)
      if ((todayUsage.extensionsUsed || 0) < 2) {
        todayUsage.extensionsUsed = (todayUsage.extensionsUsed || 0) + 1
        todayUsage.updatedAt = Date.now()
        historyCache[todayKey] = todayUsage
        await maybeTriggerDailyLimitAlert()
        await persistHistory()
        sendResponse({ ok: true, extensionsUsed: todayUsage.extensionsUsed })
      } else {
        sendResponse({ ok: false, error: "No extensions left" })
      }
    })
    return true
  }

  if (message?.type === CLOSE_ALL_TABS) {
    void (async () => {
      const tabs = await chrome.tabs.query({
        url: ["https://www.youtube.com/*", "https://m.youtube.com/*"]
      })
      const tabIds = tabs.map((t) => t.id).filter((id): id is number => typeof id === "number")
      if (tabIds.length > 0) {
        await chrome.tabs.remove(tabIds)
      }
      sendResponse({ ok: true })
    })()
    return true
  }

  if (message?.type === CLOSE_CURRENT_TAB) {
    if (sender.tab?.id) {
      void chrome.tabs.remove(sender.tab.id)
    }
    sendResponse({ ok: true })
    return true
  }

  if (message?.type === TIME_TRACKING_REPORT) {
    const tabId = sender.tab?.id
    if (typeof tabId !== "number") {
      sendResponse({ ok: false })
      return
    }

    void enqueue(async () => {
      await handleReport(tabId, message.payload)
      sendResponse({ ok: true })
    })
    return true
  }
})

chrome.tabs.onRemoved.addListener((tabId) => {
  void enqueue(async () => {
    await handleTabRemoved(tabId)
  })
})
