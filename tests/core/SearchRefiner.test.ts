import { describe, expect, it, beforeEach, afterEach } from "vitest"
import { SearchRefiner } from "~/core/contents/SearchRefiner"
import { defaultSettings } from "~/lib/settings"

describe("SearchRefiner", () => {
  let refiner: SearchRefiner

  beforeEach(() => {
    refiner = new SearchRefiner()
    document.body.innerHTML = ""
    window.history.pushState({}, "", "/results?search_query=test")
  })

  afterEach(() => {
    document.body.innerHTML = ""
    window.history.pushState({}, "", "/")
  })

  it("tags shelves when hide setting is enabled", () => {
    document.body.innerHTML = `
      <ytd-shelf-renderer>
        <span id="title">People also watched</span>
      </ytd-shelf-renderer>
    `

    refiner.apply({
      ...defaultSettings,
      hidePeopleAlsoWatched: true
    })

    const shelf = document.querySelector("ytd-shelf-renderer")
    expect(shelf?.getAttribute("data-ydt-hide")).toBe("people-also-watched")
  })

  it("removes hide attribute when setting is turned off", () => {
    document.body.innerHTML = `
      <ytd-shelf-renderer data-ydt-hide="people-also-watched">
        <span id="title">People also watched</span>
      </ytd-shelf-renderer>
    `

    refiner.apply({
      ...defaultSettings,
      hidePeopleAlsoWatched: false
    })

    const shelf = document.querySelector("ytd-shelf-renderer")
    expect(shelf?.hasAttribute("data-ydt-hide")).toBe(false)
  })

  it("clears hide attributes when extension is disabled", () => {
    document.body.innerHTML = `
      <ytd-shelf-renderer data-ydt-hide="explore-more">
        <span id="title">Explore more</span>
      </ytd-shelf-renderer>
    `

    refiner.apply({
      ...defaultSettings,
      isExtensionEnabled: false,
      hideExploreMore: true
    })

    const shelf = document.querySelector("ytd-shelf-renderer")
    expect(shelf?.hasAttribute("data-ydt-hide")).toBe(false)
  })
})
