import type { Settings } from "~/lib/settings"

export class SearchRefiner {
  public update(settings: Settings): void {
    if (!settings.hidePeopleAlsoWatched && !settings.hideExploreMore && !settings.hideFromRelatedSearches && !settings.hideChannelsNewToYou) return
    if (!window.location.pathname.startsWith("/results")) return

    const shelves = document.querySelectorAll('ytd-shelf-renderer:not([data-ydt-hide])')
    shelves.forEach((shelf) => {
      const titleSpan = shelf.querySelector('span#title')
      const titleText = titleSpan?.textContent?.trim().toLowerCase()

      if (settings.hidePeopleAlsoWatched && titleText === "people also watched") {
        shelf.setAttribute('data-ydt-hide', 'people-also-watched')
      } else if (settings.hideExploreMore && titleText === "explore more") {
        shelf.setAttribute('data-ydt-hide', 'explore-more')
      } else if (settings.hideFromRelatedSearches && titleText === "from related searches") {
        shelf.setAttribute('data-ydt-hide', 'from-related-searches')
      } else if (settings.hideChannelsNewToYou && titleText === "channels new to you") {
        shelf.setAttribute('data-ydt-hide', 'channels-new-to-you')
      }
    })
  }

  public observe(settings: Settings): void {
    const observer = new MutationObserver(() => {
      if (window.location.pathname.startsWith("/results")) {
        this.update(settings)
      }
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true
    })
  }
}
