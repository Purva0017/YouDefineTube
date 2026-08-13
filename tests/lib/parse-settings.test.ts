import { describe, expect, it } from "vitest"
import { parseSettings } from "~/lib/parse-settings"
import { defaultSettings } from "~/lib/settings"

describe("parseSettings", () => {
  it("returns defaults for null/undefined", () => {
    expect(parseSettings(null)).toEqual(defaultSettings)
    expect(parseSettings(undefined)).toEqual(defaultSettings)
  })

  it("merges valid partial settings", () => {
    const result = parseSettings({ hideShorts: false, dailyLimitMinutes: 90 })
    expect(result.hideShorts).toBe(false)
    expect(result.dailyLimitMinutes).toBe(90)
    expect(result.theme).toBe(defaultSettings.theme)
  })

  it("clamps invalid numeric values via schema", () => {
    const result = parseSettings({ dailyLimitMinutes: 99999, audioVolumeBoost: 50 })
    expect(result.dailyLimitMinutes).toBe(defaultSettings.dailyLimitMinutes)
    expect(result.audioVolumeBoost).toBe(defaultSettings.audioVolumeBoost)
  })

  it("drops invalid theme and keeps default", () => {
    const result = parseSettings({ theme: "neon" })
    expect(result.theme).toBe(defaultSettings.theme)
  })

  it("filters invalid focus schedules and keeps valid ones", () => {
    const result = parseSettings({
      focusSchedules: [
        { id: "ok", name: "Work", enabled: true, startTime: "09:00", endTime: "17:00", days: [1, 2, 3] },
        { id: "bad", name: "Broken", enabled: true, startTime: "09:00", endTime: "17:00", days: [99] }
      ]
    })
    expect(result.focusSchedules).toHaveLength(1)
    expect(result.focusSchedules[0].name).toBe("Work")
  })
})
