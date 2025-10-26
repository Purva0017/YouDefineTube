import type { PlasmoCSConfig } from "plasmo"
import { Storage } from "@plasmohq/storage"

export const config: PlasmoCSConfig = {
  matches: ["https://www.youtube.com/*", "https://m.youtube.com/*"],
  run_at: "document_idle",
  all_frames: false
}

type Settings = {
  hideShorts: boolean
  hideEndScreen: boolean
  hideComments: boolean
  hideLiveChat: boolean
}

const defaults: Settings = {
  hideShorts: true,
  hideEndScreen: true,
  hideComments: false,
  hideLiveChat: false
}

const storage = new Storage()
let settings: Settings = { ...defaults }
let styleEl: HTMLStyleElement | null = null

const buildCss = (s: Settings) => {
  const rules: string[] = []

  if (s.hideShorts) {
    rules.push(
      [
        // Home and channel shelves
        "ytd-reel-shelf-renderer",
        // Sidebar/watch page shorts rows
        "ytd-reel-video-renderer",
        // Any anchor pointing to /shorts/
        'a[href*="/shorts/"]',
        // Shorts shelves in rich sections (modern layouts)
        'ytd-rich-section-renderer:has(a[href*="/shorts/"])',
        // Shorts rows within related sidebar
        "ytd-reel-item-renderer"
      ].join(", ") + " { display: none !important; }"
    )
  }

  if (s.hideEndScreen) {
    rules.push(
      [
        ".ytp-endscreen-content",
        ".ytp-endscreen-previous",
        ".ytp-ce-element",
        ".ytp-ce-video",
        ".ytp-ce-element-show"
      ].join(", ") + " { display: none !important; }"
    )
  }

  if (s.hideComments) {
    rules.push(["#comments", "ytd-comments"].join(", ") + " { display: none !important; }")
  }

  if (s.hideLiveChat) {
    rules.push(
      ["#chat", "#chat-container", "ytd-live-chat-frame"].join(", ") +
        " { display: none !important; }"
    )
  }

  return rules.join("\n")
}

const ensureStyle = () => {
  if (!styleEl) {
    styleEl = document.createElement("style")
    styleEl.setAttribute("data-youdefinetube", "active")
    document.documentElement.appendChild(styleEl)
  }
  return styleEl
}

const applyCss = () => {
  const css = buildCss(settings)
  ensureStyle().textContent = css
}

const loadSettings = async () => {
  settings = {
    ...defaults,
    ...(await storage.get<Partial<Settings>>("settings"))
  }
  applyCss()
}

const watchSettings = () => {
  storage.watch({
    settings: (chg) => {
      const prev = { ...defaults, ...((chg?.oldValue as Partial<Settings>) || {}) }
      const next = { ...defaults, ...((chg?.newValue as Partial<Settings>) || {}) }
      settings = next
      applyCss()
      // If user just enabled Hide Shorts while on a Shorts page, handle it now
      if (!prev.hideShorts && next.hideShorts) {
        handleShortsRoute()
      }
    }
  })
}

// Handle SPA navigations on YouTube (URL changes without full reload)
let lastUrl = location.href
const tickUrl = () => {
  if (location.href !== lastUrl) {
    lastUrl = location.href
    applyCss()
    handleShortsRoute()
    handleWatchPauseFromFlag()
  }
  // re-check periodically; YouTube fires internal events but polling is robust
  setTimeout(tickUrl, 600)
}

;(async function main() {
  await loadSettings()
  watchSettings()
  // On first load as well
  handleShortsRoute()
  handleWatchPauseFromFlag()
  tickUrl()
})()

/**
 * When Hide Shorts is enabled and the user lands on a Shorts page (/shorts/VIDEO_ID),
 * prefer redirecting to the regular watch URL (/watch?v=VIDEO_ID) to avoid the
 * Shorts UI. If we cannot parse the ID, pause/mute any playing video to stop audio.
 */
function handleShortsRoute() {
  if (!settings?.hideShorts) return
  const { pathname } = window.location
  if (!pathname.startsWith("/shorts")) return

  const parts = pathname.split("/").filter(Boolean)
  // Expected: ["shorts", "VIDEO_ID"]
  const id = parts[1]

  if (id && !new URLSearchParams(window.location.search).get("v")) {
    // Replace so Back goes to the previous non-Shorts page. Add pause flag to avoid autoplay.
    const url = new URL(`${window.location.origin}/watch`)
    url.searchParams.set("v", id)
    url.searchParams.set("ydt_pause", "1")
    const target = url.toString()
    window.location.replace(target)
    return
  }

  // Fallback: pause/mute if redirect not possible
  const vid = document.querySelector<HTMLVideoElement>("video")
  if (vid) {
    try {
      vid.pause()
      vid.muted = true
    } catch {}
  }
}

/**
 * If redirected from Shorts with ydt_pause=1, pause and mute the video on watch page.
 * Clean up the URL param afterwards.
 */
function handleWatchPauseFromFlag() {
  if (!settings?.hideShorts) return
  const sp = new URLSearchParams(window.location.search)
  if (sp.get("ydt_pause") !== "1") return

  let attempts = 0
  const maxAttempts = 30 // ~6s at 200ms intervals
  const tryPause = () => {
    const vid = document.querySelector<HTMLVideoElement>("video")
    if (vid) {
      try {
        vid.muted = true
        vid.pause()
      } catch {}
      // Remove the flag so refreshes don't keep pausing
      sp.delete("ydt_pause")
      const url = new URL(window.location.href)
      url.search = sp.toString()
      history.replaceState(null, "", url.toString())
      return
    }
    attempts++
    if (attempts < maxAttempts) setTimeout(tryPause, 200)
  }
  tryPause()
}
