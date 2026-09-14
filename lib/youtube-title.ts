const TITLE_SELECTORS = [
  "h1.ytd-watch-metadata yt-formatted-string",
  "ytd-watch-metadata h1 yt-formatted-string",
  "#title h1 yt-formatted-string",
  "h1.ytd-video-primary-info-renderer",
  "yt-formatted-string.ytd-watch-metadata",
  "h2.ytd-media-headline-title yt-formatted-string",
  "yt-shorts-title"
]

/** Read the in-page video title (not the tab title, which includes notification counts). */
export function getYouTubeVideoTitleFromDom(doc: Document = document): string | null {
  for (const selector of TITLE_SELECTORS) {
    const text = doc.querySelector(selector)?.textContent?.trim()
    if (text) return text
  }
  return null
}

/** Strip YouTube tab-title noise: leading "(3)" counts and trailing " - YouTube". */
export function stripYouTubeTabTitle(tabTitle: string): string {
  let title = tabTitle.trim()
  title = title.replace(/^\(\d+\)\s*/, "")
  title = title.replace(/\s*-\s*YouTube\s*$/i, "")
  return title.trim()
}

/** Prefer DOM video title; fall back to sanitized tab title. */
export function resolveYouTubeVideoTitle(tabTitle?: string | null, doc?: Document): string {
  const domTitle = getYouTubeVideoTitleFromDom(doc ?? document)
  if (domTitle) return domTitle
  if (tabTitle) {
    const cleaned = stripYouTubeTabTitle(tabTitle)
    if (cleaned) return cleaned
  }
  return "Video"
}
