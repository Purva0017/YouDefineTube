import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import {
  createEmptyDailyUsage,
  getLocalDateKey,
  getNextLocalMidnight
} from "~/lib/time-tracking"

describe("getLocalDateKey", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("returns YYYY-MM-DD for local date", () => {
    vi.setSystemTime(new Date(2026, 7, 6, 15, 30))
    expect(getLocalDateKey()).toBe("2026-08-06")
  })
})

describe("createEmptyDailyUsage", () => {
  it("creates zeroed usage with date", () => {
    const usage = createEmptyDailyUsage("2026-08-06")
    expect(usage).toMatchObject({
      date: "2026-08-06",
      totalYoutubeMs: 0,
      watchVideoMs: 0,
      browseMs: 0,
      searchMs: 0
    })
    expect(usage.updatedAt).toBeTypeOf("number")
  })
})

describe("getNextLocalMidnight", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("returns timestamp at start of next local day", () => {
    const now = new Date(2026, 7, 6, 22, 15, 30).getTime()
    const midnight = getNextLocalMidnight(now)
    const next = new Date(midnight)
    expect(next.getFullYear()).toBe(2026)
    expect(next.getMonth()).toBe(7)
    expect(next.getDate()).toBe(7)
    expect(next.getHours()).toBe(0)
    expect(next.getMinutes()).toBe(0)
  })
})
