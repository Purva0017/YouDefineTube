import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { NavigationManager } from "~/core/contents/NavigationManager"
import { defaultSettings, type Settings } from "~/lib/settings"

function makeSettings(overrides: Partial<Settings> = {}): Settings {
  return { ...defaultSettings, isExtensionEnabled: true, ...overrides }
}

describe("NavigationManager", () => {
  let manager: NavigationManager
  const replaceSpy = vi.fn()

  beforeEach(() => {
    manager = new NavigationManager()
    replaceSpy.mockClear()
    vi.stubGlobal("location", {
      pathname: "/",
      search: "",
      href: "https://www.youtube.com/",
      origin: "https://www.youtube.com",
      replace: replaceSpy
    })
    vi.stubGlobal("history", { replaceState: vi.fn() })
    vi.stubGlobal("sessionStorage", {
      store: {} as Record<string, string>,
      setItem(key: string, value: string) {
        this.store[key] = value
      },
      getItem(key: string) {
        return this.store[key] ?? null
      },
      removeItem(key: string) {
        delete this.store[key]
      }
    })
    document.body.innerHTML = ""
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("redirects home to subscriptions when both flags are on", () => {
    manager.handleRedirections(
      makeSettings({ hideHomepageRecommendations: true, redirectToSubscriptions: true })
    )
    expect(replaceSpy).toHaveBeenCalledWith("/feed/subscriptions")
  })

  it("does not redirect home when redirect flag is off", () => {
    manager.handleRedirections(
      makeSettings({ hideHomepageRecommendations: true, redirectToSubscriptions: false })
    )
    expect(replaceSpy).not.toHaveBeenCalled()
  })

  it("redirects shorts to watch with pause flag", () => {
    vi.stubGlobal("location", {
      pathname: "/shorts/abc123",
      search: "",
      href: "https://www.youtube.com/shorts/abc123",
      origin: "https://www.youtube.com",
      replace: replaceSpy
    })

    manager.handleRedirections(makeSettings({ hideShorts: true }))
    expect(replaceSpy).toHaveBeenCalled()
    const url = replaceSpy.mock.calls[0][0] as string
    expect(url).toContain("/watch")
    expect(url).toContain("v=abc123")
    expect(url).toContain("ydt_pause=1")
  })

  it("resets redirect flags on navigation", () => {
    manager.handleRedirections(
      makeSettings({ hideHomepageRecommendations: true, redirectToSubscriptions: true })
    )
    expect(replaceSpy).toHaveBeenCalledTimes(1)

    manager.onNavigation()
    replaceSpy.mockClear()
    manager.handleRedirections(
      makeSettings({ hideHomepageRecommendations: true, redirectToSubscriptions: true })
    )
    expect(replaceSpy).toHaveBeenCalledTimes(1)
  })

  it("skips all redirects when extension is disabled", () => {
    manager.handleRedirections(
      makeSettings({
        isExtensionEnabled: false,
        hideHomepageRecommendations: true,
        redirectToSubscriptions: true,
        hideShorts: true
      })
    )
    expect(replaceSpy).not.toHaveBeenCalled()
  })
})
