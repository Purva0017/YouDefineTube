import { describe, expect, it } from "vitest"
import { formatDuration, formatMinutes, formatTimeStr } from "~/lib/utils"

describe("formatMinutes", () => {
  it("formats minutes only", () => {
    expect(formatMinutes(45)).toBe("45m")
  })

  it("formats hours and minutes", () => {
    expect(formatMinutes(62)).toBe("1h 2m")
  })

  it("formats zero minutes", () => {
    expect(formatMinutes(0)).toBe("0m")
  })
})

describe("formatDuration", () => {
  it("converts milliseconds to readable duration", () => {
    expect(formatDuration(3_720_000)).toBe("1h 2m")
    expect(formatDuration(0)).toBe("0m")
  })
})

describe("formatTimeStr", () => {
  it("formats 24h time to 12h AM/PM", () => {
    expect(formatTimeStr("23:00")).toBe("11:00 PM")
    expect(formatTimeStr("07:00")).toBe("7:00 AM")
    expect(formatTimeStr("00:00")).toBe("12:00 AM")
    expect(formatTimeStr("12:00")).toBe("12:00 PM")
  })

  it("returns original string for invalid input", () => {
    expect(formatTimeStr("")).toBe("")
    expect(formatTimeStr("invalid")).toBe("invalid")
  })
})
