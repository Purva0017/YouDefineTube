import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { DailyLimitOverlay } from "~/core/contents/overlays/DailyLimitOverlay"

describe("DailyLimitOverlay", () => {
  beforeEach(() => {
    document.body.innerHTML = ""
    vi.stubGlobal("chrome", {
      runtime: {
        sendMessage: vi.fn((_msg, cb?: (res: { ok: boolean }) => void) => cb?.({ ok: true }))
      }
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("renders daily limit alert in the DOM", () => {
    const overlay = new DailyLimitOverlay()
    overlay.show(60, 0)
    expect(document.querySelector("[data-youdefinetube-daily-limit-alert]")).toBeTruthy()
    expect(document.body.textContent).toContain("Daily YouTube limit reached")
    overlay.remove()
    expect(document.querySelector("[data-youdefinetube-daily-limit-alert]")).toBeNull()
  })

  it("disables extend button after two extensions", () => {
    const overlay = new DailyLimitOverlay()
    overlay.show(60, 2)
    const btn = document.querySelector<HTMLButtonElement>("#ydt-extend-btn")
    expect(btn?.disabled).toBe(true)
    overlay.remove()
  })
})
