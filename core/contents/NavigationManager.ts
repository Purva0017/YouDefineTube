import type { Settings } from "~/lib/settings"
import { TIMERS } from "~/lib/constants"

export class NavigationManager {
  public handleRedirections(settings: Settings): void {
    this.handleHomeRedirect(settings)
    this.handleShortsRoute(settings)
    this.handleWatchPauseFromFlag(settings)
    this.handleShortsPauseFromFlag()
  }

  private handleHomeRedirect(settings: Settings): void {
    if (settings.hideHomepageRecommendations && settings.redirectToSubscriptions && window.location.pathname === "/") {
      window.location.replace("/feed/subscriptions")
    }
  }

  private handleShortsRoute(settings: Settings): void {
    if (!settings.hideShorts || !window.location.pathname.startsWith("/shorts")) return

    const parts = window.location.pathname.split("/").filter(Boolean)
    const id = parts[1]

    if (id && !new URLSearchParams(window.location.search).get("v")) {
      const url = new URL(`${window.location.origin}/watch`)
      url.searchParams.set("v", id)
      url.searchParams.set("ydt_pause", "1")
      url.searchParams.set("ydt_from", "shorts")

      try {
        sessionStorage.setItem("ydt_from_shorts_v", id)
        sessionStorage.setItem("ydt_from_shorts_ts", String(Date.now()))
      } catch {}

      window.location.replace(url.toString())
      return
    }

    const video = document.querySelector<HTMLVideoElement>("video")
    if (video) {
      video.pause()
      video.muted = true
    }
  }

  private handleWatchPauseFromFlag(settings: Settings): void {
    if (!settings.hideShorts) return
    const sp = new URLSearchParams(window.location.search)
    if (sp.get("ydt_pause") !== "1") return

    let attempts = 0
    const tryPause = () => {
      const video = document.querySelector<HTMLVideoElement>("video")
      if (video) {
        video.muted = true
        video.pause()
        sp.delete("ydt_pause")
        const url = new URL(window.location.href)
        url.search = sp.toString()
        history.replaceState(null, "", url.toString())
        return
      }
      if (++attempts < TIMERS.MAX_PAUSE_ATTEMPTS) setTimeout(tryPause, TIMERS.RETRY_PAUSE)
    }
    tryPause()
  }

  private handleShortsPauseFromFlag(): void {
    if (!window.location.pathname.startsWith("/shorts")) return
    const sp = new URLSearchParams(window.location.search)
    if (sp.get("ydt_pause") !== "1") return

    let attempts = 0
    const tryPause = () => {
      const video = document.querySelector<HTMLVideoElement>("video")
      if (video) {
        video.muted = true
        video.pause()
        sp.delete("ydt_pause")
        const url = new URL(window.location.href)
        url.search = sp.toString()
        history.replaceState(null, "", url.toString())
        return
      }
      if (++attempts < TIMERS.MAX_PAUSE_ATTEMPTS) setTimeout(tryPause, TIMERS.RETRY_PAUSE)
    }
    tryPause()
  }

  public handleRevertToShortsIfApplicable(): void {
    const url = new URL(window.location.href)
    if (url.pathname !== "/watch") return

    const videoId = url.searchParams.get("v")
    if (!videoId) return

    const from = url.searchParams.get("ydt_from")
    let allowBySession = false

    try {
      const sessionVideoId = sessionStorage.getItem("ydt_from_shorts_v")
      const tsRaw = sessionStorage.getItem("ydt_from_shorts_ts")
      const ts = tsRaw ? Number(tsRaw) : 0
      if (sessionVideoId === videoId && Date.now() - ts < 10 * 60 * 1000) {
        allowBySession = true
      }
    } catch {}

    if (from !== "shorts" && !allowBySession) return

    const target = new URL(`${window.location.origin}/shorts/${encodeURIComponent(videoId)}`)
    target.searchParams.set("ydt_pause", "1")

    try {
      sessionStorage.removeItem("ydt_from_shorts_v")
      sessionStorage.removeItem("ydt_from_shorts_ts")
    } catch {}

    window.location.replace(target.toString())
  }
}
