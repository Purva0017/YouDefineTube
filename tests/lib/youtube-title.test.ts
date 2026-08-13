import { describe, expect, it } from "vitest"
import {
  getYouTubeVideoTitleFromDom,
  resolveYouTubeVideoTitle,
  stripYouTubeTabTitle
} from "~/lib/youtube-title"

describe("stripYouTubeTabTitle", () => {
  it("removes notification count prefix", () => {
    expect(stripYouTubeTabTitle("(1) Plane Crash Bigger Than Any in History | Nitish Rajput - YouTube")).toBe(
      "Plane Crash Bigger Than Any in History | Nitish Rajput"
    )
  })

  it("removes YouTube suffix without notification count", () => {
    expect(stripYouTubeTabTitle("My Video - YouTube")).toBe("My Video")
  })

  it("handles multi-digit notification counts", () => {
    expect(stripYouTubeTabTitle("(12) Trending Video - YouTube")).toBe("Trending Video")
  })
})

describe("getYouTubeVideoTitleFromDom", () => {
  it("reads watch page title from metadata", () => {
    document.body.innerHTML = `
      <h1 class="ytd-watch-metadata">
        <yt-formatted-string>Real Video Title</yt-formatted-string>
      </h1>
    `
    expect(getYouTubeVideoTitleFromDom()).toBe("Real Video Title")
  })

  it("returns null when no title element exists", () => {
    document.body.innerHTML = "<div></div>"
    expect(getYouTubeVideoTitleFromDom()).toBeNull()
  })
})

describe("resolveYouTubeVideoTitle", () => {
  it("prefers DOM title over tab title", () => {
    document.body.innerHTML = `
      <h1 class="ytd-watch-metadata">
        <yt-formatted-string>From DOM</yt-formatted-string>
      </h1>
    `
    expect(resolveYouTubeVideoTitle("(1) From Tab - YouTube")).toBe("From DOM")
  })

  it("falls back to sanitized tab title", () => {
    document.body.innerHTML = ""
    expect(resolveYouTubeVideoTitle("(2) Fallback Title - YouTube")).toBe("Fallback Title")
  })
})
