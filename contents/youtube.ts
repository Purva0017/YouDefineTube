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
      settings = { ...defaults, ...((chg?.newValue as Partial<Settings>) || {}) }
      applyCss()
    }
  })
}

// Handle SPA navigations on YouTube (URL changes without full reload)
let lastUrl = location.href
const tickUrl = () => {
  if (location.href !== lastUrl) {
    lastUrl = location.href
    applyCss()
  }
  // re-check periodically; YouTube fires internal events but polling is robust
  setTimeout(tickUrl, 600)
}

;(async function main() {
  await loadSettings()
  watchSettings()
  tickUrl()
})()
