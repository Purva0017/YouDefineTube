import type { PlasmoCSConfig } from "plasmo"
import { Storage } from "@plasmohq/storage"
import { defaultSettings, type Settings } from "~/lib/settings"
import { STORAGE_KEYS } from "~/lib/constants"
import { MESSAGES } from "~/lib/messaging"
import type { DailyUsage } from "~/lib/time-tracking"

import { DistractionManager } from "~/core/contents/DistractionManager"
import { TimeReporter } from "~/core/contents/TimeReporter"
import { OverlayManager } from "~/core/contents/OverlayManager"
import { NavigationManager } from "~/core/contents/NavigationManager"
import { SearchRefiner } from "~/core/contents/SearchRefiner"

export const config: PlasmoCSConfig = {
  matches: ["https://www.youtube.com/*", "https://m.youtube.com/*"],
  run_at: "document_start",
  all_frames: false
}

const storage = new Storage()
const distractionManager = new DistractionManager()
const timeReporter = new TimeReporter()
const overlayManager = new OverlayManager()
const navigationManager = new NavigationManager()
const searchRefiner = new SearchRefiner()

let settings: Settings = { ...defaultSettings }

const loadSettings = async () => {
  settings = {
    ...defaultSettings,
    ...(await storage.get<Partial<Settings>>(STORAGE_KEYS.SETTINGS))
  }
  
  distractionManager.apply(settings)
  
  // These require DOM body, so we call them safely
  if (document.body) {
    overlayManager.updateHomepageMessage(settings)
  }
  
  const todayUsage = await storage.get<DailyUsage>(STORAGE_KEYS.TIME_TRACKING_TODAY)
  if (todayUsage?.dailyLimitReachedAt && settings.enableDailyLimitAlert && document.body) {
    overlayManager.showDailyLimitAlert(settings.dailyLimitMinutes, todayUsage.extensionsUsed || 0)
  }
}

const watchStorage = () => {
  storage.watch({
    [STORAGE_KEYS.SETTINGS]: (chg) => {
      const prev = { ...defaultSettings, ...((chg?.oldValue as Partial<Settings>) || {}) }
      const next = { ...defaultSettings, ...((chg?.newValue as Partial<Settings>) || {}) }
      settings = next
      
      distractionManager.apply(settings)
      if (document.body) {
        overlayManager.updateHomepageMessage(settings)
        searchRefiner.update(settings)
      }
      
      if (!prev.hideShorts && next.hideShorts) {
        navigationManager.handleRedirections(settings)
      }
      if (prev.hideShorts && !next.hideShorts) {
        navigationManager.handleRevertToShortsIfApplicable()
      }
      navigationManager.handleRedirections(settings)

      void storage.get<DailyUsage>(STORAGE_KEYS.TIME_TRACKING_TODAY).then((usage) => {
        if (!usage?.dailyLimitReachedAt || !settings.enableDailyLimitAlert) {
          overlayManager.removeDailyLimitAlert()
        } else if (document.body) {
          overlayManager.showDailyLimitAlert(settings.dailyLimitMinutes, usage.extensionsUsed || 0)
        }
      })
    },
    [STORAGE_KEYS.TIME_TRACKING_TODAY]: (chg) => {
      const todayUsage = chg?.newValue as DailyUsage | undefined
      if (todayUsage?.dailyLimitReachedAt && settings.enableDailyLimitAlert && document.body) {
        overlayManager.showDailyLimitAlert(settings.dailyLimitMinutes, todayUsage.extensionsUsed || 0)
      } else {
        overlayManager.removeDailyLimitAlert()
      }
    }
  })
}

const initializeContentScript = async () => {
  await loadSettings()
  watchStorage()
  
  const initUi = () => {
    timeReporter.initialize()
    searchRefiner.observe(settings)
    overlayManager.updateHomepageMessage(settings)
    
    document.addEventListener("yt-navigate-finish", () => {
      overlayManager.updateHomepageMessage(settings)
      searchRefiner.update(settings)
      navigationManager.handleRedirections(settings)
      timeReporter.queueReport()
    })

    chrome.runtime.onMessage.addListener((message) => {
      if (message?.type === MESSAGES.DAILY_LIMIT_REACHED) {
        overlayManager.showDailyLimitAlert(message.payload.limitMinutes, message.payload.extensionsUsed || 0)
      }
    })

    // Periodical checks
    setInterval(() => {
      navigationManager.handleRedirections(settings)
    }, 1000)
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initUi)
  } else {
    initUi()
  }
}

initializeContentScript().catch(err => {
  console.error("Content script initialization failed:", err)
})
