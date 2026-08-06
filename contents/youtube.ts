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
import { AudioManager } from "~/core/contents/AudioManager"
import { HeaderButtonManager } from "~/core/contents/HeaderButtonManager"
import { InlinePanelManager } from "~/core/contents/InlinePanelManager"
import { isFocusScheduleActive } from "~/lib/focus-blocker"

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
const audioManager = new AudioManager()
const inlinePanelManager = new InlinePanelManager()
const headerButtonManager = new HeaderButtonManager(inlinePanelManager)

let settings: Settings = { ...defaultSettings }

const showGoalOverlay = (goal: string) => {
  overlayManager.showFrictionGoalOverlay(
    goal,
    () => {
      chrome.runtime.sendMessage({ type: MESSAGES.CLOSE_CURRENT_TAB })
    },
    () => {
      try {
        sessionStorage.setItem("ydt_friction_goal_dismissed", "true")
      } catch {}
      overlayManager.removeFrictionGoalOverlay()
    }
  )
}

const checkFocusAndFriction = () => {
  if (!document.body) return

  const focus = isFocusScheduleActive(settings)
  if (focus.active && focus.schedule) {
    overlayManager.removeFrictionPrompt()
    overlayManager.removeFrictionGoalOverlay()
    overlayManager.showFocusBlockerAlert(
      focus.schedule.name,
      focus.schedule.startTime,
      focus.schedule.endTime
    )
    return
  } else {
    overlayManager.removeFocusBlockerAlert()
  }

  if (settings.isExtensionEnabled && settings.enableFrictionScreen) {
    let goalDismissed = false
    try {
      goalDismissed = sessionStorage.getItem("ydt_friction_goal_dismissed") === "true"
    } catch {}

    if (goalDismissed) {
      overlayManager.removeFrictionPrompt()
      overlayManager.removeFrictionGoalOverlay()
      return
    }

    let prompted = false
    let currentGoal = ""
    try {
      prompted = sessionStorage.getItem("ydt_friction_prompted") === "true"
      currentGoal = sessionStorage.getItem("ydt_friction_goal") || ""
    } catch {}

    if (!prompted) {
      overlayManager.showFrictionPrompt((goal) => {
        try {
          sessionStorage.setItem("ydt_friction_prompted", "true")
          sessionStorage.setItem("ydt_friction_goal", goal)
        } catch {}
        overlayManager.removeFrictionPrompt()
        showGoalOverlay(goal)
      })
    } else {
      showGoalOverlay(currentGoal)
    }
  } else {
    overlayManager.removeFrictionPrompt()
    overlayManager.removeFrictionGoalOverlay()
  }
}

const loadSettings = async () => {
  settings = {
    ...defaultSettings,
    ...(await storage.get<Partial<Settings>>(STORAGE_KEYS.SETTINGS))
  }
  
  distractionManager.apply(settings)
  audioManager.apply(settings)
  
  // These require DOM body, so we call them safely
  if (document.body) {
    overlayManager.updateHomepageMessage(settings)
    checkFocusAndFriction()
  }
  
  const todayUsage = await storage.get<DailyUsage>(STORAGE_KEYS.TIME_TRACKING_TODAY)
  if (todayUsage?.dailyLimitReachedAt && settings.enableDailyLimitAlert && settings.isExtensionEnabled && document.body) {
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
      audioManager.apply(settings)
      if (document.body) {
        overlayManager.updateHomepageMessage(settings)
        searchRefiner.update(settings)
        checkFocusAndFriction()
      }
      
      const prevHideShorts = prev.isExtensionEnabled && prev.hideShorts
      const nextHideShorts = next.isExtensionEnabled && next.hideShorts

      if (!prevHideShorts && nextHideShorts) {
        navigationManager.handleRedirections(settings)
      }
      if (prevHideShorts && !nextHideShorts) {
        navigationManager.handleRevertToShortsIfApplicable()
      }
      navigationManager.handleRedirections(settings)

      void storage.get<DailyUsage>(STORAGE_KEYS.TIME_TRACKING_TODAY).then((usage) => {
        if (!usage?.dailyLimitReachedAt || !settings.enableDailyLimitAlert || !settings.isExtensionEnabled) {
          overlayManager.removeDailyLimitAlert()
        } else if (document.body) {
          overlayManager.showDailyLimitAlert(settings.dailyLimitMinutes, usage.extensionsUsed || 0)
        }
      })
    },
    [STORAGE_KEYS.TIME_TRACKING_TODAY]: (chg) => {
      const todayUsage = chg?.newValue as DailyUsage | undefined
      if (todayUsage?.dailyLimitReachedAt && settings.enableDailyLimitAlert && settings.isExtensionEnabled && document.body) {
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
    inlinePanelManager.preload()
    headerButtonManager.init()
    audioManager.init()
    timeReporter.initialize()
    searchRefiner.observe(settings)
    overlayManager.updateHomepageMessage(settings)
    checkFocusAndFriction()
    
    document.addEventListener("yt-navigate-finish", () => {
      headerButtonManager.refresh()
      overlayManager.updateHomepageMessage(settings)
      searchRefiner.update(settings)
      navigationManager.handleRedirections(settings)
      timeReporter.queueReport()
      checkFocusAndFriction()
    })

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message?.type === MESSAGES.DAILY_LIMIT_REACHED && settings.isExtensionEnabled) {
        overlayManager.showDailyLimitAlert(message.payload.limitMinutes, message.payload.extensionsUsed || 0)
      } else if (message?.type === MESSAGES.GET_CURRENT_TIME) {
        const video = document.querySelector("video")
        sendResponse({ time: video ? video.currentTime : null })
        return true
      } else if (message?.type === MESSAGES.SEEK_TO_TIME) {
        const video = document.querySelector("video")
        if (video) {
          video.currentTime = message.payload.time
          video.play().catch(() => {})
        }
      }
    })

    // Periodical checks
    setInterval(() => {
      navigationManager.handleRedirections(settings)
      checkFocusAndFriction()
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
