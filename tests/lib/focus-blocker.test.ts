import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { isFocusScheduleActive } from "~/lib/focus-blocker"
import { defaultSettings, type Settings } from "~/lib/settings"

function makeSettings(overrides: Partial<Settings> = {}): Settings {
  return {
    ...defaultSettings,
    isExtensionEnabled: true,
    enableFocusBlocker: true,
    focusSchedules: [
      {
        id: "work",
        name: "Work Hours",
        enabled: true,
        startTime: "09:00",
        endTime: "17:00",
        days: [1, 2, 3, 4, 5]
      }
    ],
    ...overrides
  }
}

describe("isFocusScheduleActive", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("is active inside a same-day window on a scheduled weekday", () => {
    vi.setSystemTime(new Date(2026, 7, 3, 12, 0)) // Monday
    const result = isFocusScheduleActive(makeSettings())
    expect(result.active).toBe(true)
    expect(result.schedule?.name).toBe("Work Hours")
  })

  it("is inactive before the window starts", () => {
    vi.setSystemTime(new Date(2026, 7, 3, 8, 0)) // Monday 8 AM
    expect(isFocusScheduleActive(makeSettings()).active).toBe(false)
  })

  it("is inactive on a non-scheduled day", () => {
    vi.setSystemTime(new Date(2026, 7, 2, 12, 0)) // Sunday
    expect(isFocusScheduleActive(makeSettings()).active).toBe(false)
  })

  it("is inactive when focus blocker is disabled", () => {
    vi.setSystemTime(new Date(2026, 7, 3, 12, 0))
    expect(isFocusScheduleActive(makeSettings({ enableFocusBlocker: false })).active).toBe(false)
  })

  it("is inactive when extension is disabled", () => {
    vi.setSystemTime(new Date(2026, 7, 3, 12, 0))
    expect(isFocusScheduleActive(makeSettings({ isExtensionEnabled: false })).active).toBe(false)
  })

  it("is inactive when schedule is disabled", () => {
    vi.setSystemTime(new Date(2026, 7, 3, 12, 0))
    const settings = makeSettings({
      focusSchedules: [
        {
          id: "work",
          name: "Work Hours",
          enabled: false,
          startTime: "09:00",
          endTime: "17:00",
          days: [1, 2, 3, 4, 5]
        }
      ]
    })
    expect(isFocusScheduleActive(settings).active).toBe(false)
  })

  it("handles midnight-spanning schedules in early morning", () => {
    vi.setSystemTime(new Date(2026, 7, 4, 1, 0)) // Tuesday 1 AM
    const settings = makeSettings({
      focusSchedules: [
        {
          id: "bedtime",
          name: "Bedtime Blocker",
          enabled: true,
          startTime: "23:00",
          endTime: "07:00",
          days: [0, 1, 2, 3, 4, 5, 6]
        }
      ]
    })
    expect(isFocusScheduleActive(settings).active).toBe(true)
  })

  it("is inactive outside a midnight-spanning schedule during daytime", () => {
    vi.setSystemTime(new Date(2026, 7, 4, 12, 0)) // Tuesday noon
    const settings = makeSettings({
      focusSchedules: [
        {
          id: "bedtime",
          name: "Bedtime Blocker",
          enabled: true,
          startTime: "23:00",
          endTime: "07:00",
          days: [0, 1, 2, 3, 4, 5, 6]
        }
      ]
    })
    expect(isFocusScheduleActive(settings).active).toBe(false)
  })

  it("treats equal start and end as a 24-hour block", () => {
    vi.setSystemTime(new Date(2026, 7, 3, 12, 0))
    const settings = makeSettings({
      focusSchedules: [
        {
          id: "all-day",
          name: "All Day",
          enabled: true,
          startTime: "00:00",
          endTime: "00:00",
          days: [1]
        }
      ]
    })
    expect(isFocusScheduleActive(settings).active).toBe(true)
  })
})
