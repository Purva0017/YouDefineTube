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
      rules.push(`
        ytd-watch-flexy:not([theater]):not([fullscreen]) #secondary:not(:has(#chat)):not(:has(ytd-live-chat-frame)) {
          display: none !important;
        }
        ytd-watch-flexy:not([theater]):not([fullscreen]) #primary {
          max-width: var(--ytd-watch-flexy-player-width) !important;
          margin-left: auto !important;
          margin-right: auto !important;
          float: none !important;
        }
      `)
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

    if (settings.gridSearchMode) {
      rules.push(`
        ytd-search ytd-item-section-renderer > #contents {
          display: grid !important;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)) !important;
          grid-gap: 24px 16px !important;
        }
        
        /* Make all renderers fit grid */
        ytd-search ytd-video-renderer,
        ytd-search ytd-playlist-renderer,
        ytd-search ytd-radio-renderer,
        ytd-search yt-lockup-view-model {
          width: 100% !important;
          margin-top: 0 !important;
          margin-bottom: 0 !important;
        }
        
        /* Force column layout for all potential wrappers */
        ytd-search ytd-video-renderer > #dismissible,
        ytd-search ytd-radio-renderer > #dismissible,
        ytd-search ytd-radio-renderer > #content,
        ytd-search ytd-playlist-renderer > #content,
        ytd-search ytd-playlist-renderer,
        ytd-search ytd-radio-renderer,
        ytd-search yt-lockup-view-model .ytLockupViewModelHost {
          display: flex !important;
          flex-direction: column !important;
          width: 100% !important;
          align-items: flex-start !important;
        }
        
        /* Thumbnails full width */
        ytd-search ytd-thumbnail,
        ytd-search ytd-playlist-thumbnail,
        ytd-search yt-lockup-view-model .ytLockupViewModelContentImage {
          width: 100% !important;
          max-width: 100% !important;
          min-width: 100% !important;
          height: auto !important;
          flex: none !important;
          margin-bottom: 12px !important;
        }
        
        /* Fix image sizing inside thumbnails */
        ytd-search ytd-thumbnail img,
        ytd-search ytd-playlist-thumbnail img {
          width: 100% !important;
          object-fit: cover !important;
        }
        
        /* Text wrapper adjustments */
        ytd-search ytd-video-renderer .text-wrapper,
        ytd-search ytd-playlist-renderer > #content,
        ytd-search yt-lockup-view-model .ytLockupViewModelMetadata {
          max-width: 100% !important;
          min-width: 100% !important;
          width: 100% !important;
          padding: 0 !important;
          margin: 0 !important;
          box-sizing: border-box !important;
          display: flex !important;
          flex-direction: column !important;
        }

        /* Reorder Video Details to match homepage (Title -> Channel -> Views/Date) */
        ytd-search ytd-video-renderer #meta.ytd-video-renderer {
          display: contents !important;
        }
        ytd-search ytd-video-renderer .text-wrapper > *,
        ytd-search ytd-video-renderer #meta.ytd-video-renderer > * {
          order: 4;
        }
        ytd-search ytd-video-renderer #title-wrapper {
          order: 1 !important;
          margin-bottom: 4px !important;
        }
        ytd-search ytd-video-renderer #channel-info {
          order: 2 !important;
          margin-bottom: 2px !important;
        }
        ytd-search ytd-video-renderer ytd-video-meta-block {
          order: 3 !important;
        }

        /* Hide description text (often too long for grid) */
        ytd-search ytd-video-renderer yt-formatted-string#description-text,
        ytd-search ytd-video-renderer .metadata-snippet-container {
          display: none !important; 
        }

        /* Shelves, Shorts, Channels should span full width */
        ytd-search ytd-shelf-renderer,
        ytd-search ytd-reel-shelf-renderer,
        ytd-search ytd-channel-renderer {
          grid-column: 1 / -1 !important;
        }
      `)
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
