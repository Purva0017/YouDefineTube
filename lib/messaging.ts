import type { TimeTrackingSnapshot } from "./time-tracking"

export const MESSAGES = {
  TIME_TRACKING_REPORT: "YDT_TIME_TRACKING_REPORT",
  DAILY_LIMIT_REACHED: "YDT_DAILY_LIMIT_REACHED",
  REQUEST_EXTENSION: "YDT_REQUEST_EXTENSION",
  CLOSE_ALL_TABS: "YDT_CLOSE_ALL_TABS",
  CLOSE_CURRENT_TAB: "YDT_CLOSE_CURRENT_TAB"
} as const

export type TimeTrackingReportMessage = {
  type: typeof MESSAGES.TIME_TRACKING_REPORT
  payload: TimeTrackingSnapshot
}

export type DailyLimitReachedMessage = {
  type: typeof MESSAGES.DAILY_LIMIT_REACHED
  payload: {
    limitMinutes: number
    extensionsUsed: number
  }
}

export type ExtensionRequestMessage = {
  type: typeof MESSAGES.REQUEST_EXTENSION
}

export type CloseTabsMessage = {
  type: typeof MESSAGES.CLOSE_ALL_TABS
}

export type CloseCurrentTabMessage = {
  type: typeof MESSAGES.CLOSE_CURRENT_TAB
}

export type Message =
  | TimeTrackingReportMessage
  | DailyLimitReachedMessage
  | ExtensionRequestMessage
  | CloseTabsMessage
  | CloseCurrentTabMessage
