import { afterEach, describe, expect, it } from "vitest"
import { attachScrollIsolation } from "~/lib/scroll-isolation"

describe("attachScrollIsolation", () => {
  let root: HTMLDivElement
  let scrollArea: HTMLDivElement
  let detach: (() => void) | null = null

  afterEach(() => {
    detach?.()
    document.body.innerHTML = ""
  })

  function setupScrollablePanel() {
    root = document.createElement("div")
    scrollArea = document.createElement("div")
    scrollArea.className = "ydt-scroll-area"
    scrollArea.style.height = "100px"
    scrollArea.style.overflowY = "auto"

    const content = document.createElement("div")
    content.style.height = "400px"
    content.textContent = "content"

    scrollArea.appendChild(content)
    root.appendChild(scrollArea)
    document.body.appendChild(root)

    detach = attachScrollIsolation(root)
  }

  it("prevents wheel default when panel has no scrollable child", () => {
    root = document.createElement("div")
    document.body.appendChild(root)
    detach = attachScrollIsolation(root)

    const event = new WheelEvent("wheel", { deltaY: 100, bubbles: true, cancelable: true })
    let prevented = false
    event.preventDefault = () => {
      prevented = true
    }

    root.dispatchEvent(event)
    expect(prevented).toBe(true)
  })

  it("prevents wheel default at scroll bottom boundary", () => {
    setupScrollablePanel()
    Object.defineProperty(scrollArea, "scrollHeight", { value: 400, configurable: true })
    Object.defineProperty(scrollArea, "clientHeight", { value: 100, configurable: true })
    scrollArea.scrollTop = 300

    const event = new WheelEvent("wheel", { deltaY: 100, bubbles: true, cancelable: true })
    let prevented = false
    event.preventDefault = () => {
      prevented = true
    }

    scrollArea.dispatchEvent(event)
    expect(prevented).toBe(true)
  })

  it("does not prevent wheel when scroll area can still scroll down", () => {
    setupScrollablePanel()
    Object.defineProperty(scrollArea, "scrollHeight", { value: 400, configurable: true })
    Object.defineProperty(scrollArea, "clientHeight", { value: 100, configurable: true })
    scrollArea.scrollTop = 0

    const event = new WheelEvent("wheel", { deltaY: 100, bubbles: true, cancelable: true })
    let prevented = false
    event.preventDefault = () => {
      prevented = true
    }

    scrollArea.dispatchEvent(event)
    expect(prevented).toBe(false)
  })
})
