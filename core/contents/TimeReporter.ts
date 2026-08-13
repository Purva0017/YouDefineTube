import { MESSAGES } from "~/lib/messaging"
import { TIMERS } from "~/lib/constants"
import type { TimeTrackingSnapshot, YoutubePageType } from "~/lib/time-tracking"
import { isExtensionContextValid, safeSendMessage } from "~/lib/extension-runtime"

export class TimeReporter {
  private trackedVideoEl: HTMLVideoElement | null = null
  private reportQueued = false
  private trackingEnabled = true

  private readonly onVideoPlay = () => this.queueReport()
  private readonly onVideoPause = () => this.queueReport()
  private readonly onVideoEnded = () => this.queueReport()

  public setTrackingEnabled(enabled: boolean): void {
    this.trackingEnabled = enabled
  }

  public initialize(): void {
    this.setupListeners()
    this.startHeartbeat()
    this.tick()
  }

  private setupListeners(): void {
    document.addEventListener("yt-navigate-finish", () => this.queueReport())
    document.addEventListener("visibilitychange", () => this.queueReport())
    window.addEventListener("focus", () => this.queueReport())
    window.addEventListener("blur", () => this.queueReport())
    window.addEventListener("pagehide", () => this.sendReport())
  }

  private startHeartbeat(): void {
    setInterval(() => {
      if (!isExtensionContextValid()) return
      this.ensureTrackedVideoListeners()
      this.sendReport()
    }, TIMERS.HEARTBEAT)
  }

  private tick(): void {
    if (!isExtensionContextValid()) return
    this.ensureTrackedVideoListeners()
    setTimeout(() => this.tick(), TIMERS.TICK)
  }

  public queueReport(): void {
    if (this.reportQueued) return
    this.reportQueued = true
    requestAnimationFrame(() => {
      this.reportQueued = false
      this.sendReport()
    })
  }

  private sendReport(): void {
    if (!this.trackingEnabled || !isExtensionContextValid()) return

    const message = {
      type: MESSAGES.TIME_TRACKING_REPORT,
      payload: this.buildSnapshot()
    }
    safeSendMessage(message)
  }

  private buildSnapshot(): TimeTrackingSnapshot {
    const video = document.querySelector<HTMLVideoElement>("video")
    return {
      pageType: this.getYoutubePageType(),
      videoId: this.getCurrentVideoId(),
      isVideoPlaying: !!video && !video.paused && !video.ended && video.readyState > 2,
      isDocumentVisible: document.visibilityState === "visible",
      isWindowFocused: document.hasFocus()
    }
  }

  private getYoutubePageType(): YoutubePageType {
    const { pathname } = window.location
    if (pathname === "/") return "home"
    if (pathname.startsWith("/watch")) return "watch"
    if (pathname.startsWith("/results")) return "search"
    if (pathname.startsWith("/shorts")) return "shorts"
    if (pathname.startsWith("/feed")) return "browse"
    if (pathname.match(/^\/(channel\/|c\/|user\/|@)/)) return "channel"
    return "other"
  }

  private getCurrentVideoId(): string | null {
    const type = this.getYoutubePageType()
    if (type === "watch") return new URLSearchParams(window.location.search).get("v")
    if (type === "shorts") return window.location.pathname.split("/").filter(Boolean)[1] || null
    return null
  }

  private detachVideoListeners(): void {
    if (!this.trackedVideoEl) return
    this.trackedVideoEl.removeEventListener("play", this.onVideoPlay)
    this.trackedVideoEl.removeEventListener("pause", this.onVideoPause)
    this.trackedVideoEl.removeEventListener("ended", this.onVideoEnded)
    this.trackedVideoEl = null
  }

  private ensureTrackedVideoListeners(): void {
    const video = document.querySelector<HTMLVideoElement>("video")
    if (this.trackedVideoEl === video) return

    this.detachVideoListeners()

    if (video) {
      this.trackedVideoEl = video
      this.trackedVideoEl.addEventListener("play", this.onVideoPlay)
      this.trackedVideoEl.addEventListener("pause", this.onVideoPause)
      this.trackedVideoEl.addEventListener("ended", this.onVideoEnded)
    }
  }
}
