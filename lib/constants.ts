export const STORAGE_KEYS = {
  SETTINGS: "settings",
  TIME_TRACKING_HISTORY: "timeTrackingHistory",
  TIME_TRACKING_TODAY: "timeTrackingToday",
  LIVE_SESSIONS: "timeTrackingLiveSessions"
}

export const TIMERS = {
  HEARTBEAT: 15000,
  TICK: 600,
  RETRY_PAUSE: 200,
  MAX_PAUSE_ATTEMPTS: 30
}

export const SELECTORS = {
  SHORTS: [
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
    "ytd-reel-item-renderer",
    'ytd-rich-section-renderer:has(a[href*="/shorts/"])',
    "ytm-shorts-lockup-view-model",
    "ytm-shorts-lockup-view-model-v2",
    "grid-shelf-view-model:has(a[href*='/shorts/'])",
    "grid-shelf-view-model:has(ytm-shorts-lockup-view-model)",
    "grid-shelf-view-model:has(ytm-shorts-lockup-view-model-v2)",
    "ytd-video-renderer:has(a[href*='/shorts/'])",
    "ytd-video-renderer:has(a[href*=\"/shorts/\"])",
    "ytd-video-renderer:has(ytd-thumbnail-overlay-time-status-renderer[overlay-style='SHORTS'])",
    "ytd-rich-item-renderer:has(a[href*='/shorts/'])",
    "ytd-rich-item-renderer:has(ytd-thumbnail-overlay-time-status-renderer[overlay-style='SHORTS'])"
  ],
  END_SCREEN: [
    ".ytp-endscreen-content",
    ".ytp-endscreen-previous",
    ".ytp-ce-element",
    ".ytp-ce-video",
    ".ytp-ce-element-show"
  ],
  COMMENTS: ["#comments", "ytd-comments"],
  LIVE_CHAT: ["#chat", "#chat-container", "ytd-live-chat-frame"],
  SUGGESTED_VIDEOS: [
    "ytd-watch-next-secondary-results-renderer",
    "#related:not(:has(#chat)):not(:has(ytd-live-chat-frame))",
    "ytd-item-section-renderer:has(ytd-compact-video-renderer)",
    "ytm-item-section-renderer:has(ytm-video-with-context-renderer)"
  ],
  HOMEPAGE_RECOMMENDATIONS: [
    'ytd-browse[page-subtype="home"] ytd-rich-grid-renderer',
    'ytd-browse[page-subtype="home"] #contents ytd-rich-section-renderer',
    'ytd-browse[page-subtype="home"] #contents ytd-continuation-item-renderer',
    "ytm-rich-grid-renderer",
    "ytm-item-section-renderer"
  ],
  HOMEPAGE_MESSAGE_HOST: [
    'ytd-browse[page-subtype="home"] #primary',
    'ytd-browse[page-subtype="home"] #contents',
    "ytm-browse ytm-rich-grid-renderer",
    "ytm-browse ytm-item-section-renderer"
  ]
}
