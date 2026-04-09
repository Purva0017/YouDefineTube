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

export type TimeTrackingReportMessage = {
  type: "YDT_TIME_TRACKING_REPORT"
  payload: TimeTrackingSnapshot
}

export type DailyLimitReachedMessage = {
  type: typeof DAILY_LIMIT_REACHED
  payload: {
    limitMinutes: number
    extensionsUsed: number
  }
}

export type ExtensionRequestMessage = {
  type: typeof REQUEST_EXTENSION
}

export type CloseTabsMessage = {
  type: typeof CLOSE_ALL_TABS
}

export type CloseCurrentTabMessage = {
  type: typeof CLOSE_CURRENT_TAB
}

export const TIME_TRACKING_HISTORY_KEY = "timeTrackingHistory"
export const TIME_TRACKING_TODAY_KEY = "timeTrackingToday"
export const TIME_TRACKING_REPORT = "YDT_TIME_TRACKING_REPORT"
export const DAILY_LIMIT_REACHED = "YDT_DAILY_LIMIT_REACHED"
export const REQUEST_EXTENSION = "YDT_REQUEST_EXTENSION"
export const CLOSE_ALL_TABS = "YDT_CLOSE_ALL_TABS"
export const CLOSE_CURRENT_TAB = "YDT_CLOSE_CURRENT_TAB"

export const getLocalDateKey = (timestamp = Date.now()) => {
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export const createEmptyDailyUsage = (date = getLocalDateKey()): DailyUsage => ({
  date,
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
