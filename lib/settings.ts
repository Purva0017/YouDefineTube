export type Settings = {
  hideShorts: boolean
  hideHomepageRecommendations: boolean
  redirectToSubscriptions: boolean
  hideVideoSidebarRecommendations: boolean
  hideComments: boolean
  hideEndScreen: boolean
  hideLiveChat: boolean
  hidePeopleAlsoWatched: boolean
  hidePeopleAlsoSearchFor: boolean
  hideFromRelatedSearches: boolean
  hideChannelsNewToYou: boolean
  hideExploreMore: boolean
  enableDailyLimitAlert: boolean
  dailyLimitMinutes: number
  theme: "light" | "dark" | "system"
  isExtensionEnabled: boolean
}

export const defaultSettings: Settings = {
  hideShorts: true,
  hideHomepageRecommendations: false,
  redirectToSubscriptions: false,
  hideVideoSidebarRecommendations: false,
  hideComments: false,
  hideEndScreen: true,
  hideLiveChat: false,
  hidePeopleAlsoWatched: false,
  hidePeopleAlsoSearchFor: false,
  hideFromRelatedSearches: false,
  hideChannelsNewToYou: false,
  hideExploreMore: false,
  enableDailyLimitAlert: false,
  dailyLimitMinutes: 60,
  theme: "system",
  isExtensionEnabled: true
}

