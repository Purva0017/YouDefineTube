import * as z from "zod"

export const focusScheduleSchema = z.object({
  id: z.string(),
  name: z.string(),
  enabled: z.boolean(),
  startTime: z.string(),
  endTime: z.string(),
  days: z.array(z.number().int().min(0).max(6))
})

export const settingsSchema = z.object({
  hideShorts: z.boolean(),
  hideHomepageRecommendations: z.boolean(),
  redirectToSubscriptions: z.boolean(),
  hideVideoSidebarRecommendations: z.boolean(),
  hideComments: z.boolean(),
  hideEndScreen: z.boolean(),
  hideLiveChat: z.boolean(),
  hidePlayables: z.boolean(),
  hidePeopleAlsoWatched: z.boolean(),
  hidePeopleAlsoSearchFor: z.boolean(),
  hideFromRelatedSearches: z.boolean(),
  hideChannelsNewToYou: z.boolean(),
  hideExploreMore: z.boolean(),
  gridSearchMode: z.boolean(),
  enableDailyLimitAlert: z.boolean(),
  dailyLimitMinutes: z.number().int().min(1).max(24 * 60),
  theme: z.enum(["light", "dark"]),
  isExtensionEnabled: z.boolean(),
  activeTab: z.enum(["stats", "filters", "bookmarks"]),
  isGeneralCategoryOpen: z.boolean(),
  isSearchCategoryOpen: z.boolean(),
  audioVolumeBoost: z.number().int().min(100).max(300),
  audioVocalBoost: z.boolean(),
  isAudioCategoryOpen: z.boolean(),
  enableFocusBlocker: z.boolean(),
  focusSchedules: z.array(focusScheduleSchema),
  enableFrictionScreen: z.boolean(),
  isFocusCategoryOpen: z.boolean()
})
