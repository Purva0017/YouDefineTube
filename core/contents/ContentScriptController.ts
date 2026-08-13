import { Storage } from "@plasmohq/storage"
import { defaultSettings, type Settings } from "~/lib/settings"
import { parseSettings } from "~/lib/parse-settings"
import { STORAGE_KEYS } from "~/lib/constants"
import { MESSAGES } from "~/lib/messaging"
import type { DailyUsage } from "~/lib/time-tracking"
import { isFocusScheduleActive } from "~/lib/focus-blocker"
import { isExtensionContextValid, safeSendMessage } from "~/lib/extension-runtime"
import { resolveYouTubeVideoTitle } from "~/lib/youtube-title"

import { DistractionManager } from "./DistractionManager"
import { TimeReporter } from "./TimeReporter"
import { OverlayManager } from "./OverlayManager"
import { NavigationManager } from "./NavigationManager"
import { SearchRefiner } from "./SearchRefiner"
import { AudioManager } from "./AudioManager"
import { HeaderButtonManager } from "./HeaderButtonManager"
import { InlinePanelManager } from "./InlinePanelManager"

export class ContentScriptController {
  private storage = new Storage()
  private settings: Settings = { ...defaultSettings }

  private readonly distractionManager = new DistractionManager()
  private readonly timeReporter = new TimeReporter()
  private readonly overlayManager = new OverlayManager()
  private readonly navigationManager = new NavigationManager()
  private readonly searchRefiner = new SearchRefiner()
  private readonly audioManager = new AudioManager()
  private readonly inlinePanelManager = new InlinePanelManager()
  private readonly headerButtonManager: HeaderButtonManager

  constructor() {
    this.headerButtonManager = new HeaderButtonManager(this.inlinePanelManager)
  }

  public async initialize(): Promise<void> {
    await this.loadSettings()
    this.watchStorage()

    const initUi = () => {
      this.inlinePanelManager.preload()
      this.headerButtonManager.init()
      this.audioManager.init()
      this.timeReporter.initialize()
      this.searchRefiner.observe(this.settings)
      this.onDomReady()

      document.addEventListener("yt-navigate-finish", () => this.onNavigate())

      chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
        if (message?.type === MESSAGES.DAILY_LIMIT_REACHED && this.settings.isExtensionEnabled && this.settings.enableDailyLimitAlert) {
          this.overlayManager.showDailyLimitAlert(
            message.payload.limitMinutes,
            message.payload.extensionsUsed || 0
          )
        } else if (message?.type === MESSAGES.GET_CURRENT_TIME) {
          const video = document.querySelector("video")
          sendResponse({
            time: video ? video.currentTime : null,
            title: resolveYouTubeVideoTitle(document.title)
          })
          return true
        } else if (message?.type === MESSAGES.SEEK_TO_TIME) {
          const video = document.querySelector("video")
          if (video) {
            video.currentTime = message.payload.time
            video.play().catch(() => {})
          }
        }
      })

      setInterval(() => {
        if (!isExtensionContextValid()) return
        this.navigationManager.handleRedirections(this.settings)
        this.checkFocusAndFriction()
      }, 1000)
    }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", initUi)
    } else {
      initUi()
    }
  }

  private onDomReady(): void {
    if (!document.body) return
    this.overlayManager.updateHomepageMessage(this.settings)
    this.checkFocusAndFriction()
    this.navigationManager.handleRedirections(this.settings)
  }

  private onNavigate(): void {
    this.navigationManager.onNavigation()
    this.headerButtonManager.refresh()
    if (!document.body) return
    this.overlayManager.updateHomepageMessage(this.settings)
    this.searchRefiner.update(this.settings)
    this.navigationManager.handleRedirections(this.settings)
    this.timeReporter.queueReport()
    this.checkFocusAndFriction()
  }

  private clearFrictionSession(): void {
    try {
      sessionStorage.removeItem("ydt_friction_prompted")
      sessionStorage.removeItem("ydt_friction_goal")
      sessionStorage.removeItem("ydt_friction_goal_dismissed")
    } catch {}
  }

  private dismissFrictionForSession = (): void => {
    try {
      sessionStorage.setItem("ydt_friction_goal_dismissed", "true")
    } catch {}
    this.overlayManager.removeFrictionPrompt()
    this.overlayManager.removeFrictionGoalOverlay()
  }

  private showGoalOverlay(goal: string): void {
    this.overlayManager.showFrictionGoalOverlay(
      goal,
      () => safeSendMessage({ type: MESSAGES.CLOSE_CURRENT_TAB }),
      this.dismissFrictionForSession
    )
  }

  private checkFocusAndFriction(): void {
    if (!document.body) return

    const focus = isFocusScheduleActive(this.settings)
    if (focus.active && focus.schedule) {
      this.overlayManager.removeFrictionPrompt()
      this.overlayManager.removeFrictionGoalOverlay()
      this.overlayManager.showFocusBlockerAlert(
        focus.schedule.name,
        focus.schedule.startTime,
        focus.schedule.endTime
      )
      return
    }

    this.overlayManager.removeFocusBlockerAlert()

    if (this.settings.isExtensionEnabled && this.settings.enableFrictionScreen) {
      let goalDismissed = false
      try {
        goalDismissed = sessionStorage.getItem("ydt_friction_goal_dismissed") === "true"
      } catch {}

      if (goalDismissed) {
        this.overlayManager.removeFrictionPrompt()
        this.overlayManager.removeFrictionGoalOverlay()
        return
      }

      let prompted = false
      let currentGoal = ""
      try {
        prompted = sessionStorage.getItem("ydt_friction_prompted") === "true"
        currentGoal = sessionStorage.getItem("ydt_friction_goal") || ""
      } catch {}

      if (!prompted) {
        this.overlayManager.showFrictionPrompt(
          (goal) => {
            try {
              sessionStorage.setItem("ydt_friction_prompted", "true")
              sessionStorage.setItem("ydt_friction_goal", goal)
            } catch {}
            this.overlayManager.removeFrictionPrompt()
            this.showGoalOverlay(goal)
          },
          this.dismissFrictionForSession
        )
      } else if (!currentGoal.trim()) {
        this.clearFrictionSession()
        this.overlayManager.removeFrictionGoalOverlay()
        this.overlayManager.showFrictionPrompt(
          (goal) => {
            try {
              sessionStorage.setItem("ydt_friction_prompted", "true")
              sessionStorage.setItem("ydt_friction_goal", goal)
            } catch {}
            this.overlayManager.removeFrictionPrompt()
            this.showGoalOverlay(goal)
          },
          this.dismissFrictionForSession
        )
      } else {
        this.showGoalOverlay(currentGoal)
      }
    } else {
      this.overlayManager.removeFrictionPrompt()
      this.overlayManager.removeFrictionGoalOverlay()
    }
  }

  private applySettingsToManagers(): void {
    this.distractionManager.apply(this.settings)
    this.audioManager.apply(this.settings)
    this.timeReporter.setTrackingEnabled(this.settings.isExtensionEnabled)
    this.searchRefiner.apply(this.settings)
  }

  private async loadSettings(): Promise<void> {
    const raw = await this.storage.get<Partial<Settings>>(STORAGE_KEYS.SETTINGS)
    this.settings = parseSettings(raw)
    this.applySettingsToManagers()

    if (document.body) {
      this.onDomReady()
    }

    const todayUsage = await this.storage.get<DailyUsage>(STORAGE_KEYS.TIME_TRACKING_TODAY)
    if (
      todayUsage?.dailyLimitReachedAt &&
      this.settings.enableDailyLimitAlert &&
      this.settings.isExtensionEnabled &&
      document.body
    ) {
      this.overlayManager.showDailyLimitAlert(
        this.settings.dailyLimitMinutes,
        todayUsage.extensionsUsed || 0
      )
    }
  }

  private watchStorage(): void {
    this.storage.watch({
      [STORAGE_KEYS.SETTINGS]: (chg) => {
        const prev = parseSettings(chg?.oldValue)
        const next = parseSettings(chg?.newValue)
        this.settings = next

        if (
          (prev.isExtensionEnabled && !next.isExtensionEnabled) ||
          (prev.enableFrictionScreen && !next.enableFrictionScreen)
        ) {
          this.clearFrictionSession()
        }

        this.applySettingsToManagers()
        if (document.body) {
          this.overlayManager.updateHomepageMessage(this.settings)
          this.checkFocusAndFriction()
        }

        const prevHideShorts = prev.isExtensionEnabled && prev.hideShorts
        const nextHideShorts = next.isExtensionEnabled && next.hideShorts

        if (!prevHideShorts && nextHideShorts) {
          this.navigationManager.handleRedirections(this.settings)
        }
        if (prevHideShorts && !nextHideShorts) {
          this.navigationManager.handleRevertToShortsIfApplicable()
        }
        this.navigationManager.handleRedirections(this.settings)

        void this.storage.get<DailyUsage>(STORAGE_KEYS.TIME_TRACKING_TODAY).then((usage) => {
          if (!usage?.dailyLimitReachedAt || !this.settings.enableDailyLimitAlert || !this.settings.isExtensionEnabled) {
            this.overlayManager.removeDailyLimitAlert()
          } else if (document.body) {
            this.overlayManager.showDailyLimitAlert(this.settings.dailyLimitMinutes, usage.extensionsUsed || 0)
          }
        })
      },
      [STORAGE_KEYS.TIME_TRACKING_TODAY]: (chg) => {
        const todayUsage = chg?.newValue as DailyUsage | undefined
        if (
          todayUsage?.dailyLimitReachedAt &&
          this.settings.enableDailyLimitAlert &&
          this.settings.isExtensionEnabled &&
          document.body
        ) {
          this.overlayManager.showDailyLimitAlert(this.settings.dailyLimitMinutes, todayUsage.extensionsUsed || 0)
        } else {
          this.overlayManager.removeDailyLimitAlert()
        }
      }
    })
  }
}
