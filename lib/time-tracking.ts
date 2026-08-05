export type YoutubePageType =
  | "home"
  | "watch"
  | "search"
  | "shorts"
  | "channel"
  | "browse"
  | "other"

export type TimeTrackingSnapshot = {
  pageType: YoutubePageType
  videoId: string | null
  isVideoPlaying: boolean
  isDocumentVisible: boolean
  isWindowFocused: boolean
}

export type DailyUsage = {
  date: string
  totalYoutubeMs: number
  watchVideoMs: number
  browseMs: number
  searchMs: number
  dailyLimitReachedAt: number | null
  extensionsUsed: number
  updatedAt: number
}

export const getLocalDateKey = (timestamp = Date.now()) => {
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export const createEmptyDailyUsage = (date = getLocalDateKey()): DailyUsage => ({
  date, // shorthand notation for "date: date"
  totalYoutubeMs: 0,
  watchVideoMs: 0,
  browseMs: 0,
  searchMs: 0,
  dailyLimitReachedAt: null,
  extensionsUsed: 0,
  updatedAt: Date.now()
})

export const getNextLocalMidnight = (timestamp: number) => {
  const date = new Date(timestamp)
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1).getTime()
}
