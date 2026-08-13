import type { Settings } from "~/lib/settings"

const SHELF_HIDE_RULES: {
  attr: string
  title: string
  settingKey: keyof Settings
}[] = [
  { attr: "people-also-watched", title: "people also watched", settingKey: "hidePeopleAlsoWatched" },
  { attr: "explore-more", title: "explore more", settingKey: "hideExploreMore" },
  { attr: "from-related-searches", title: "from related searches", settingKey: "hideFromRelatedSearches" },
  { attr: "channels-new-to-you", title: "channels new to you", settingKey: "hideChannelsNewToYou" }
]

export class SearchRefiner {
  private settings: Settings | null = null
  private observer: MutationObserver | null = null

  public apply(settings: Settings): void {
    this.settings = settings
    this.update()
  }

  public update(settings?: Settings): void {
    if (settings) this.settings = settings
    const current = this.settings
    if (!current) return

    if (!current.isExtensionEnabled) {
      this.clearAllHideAttributes()
      return
    }

    this.removeDisabledHideAttributes(current)

    const anyHideEnabled = SHELF_HIDE_RULES.some((rule) => current[rule.settingKey])
    if (!anyHideEnabled) return
    if (!window.location.pathname.startsWith("/results")) return

    const shelves = document.querySelectorAll("ytd-shelf-renderer:not([data-ydt-hide])")
    shelves.forEach((shelf) => {
      const titleSpan = shelf.querySelector("span#title")
      const titleText = titleSpan?.textContent?.trim().toLowerCase()
      if (!titleText) return

      for (const rule of SHELF_HIDE_RULES) {
        if (current[rule.settingKey] && titleText === rule.title) {
          shelf.setAttribute("data-ydt-hide", rule.attr)
          break
        }
      }
    })
  }

  public observe(settings: Settings): void {
    this.settings = settings
    if (this.observer) return

    this.observer = new MutationObserver(() => {
      if (window.location.pathname.startsWith("/results")) {
        this.update()
      }
    })

    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    })
  }

  private clearAllHideAttributes(): void {
    document.querySelectorAll("ytd-shelf-renderer[data-ydt-hide]").forEach((shelf) => {
      shelf.removeAttribute("data-ydt-hide")
    })
  }

  private removeDisabledHideAttributes(settings: Settings): void {
    document.querySelectorAll("ytd-shelf-renderer[data-ydt-hide]").forEach((shelf) => {
      const attr = shelf.getAttribute("data-ydt-hide")
      if (!attr) return

      const rule = SHELF_HIDE_RULES.find((entry) => entry.attr === attr)
      if (!rule || !settings[rule.settingKey]) {
        shelf.removeAttribute("data-ydt-hide")
      }
    })
  }
}
