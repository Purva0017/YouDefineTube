export interface FocusSchedule {
  id: string
  name: string
  enabled: boolean
  startTime: string // "HH:MM"
  endTime: string   // "HH:MM"
  days: number[]    // [0..6]
}

export type Settings = {
  hideShorts: boolean
  hideHomepageRecommendations: boolean
  redirectToSubscriptions: boolean
  hideVideoSidebarRecommendations: boolean
  hideComments: boolean
  hideEndScreen: boolean
  hideLiveChat: boolean
  hidePlayables: boolean
  hidePeopleAlsoWatched: boolean
  hidePeopleAlsoSearchFor: boolean
  hideFromRelatedSearches: boolean
  hideChannelsNewToYou: boolean
  hideExploreMore: boolean
  gridSearchMode: boolean
  enableDailyLimitAlert: boolean
  dailyLimitMinutes: number
  theme: "light" | "dark"
  isExtensionEnabled: boolean
  activeTab: "stats" | "filters" | "bookmarks"
  isGeneralCategoryOpen: boolean
  isSearchCategoryOpen: boolean
  audioVolumeBoost: number
  audioVocalBoost: boolean
  isAudioCategoryOpen: boolean
  enableFocusBlocker: boolean
  focusSchedules: FocusSchedule[]
  enableFrictionScreen: boolean
  isFocusCategoryOpen: boolean
}

export const defaultSettings: Settings = {
  hideShorts: true,
  hideHomepageRecommendations: false,
  redirectToSubscriptions: false,
  hideVideoSidebarRecommendations: false,
  hideComments: false,
  hideEndScreen: true,
  hideLiveChat: false,
  hidePlayables: false,
  hidePeopleAlsoWatched: false,
  hidePeopleAlsoSearchFor: false,
  hideFromRelatedSearches: false,
  hideChannelsNewToYou: false,
  hideExploreMore: false,
  gridSearchMode: false,
  enableDailyLimitAlert: false,
  dailyLimitMinutes: 60,
  theme: "dark",
  isExtensionEnabled: true,
  activeTab: "stats",
  isGeneralCategoryOpen: true,
  isSearchCategoryOpen: true,
  audioVolumeBoost: 100,
  audioVocalBoost: false,
  isAudioCategoryOpen: true,
  enableFocusBlocker: false,
  focusSchedules: [
    {
      id: "bedtime",
      name: "Bedtime Blocker",
      enabled: true,
      startTime: "23:00",
      endTime: "07:00",
      days: [0, 1, 2, 3, 4, 5, 6]
    }
  ],
  enableFrictionScreen: false,
  isFocusCategoryOpen: true
}

export { focusScheduleSchema, settingsSchema } from "./settings.schema"
export { parseSettings } from "./parse-settings"


