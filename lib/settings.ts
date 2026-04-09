export type Settings = {
  hideShorts: boolean
  hideEndScreen: boolean
  hideComments: boolean
  hideLiveChat: boolean
  hideHomepageRecommendations: boolean
  hideSuggestedVideos: boolean
  dailyLimitEnabled: boolean
  dailyLimitMinutes: number
  theme: "light" | "dark" | "system"
  redirectHomeToSubscriptions: boolean
  hidePeopleAlsoSearchFor: boolean
  hidePeopleAlsoWatched: boolean
  hideExploreMore: boolean
  hideFromRelatedSearches: boolean
  hideChannelsNewToYou: boolean
}

export const defaultSettings: Settings = {
  hideShorts: true,
  hideEndScreen: true,
  hideComments: false,
  hideLiveChat: false,
  hideHomepageRecommendations: false,
  hideSuggestedVideos: false,
  dailyLimitEnabled: false,
  dailyLimitMinutes: 60,
  theme: "system",
  redirectHomeToSubscriptions: false,
  hidePeopleAlsoSearchFor: false,
  hidePeopleAlsoWatched: false,
  hideExploreMore: false,
  hideFromRelatedSearches: false,
  hideChannelsNewToYou: false
}
