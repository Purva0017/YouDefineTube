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
  theme: "system"
}
