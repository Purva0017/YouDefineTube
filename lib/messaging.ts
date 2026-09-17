import type { TimeTrackingSnapshot } from "./time-tracking"

export const MESSAGES = {
  TIME_TRACKING_REPORT: "YDT_TIME_TRACKING_REPORT",
  CLOSE_ALL_TABS: "YDT_CLOSE_ALL_TABS",
  CLOSE_CURRENT_TAB: "YDT_CLOSE_CURRENT_TAB",
  GET_CURRENT_TIME: "YDT_GET_CURRENT_TIME",
  SEEK_TO_TIME: "YDT_SEEK_TO_TIME",
  TOGGLE_INLINE_PANEL: "YDT_TOGGLE_INLINE_PANEL",
  OPEN_INLINE_PANEL: "YDT_OPEN_INLINE_PANEL"
} as const

export type TimeTrackingReportMessage = {
  type: typeof MESSAGES.TIME_TRACKING_REPORT
  payload: TimeTrackingSnapshot
}

export type CloseTabsMessage = {
  type: typeof MESSAGES.CLOSE_ALL_TABS
}

export type CloseCurrentTabMessage = {
  type: typeof MESSAGES.CLOSE_CURRENT_TAB
}

export type GetCurrentTimeMessage = {
  type: typeof MESSAGES.GET_CURRENT_TIME
}

export type SeekToTimeMessage = {
  type: typeof MESSAGES.SEEK_TO_TIME
  payload: {
    time: number
  }
}

export type Message =
  | TimeTrackingReportMessage
  | CloseTabsMessage
  | CloseCurrentTabMessage
  | GetCurrentTimeMessage
  | SeekToTimeMessage
