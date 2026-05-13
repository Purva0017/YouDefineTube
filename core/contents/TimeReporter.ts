import { MESSAGES } from "~/lib/messaging"
import { TIMERS } from "~/lib/constants"
import type { TimeTrackingSnapshot, YoutubePageType } from "~/lib/time-tracking"

export class TimeReporter {
  private trackedVideoEl: HTMLVideoElement | null = null
  private reportQueued = false

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
      this.ensureTrackedVideoListeners()
      this.sendReport()
    }, TIMERS.HEARTBEAT)
  }

  private tick(): void {
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
    const message = {
      type: MESSAGES.TIME_TRACKING_REPORT,
      payload: this.buildSnapshot()
    }
    try {
      chrome.runtime.sendMessage(message, () => {
        void chrome.runtime.lastError
      })
    } catch {}
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

  private ensureTrackedVideoListeners(): void {
    const video = document.querySelector<HTMLVideoElement>("video")
    if (this.trackedVideoEl === video) return

    if (this.trackedVideoEl) {
      this.trackedVideoEl.removeEventListener("play", () => this.queueReport())
      this.trackedVideoEl.removeEventListener("pause", () => this.queueReport())
      this.trackedVideoEl.removeEventListener("ended", () => this.queueReport())
    }

    this.trackedVideoEl = video
    if (this.trackedVideoEl) {
      this.trackedVideoEl.addEventListener("play", () => this.queueReport())
      this.trackedVideoEl.addEventListener("pause", () => this.queueReport())
      this.trackedVideoEl.addEventListener("ended", () => this.queueReport())
    }
  }
}
