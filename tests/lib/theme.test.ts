import { describe, expect, it } from "vitest"
import { getThemeColors } from "~/lib/theme"

describe("getThemeColors", () => {
  it("returns dark palette with required tokens", () => {
    const colors = getThemeColors(true)
    expect(colors.bg).toMatch(/^#/)
    expect(colors.accent).toBe("#e04555")
    expect(colors.text).toBeTruthy()
    expect(colors.cardBg).toBeTruthy()
  })

  it("returns light palette with required tokens", () => {
    const colors = getThemeColors(false)
    expect(colors.bg).toMatch(/^#/)
    expect(colors.accent).toBe("#d63344")
    expect(colors.tabActive).toBe("#ffffff")
  })

  it("uses different backgrounds for dark vs light", () => {
    const dark = getThemeColors(true)
    const light = getThemeColors(false)
    expect(dark.bg).not.toBe(light.bg)
  })
})
