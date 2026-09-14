import { describe, expect, it } from "vitest"
import { getYouTubeVideoId } from "~/components/views/BookmarksView"

describe("getYouTubeVideoId", () => {
  it("parses watch URLs", () => {
    expect(getYouTubeVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ")
  })

  it("parses shorts URLs", () => {
    expect(getYouTubeVideoId("https://www.youtube.com/shorts/abc123XYZ")).toBe("abc123XYZ")
  })

  it("parses embed URLs", () => {
    expect(getYouTubeVideoId("https://www.youtube.com/embed/abc123XYZ")).toBe("abc123XYZ")
  })

  it("parses youtu.be URLs", () => {
    expect(getYouTubeVideoId("https://youtu.be/abc123XYZ")).toBe("abc123XYZ")
  })

  it("parses watch URLs with timestamp", () => {
    expect(getYouTubeVideoId("https://www.youtube.com/watch?v=abc123XYZ&t=120")).toBe("abc123XYZ")
  })

  it("returns null for non-YouTube URLs", () => {
    expect(getYouTubeVideoId("https://example.com/watch?v=abc")).toBeNull()
  })

  it("returns null for invalid URLs", () => {
    expect(getYouTubeVideoId("not-a-url")).toBeNull()
  })
})
