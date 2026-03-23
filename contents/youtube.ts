import type { PlasmoCSConfig } from "plasmo"
import { Storage } from "@plasmohq/storage"

import { defaultSettings, type Settings } from "~/lib/settings"
import {
  CLOSE_ALL_TABS,
  CLOSE_CURRENT_TAB,
  DAILY_LIMIT_REACHED,
  REQUEST_EXTENSION,
  TIME_TRACKING_REPORT,
  TIME_TRACKING_TODAY_KEY,
  type DailyLimitReachedMessage,
  type DailyUsage,
  type TimeTrackingReportMessage,
  type TimeTrackingSnapshot,
  type YoutubePageType
} from "~/lib/time-tracking"

export const config: PlasmoCSConfig = {
  matches: ["https://www.youtube.com/*", "https://m.youtube.com/*"],
  run_at: "document_idle",
  all_frames: false
}

const storage = new Storage()
let settings: Settings = { ...defaultSettings }

let styleEl: HTMLStyleElement | null = null
let homepageMessageEl: HTMLDivElement | null = null
let homepageMessageHostEl: HTMLElement | null = null
let homepageObserver: MutationObserver | null = null
let homepageUpdateQueued = false
let timeTrackingReportQueued = false
let trackedVideoEl: HTMLVideoElement | null = null
let dailyLimitAlertEl: HTMLDivElement | null = null

const TIME_TRACKING_HEARTBEAT_MS = 15000

const buildCss = (s: Settings) => {
  const rules: string[] = []

  if (s.hideShorts) {
    rules.push(
      [
        "ytd-reel-shelf-renderer",
        "ytd-reel-video-renderer",
        'ytd-guide-entry-renderer:has(a[href="/shorts"])',
        'ytd-guide-entry-renderer:has(a[href^="/shorts"])',
        'ytd-guide-entry-renderer:has(a[href*="/shorts"])',
        'ytd-guide-entry-renderer:has([title="Shorts"])',
        'ytd-guide-entry-renderer:has(yt-formatted-string[title="Shorts"])',
        'ytd-guide-entry-renderer:has(yt-formatted-string[aria-label="Shorts"])',
        'ytd-mini-guide-entry-renderer:has(a[href="/shorts"])',
        'ytd-mini-guide-entry-renderer:has(a[href^="/shorts"])',
        'ytd-mini-guide-entry-renderer:has(a[href*="/shorts"])',
        'ytd-mini-guide-entry-renderer:has([title="Shorts"])',
        'ytd-mini-guide-entry-renderer:has(yt-formatted-string[title="Shorts"])',
        'ytd-mini-guide-entry-renderer:has(yt-formatted-string[aria-label="Shorts"])',
        'tp-yt-paper-item:has(a[href="/shorts"])',
        'tp-yt-paper-item:has(a[href^="/shorts"])',
        'tp-yt-paper-item:has(a[href*="/shorts"])',
        'a[href*="/shorts/"]',
        'ytd-rich-section-renderer:has(a[href*="/shorts/"])',
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

  if (s.hideSuggestedVideos) {
    rules.push(
      [
        "ytd-watch-next-secondary-results-renderer",
        "#related:not(:has(#chat)):not(:has(ytd-live-chat-frame))",
        "ytd-item-section-renderer:has(ytd-compact-video-renderer)",
        "ytm-item-section-renderer:has(ytm-video-with-context-renderer)"
      ].join(", ") + " { display: none !important; }"
    )
  }

  if (s.hideHomepageRecommendations) {
    rules.push(
      [
        'ytd-browse[page-subtype="home"] ytd-rich-grid-renderer',
        'ytd-browse[page-subtype="home"] #contents ytd-rich-section-renderer',
        'ytd-browse[page-subtype="home"] #contents ytd-continuation-item-renderer',
        "ytm-rich-grid-renderer",
        "ytm-item-section-renderer"
      ].join(", ") + " { display: none !important; }"
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
  ensureStyle().textContent = buildCss(settings)
}

const isYoutubeHomePage = () => {
  return window.location.pathname === "/"
}

const getYoutubePageType = (): YoutubePageType => {
  const { pathname } = window.location

  if (pathname === "/") return "home"
  if (pathname.startsWith("/watch")) return "watch"
  if (pathname.startsWith("/results")) return "search"
  if (pathname.startsWith("/shorts")) return "shorts"
  if (pathname.startsWith("/feed")) return "browse"
  if (
    pathname.startsWith("/channel/") ||
    pathname.startsWith("/c/") ||
    pathname.startsWith("/user/") ||
    pathname.startsWith("/@")
  ) {
    return "channel"
  }

  return "other"
}

const getCurrentVideoId = () => {
  const pageType = getYoutubePageType()

  if (pageType === "watch") {
    return new URLSearchParams(window.location.search).get("v")
  }

  if (pageType === "shorts") {
    const parts = window.location.pathname.split("/").filter(Boolean)
    return parts[1] || null
  }

  return null
}

const buildTimeTrackingSnapshot = (): TimeTrackingSnapshot => {
  const video = document.querySelector<HTMLVideoElement>("video")

  return {
    pageType: getYoutubePageType(),
    videoId: getCurrentVideoId(),
    isVideoPlaying: !!video && !video.paused && !video.ended && video.readyState > 2,
    isDocumentVisible: document.visibilityState === "visible",
    isWindowFocused: document.hasFocus()
  }
}

const sendTimeTrackingReport = () => {
  const message: TimeTrackingReportMessage = {
    type: TIME_TRACKING_REPORT,
    payload: buildTimeTrackingSnapshot()
  }

  try {
    chrome.runtime.sendMessage(message, () => {
      void chrome.runtime.lastError
    })
  } catch {}
}

const queueTimeTrackingReport = () => {
  if (timeTrackingReportQueued) return

  timeTrackingReportQueued = true
  requestAnimationFrame(() => {
    timeTrackingReportQueued = false
    sendTimeTrackingReport()
  })
}

const onTrackedVideoEvent = () => {
  queueTimeTrackingReport()
}

const ensureTrackedVideoListeners = () => {
  const nextVideoEl = document.querySelector<HTMLVideoElement>("video")
  if (trackedVideoEl === nextVideoEl) return

  if (trackedVideoEl) {
    trackedVideoEl.removeEventListener("play", onTrackedVideoEvent)
    trackedVideoEl.removeEventListener("pause", onTrackedVideoEvent)
    trackedVideoEl.removeEventListener("ended", onTrackedVideoEvent)
  }

  trackedVideoEl = nextVideoEl

  if (trackedVideoEl) {
    trackedVideoEl.addEventListener("play", onTrackedVideoEvent)
    trackedVideoEl.addEventListener("pause", onTrackedVideoEvent)
    trackedVideoEl.addEventListener("ended", onTrackedVideoEvent)
  }
}

const pauseCurrentVideo = () => {
  const video = document.querySelector<HTMLVideoElement>("video")
  if (!video) return

  try {
    video.pause()
  } catch {}
}

const removeDailyLimitAlert = () => {
  if (!dailyLimitAlertEl) return
  dailyLimitAlertEl.remove()
  dailyLimitAlertEl = null
}

const showDailyLimitAlert = (limitMinutes: number, extensionsUsed: number = 0) => {
  if (dailyLimitAlertEl?.isConnected) {
    const extButton = dailyLimitAlertEl.querySelector<HTMLButtonElement>(
      'button[data-ydt-action="extend"]'
    )
    if (extButton) {
      extButton.disabled = extensionsUsed >= 2
      extButton.textContent = `Give me 5 more minutes (${extensionsUsed}/2 Used)`
      extButton.style.opacity = extensionsUsed >= 2 ? "0.5" : "1"
      extButton.style.cursor = extensionsUsed >= 2 ? "not-allowed" : "pointer"
    }
    return
  }

  removeDailyLimitAlert()
  pauseCurrentVideo()

  const overlay = document.createElement("div")
  overlay.setAttribute("data-youdefinetube-daily-limit-alert", "1")
  overlay.style.position = "fixed"
  overlay.style.inset = "0"
  overlay.style.display = "flex"
  overlay.style.alignItems = "center"
  overlay.style.justifyContent = "center"
  overlay.style.padding = "24px"
  overlay.style.background = "rgba(15, 23, 42, 0.72)"
  overlay.style.zIndex = "2147483647"

  const card = document.createElement("div")
  card.style.width = "min(520px, 100%)"
  card.style.background = "#ffffff"
  card.style.borderRadius = "20px"
  card.style.boxShadow = "0 24px 80px rgba(15, 23, 42, 0.28)"
  card.style.padding = "32px"
  card.style.fontFamily = "system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
  card.style.color = "#0f172a"
  card.style.textAlign = "center"

  const title = document.createElement("div")
  title.textContent = "Daily YouTube limit reached"
  title.style.fontSize = "26px"
  title.style.fontWeight = "800"
  title.style.marginBottom = "14px"

  const body = document.createElement("div")
  body.textContent = `You've spent your ${limitMinutes} minutes on YouTube today. Your time is valuable—take a break or finish up intentionally.`
  body.style.fontSize = "16px"
  body.style.lineHeight = "1.6"
  body.style.marginBottom = "28px"
  body.style.color = "#475569"

  const actions = document.createElement("div")
  actions.style.display = "flex"
  actions.style.flexDirection = "column"
  actions.style.gap = "12px"

  const extendButton = document.createElement("button")
  extendButton.type = "button"
  extendButton.setAttribute("data-ydt-action", "extend")
  extendButton.textContent = `Give me 5 more minutes (${extensionsUsed}/2 Used)`
  extendButton.disabled = extensionsUsed >= 2
  extendButton.style.border = "none"
  extendButton.style.borderRadius = "12px"
  extendButton.style.padding = "14px 20px"
  extendButton.style.fontWeight = "700"
  extendButton.style.fontSize = "15px"
  extendButton.style.cursor = extensionsUsed >= 2 ? "not-allowed" : "pointer"
  extendButton.style.background = "#0f172a"
  extendButton.style.color = "#ffffff"
  extendButton.style.opacity = extensionsUsed >= 2 ? "0.5" : "1"
  extendButton.addEventListener("click", () => {
    chrome.runtime.sendMessage({ type: REQUEST_EXTENSION }, (res) => {
      if (res?.ok) {
        removeDailyLimitAlert()
      }
    })
  })

  const closeCurrentButton = document.createElement("button")
  closeCurrentButton.type = "button"
  closeCurrentButton.textContent = "Close this tab"
  closeCurrentButton.style.border = "1px solid #e2e8f0"
  closeCurrentButton.style.borderRadius = "12px"
  closeCurrentButton.style.padding = "12px 20px"
  closeCurrentButton.style.fontWeight = "600"
  closeCurrentButton.style.fontSize = "15px"
  closeCurrentButton.style.cursor = "pointer"
  closeCurrentButton.style.background = "#ffffff"
  closeCurrentButton.style.color = "#0f172a"
  closeCurrentButton.addEventListener("click", () => {
    chrome.runtime.sendMessage({ type: CLOSE_CURRENT_TAB })
  })

  const closeAllButton = document.createElement("button")
  closeAllButton.type = "button"
  closeAllButton.textContent = "Close all YouTube tabs"
  closeAllButton.style.border = "none"
  closeAllButton.style.borderRadius = "12px"
  closeAllButton.style.padding = "12px 20px"
  closeAllButton.style.fontWeight = "600"
  closeAllButton.style.fontSize = "15px"
  closeAllButton.style.cursor = "pointer"
  closeAllButton.style.background = "transparent"
  closeAllButton.style.color = "#ef4444"
  closeAllButton.addEventListener("click", () => {
    chrome.runtime.sendMessage({ type: CLOSE_ALL_TABS })
  })

  actions.appendChild(extendButton)
  actions.appendChild(closeCurrentButton)
  actions.appendChild(closeAllButton)
  card.appendChild(title)
  card.appendChild(body)
  card.appendChild(actions)
  overlay.appendChild(card)
  document.body.appendChild(overlay)
  dailyLimitAlertEl = overlay
}

const queueHomepageMessageUpdate = () => {
  if (homepageUpdateQueued) return

  homepageUpdateQueued = true
  requestAnimationFrame(() => {
    homepageUpdateQueued = false
    updateHomepageMessage()
  })
}

const removeHomepageMessage = () => {
  if (homepageMessageEl) {
    homepageMessageEl.remove()
    homepageMessageEl = null
  }
  homepageMessageHostEl = null
}

const getHomepageMessageHost = () => {
  const selectors = [
    'ytd-browse[page-subtype="home"] #primary',
    'ytd-browse[page-subtype="home"] #contents',
    "ytm-browse ytm-rich-grid-renderer",
    "ytm-browse ytm-item-section-renderer"
  ]

  for (const selector of selectors) {
    const el = document.querySelector<HTMLElement>(selector)
    if (el) return el
  }

  return null
}

const showHomepageMessage = () => {
  const host = getHomepageMessageHost()
  if (!host) {
    removeHomepageMessage()
    return
  }

  if (
    homepageMessageEl &&
    homepageMessageEl.isConnected &&
    homepageMessageHostEl === host &&
    host.contains(homepageMessageEl)
  ) {
    return
  }

  removeHomepageMessage()

  homepageMessageEl = document.createElement("div")
  homepageMessageEl.setAttribute("data-youdefinetube-home-message", "1")
  homepageMessageEl.style.display = "flex"
  homepageMessageEl.style.alignItems = "center"
  homepageMessageEl.style.justifyContent = "center"
  homepageMessageEl.style.minHeight = "calc(100vh - 160px)"
  homepageMessageEl.style.width = "100%"
  homepageMessageEl.style.boxSizing = "border-box"
  homepageMessageEl.style.padding = "32px 24px"

  const text = document.createElement("div")
  text.style.maxWidth = "520px"
  text.style.textAlign = "center"
  text.style.fontFamily = "system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
  text.style.fontSize = "22px"
  text.style.fontWeight = "700"
  text.style.lineHeight = "1.35"
  text.style.color = "#0f172a"
  text.style.padding = "24px 28px"
  text.style.borderRadius = "16px"
  text.style.background = "rgba(255, 255, 255, 0.92)"
  text.style.boxShadow = "0 10px 30px rgba(15, 23, 42, 0.08)"
  text.textContent =
    "Homepage recommendations are hidden. Search for what you came to watch."

  homepageMessageEl.appendChild(text)
  host.appendChild(homepageMessageEl)
  homepageMessageHostEl = host
}

const updateHomepageMessage = () => {
  if (settings.hideHomepageRecommendations && isYoutubeHomePage()) {
    showHomepageMessage()
    return
  }
  removeHomepageMessage()
}

const ensureHomepageObserver = () => {
  if (homepageObserver) return

  homepageObserver = new MutationObserver(() => {
    if (!settings.hideHomepageRecommendations || !isYoutubeHomePage()) return
    queueHomepageMessageUpdate()
  })

  homepageObserver.observe(document.body, {
    childList: true,
    subtree: true
  })
}

const loadSettings = async () => {
  settings = {
    ...defaultSettings,
    ...(await storage.get<Partial<Settings>>("settings"))
  }
  applyCss()
  updateHomepageMessage()

  // Check initial limit status
  const todayUsage = await storage.get<DailyUsage>(TIME_TRACKING_TODAY_KEY)
  if (todayUsage?.dailyLimitReachedAt && settings.dailyLimitEnabled) {
    showDailyLimitAlert(settings.dailyLimitMinutes, todayUsage.extensionsUsed || 0)
  }
}

const watchSettings = () => {
  storage.watch({
    settings: (chg) => {
      const prev = { ...defaultSettings, ...((chg?.oldValue as Partial<Settings>) || {}) }
      const next = { ...defaultSettings, ...((chg?.newValue as Partial<Settings>) || {}) }
      settings = next
      applyCss()
      updateHomepageMessage()
      if (!prev.hideShorts && next.hideShorts) {
        handleShortsRoute()
      }
      if (prev.hideShorts && !next.hideShorts) {
        handleRevertToShortsIfApplicable()
      }

      // Re-evaluate alert if settings changed (e.g. limit disabled/increased)
      void storage.get<DailyUsage>(TIME_TRACKING_TODAY_KEY).then((usage) => {
        if (!usage?.dailyLimitReachedAt || !settings.dailyLimitEnabled) {
          removeDailyLimitAlert()
        } else {
          showDailyLimitAlert(settings.dailyLimitMinutes, usage.extensionsUsed || 0)
        }
      })
    },
    [TIME_TRACKING_TODAY_KEY]: (chg) => {
      const todayUsage = chg?.newValue as DailyUsage | undefined
      if (todayUsage?.dailyLimitReachedAt && settings.dailyLimitEnabled) {
        showDailyLimitAlert(settings.dailyLimitMinutes, todayUsage.extensionsUsed || 0)
      } else {
        removeDailyLimitAlert()
      }
    }
  })
}

let lastUrl = location.href
const tickUrl = () => {
  ensureTrackedVideoListeners()

  if (location.href !== lastUrl) {
    lastUrl = location.href
    applyCss()
    updateHomepageMessage()
    handleShortsRoute()
    handleWatchPauseFromFlag()
    handleShortsPauseFromFlag()
    queueTimeTrackingReport()
  }

  if (
    settings.hideHomepageRecommendations &&
    isYoutubeHomePage() &&
    (!homepageMessageEl || !homepageMessageEl.isConnected)
  ) {
    queueHomepageMessageUpdate()
  }

  setTimeout(tickUrl, 600)
}

;(async function main() {
  await loadSettings()
  watchSettings()
  ensureHomepageObserver()
  ensureTrackedVideoListeners()
  document.addEventListener("yt-navigate-finish", queueHomepageMessageUpdate)
  document.addEventListener("yt-navigate-finish", queueTimeTrackingReport)
  document.addEventListener("visibilitychange", queueTimeTrackingReport)
  window.addEventListener("focus", queueTimeTrackingReport)
  window.addEventListener("blur", queueTimeTrackingReport)
  window.addEventListener("pagehide", sendTimeTrackingReport)
  chrome.runtime.onMessage.addListener((message: DailyLimitReachedMessage) => {
    if (message?.type !== DAILY_LIMIT_REACHED) return
    showDailyLimitAlert(message.payload.limitMinutes, message.payload.extensionsUsed || 0)
  })
  setInterval(() => {
    ensureTrackedVideoListeners()
    sendTimeTrackingReport()
  }, TIME_TRACKING_HEARTBEAT_MS)
  updateHomepageMessage()
  sendTimeTrackingReport()
  handleShortsRoute()
  handleWatchPauseFromFlag()
  handleShortsPauseFromFlag()
  tickUrl()
})()

function handleShortsRoute() {
  if (!settings.hideShorts) return
  const { pathname } = window.location
  if (!pathname.startsWith("/shorts")) return

  const parts = pathname.split("/").filter(Boolean)
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
    try {
      video.pause()
      video.muted = true
    } catch {}
  }
}

function handleWatchPauseFromFlag() {
  if (!settings.hideShorts) return
  const sp = new URLSearchParams(window.location.search)
  if (sp.get("ydt_pause") !== "1") return

  let attempts = 0
  const maxAttempts = 30

  const tryPause = () => {
    const video = document.querySelector<HTMLVideoElement>("video")
    if (video) {
      try {
        video.muted = true
        video.pause()
      } catch {}

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

function handleShortsPauseFromFlag() {
  const { pathname, search } = window.location
  if (!pathname.startsWith("/shorts")) return

  const sp = new URLSearchParams(search)
  if (sp.get("ydt_pause") !== "1") return

  let attempts = 0
  const maxAttempts = 30

  const tryPause = () => {
    const video = document.querySelector<HTMLVideoElement>("video")
    if (video) {
      try {
        video.muted = true
        video.pause()
      } catch {}

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

function handleRevertToShortsIfApplicable() {
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
