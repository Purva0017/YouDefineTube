import { SELECTORS } from "~/lib/constants"
import type { Settings } from "~/lib/settings"

export class DistractionManager {
  private styleEl: HTMLStyleElement | null = null

  public apply(settings: Settings): void {
    const rules: string[] = []

    if (!settings.isExtensionEnabled) {
      this.ensureStyle().textContent = ""
      return
    }

    if (settings.hideShorts) {
      rules.push(...SELECTORS.SHORTS.map(sel => `${sel} { display: none !important; }`))
    }

    if (settings.hideEndScreen) {
      rules.push(`${SELECTORS.END_SCREEN.join(", ")} { display: none !important; }`)
    }

    if (settings.hideComments) {
      rules.push(`${SELECTORS.COMMENTS.join(", ")} { display: none !important; }`)
    }

    if (settings.hideLiveChat) {
      rules.push(`${SELECTORS.LIVE_CHAT.join(", ")} { display: none !important; }`)
    }

    if (settings.hidePlayables) {
      rules.push(`${SELECTORS.PLAYABLES.join(", ")} { display: none !important; }`)
    }

    if (settings.hideVideoSidebarRecommendations) {
      rules.push(`${SELECTORS.SUGGESTED_VIDEOS.join(", ")} { display: none !important; }`)
    }

    if (settings.hideHomepageRecommendations) {
      rules.push(`${SELECTORS.HOMEPAGE_RECOMMENDATIONS.join(", ")} { display: none !important; }`)
    }

    if (settings.hidePeopleAlsoSearchFor) {
      rules.push("ytd-horizontal-card-list-renderer:has(ytd-search-refinement-card-renderer) { display: none !important; }")
    }

    if (settings.hidePeopleAlsoWatched) {
      rules.push("ytd-shelf-renderer[data-ydt-hide='people-also-watched'] { display: none !important; }")
    }

    if (settings.hideExploreMore) {
      rules.push("ytd-shelf-renderer[data-ydt-hide='explore-more'] { display: none !important; }")
    }

    if (settings.hideFromRelatedSearches) {
      rules.push("ytd-shelf-renderer[data-ydt-hide='from-related-searches'] { display: none !important; }")
    }

    if (settings.hideChannelsNewToYou) {
      rules.push("ytd-shelf-renderer[data-ydt-hide='channels-new-to-you'] { display: none !important; }")
    }

    this.ensureStyle().textContent = rules.join("\n")
  }

  private ensureStyle(): HTMLStyleElement {
    if (!this.styleEl) {
      this.styleEl = document.createElement("style")
      this.styleEl.setAttribute("data-youdefinetube", "active")
      document.documentElement.appendChild(this.styleEl)
    }
    return this.styleEl
  }
}
