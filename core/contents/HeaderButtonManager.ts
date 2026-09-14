import { EXTENSION_ICON_URL } from "~/lib/assets"
import { SELECTORS } from "~/lib/constants"
import type { InlinePanelManager } from "./InlinePanelManager"

function isYoutubeDark(): boolean {
  return (
    document.documentElement.hasAttribute("dark") ||
    document.body.classList.contains("dark") ||
    window.matchMedia("(prefers-color-scheme: dark)").matches
  )
}

function getCreateButtonStyles(isDark: boolean, isOpen: boolean): Partial<CSSStyleDeclaration> {
  return {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    height: "36px",
    padding: "0 16px 0 12px",
    margin: "0 8px 0 0",
    border: "none",
    borderRadius: "18px",
    background: isOpen
      ? isDark
        ? "rgba(255, 45, 85, 0.22)"
        : "rgba(225, 29, 72, 0.12)"
      : isDark
        ? "rgba(255, 255, 255, 0.1)"
        : "#f2f2f2",
    color: isDark ? "#fff" : "#0f0f0f",
    cursor: "pointer",
    fontFamily: '"Roboto", "YouTube Noto", Roboto, Arial, sans-serif',
    fontSize: "14px",
    fontWeight: "500",
    lineHeight: "36px",
    whiteSpace: "nowrap",
    transition: "background 0.15s ease, box-shadow 0.15s ease",
    boxShadow: isOpen ? "0 0 0 2px rgba(255, 45, 85, 0.35)" : "none"
  }
}

export class HeaderButtonManager {
  private buttonEl: HTMLButtonElement | null = null
  private hostEl: HTMLDivElement | null = null
  private observer: MutationObserver | null = null

  constructor(private readonly panelManager: InlinePanelManager) {
    this.panelManager.setOnStateChange(() => {
      if (this.buttonEl) this.updateButtonState(this.buttonEl)
    })
  }

  public init(): void {
    this.tryInject()

    this.observer = new MutationObserver(() => {
      this.tryInject()
    })

    const masthead = document.querySelector("ytd-masthead, #masthead")
    if (masthead) {
      this.observer.observe(masthead, { childList: true, subtree: true })
    } else {
      this.observer.observe(document.documentElement, { childList: true, subtree: true })
    }
  }

  public refresh(): void {
    this.tryInject()
  }

  private tryInject(): void {
    if (this.hostEl?.isConnected) return

    const buttonsContainer = this.getButtonsContainer()
    if (!buttonsContainer) return

    this.removeButton()

    const isDark = isYoutubeDark()

    const host = document.createElement("div")
    host.setAttribute("id", "ydt-masthead-button")
    host.setAttribute("data-youdefinetube", "header-button")
    host.className = "style-scope ytd-masthead"
    Object.assign(host.style, {
      display: "flex",
      alignItems: "center",
      flexShrink: "0"
    })

    const button = document.createElement("button")
    button.type = "button"
    button.setAttribute("aria-label", "Open YouDefineTube")
    button.setAttribute("aria-expanded", "false")
    button.title = "YouDefineTube"
    Object.assign(button.style, getCreateButtonStyles(isDark, false))

    const icon = document.createElement("img")
    icon.src = EXTENSION_ICON_URL
    icon.alt = ""
    icon.draggable = false
    Object.assign(icon.style, {
      width: "20px",
      height: "20px",
      borderRadius: "4px",
      objectFit: "cover",
      pointerEvents: "none",
      flexShrink: "0"
    })

    const label = document.createElement("span")
    label.textContent = "YouDefineTube"
    Object.assign(label.style, {
      pointerEvents: "none",
      fontSize: "14px",
      fontWeight: "500",
      letterSpacing: "0"
    })

    button.appendChild(icon)
    button.appendChild(label)

    button.addEventListener("mouseenter", () => {
      if (!this.panelManager.getIsOpen()) {
        button.style.background = isDark ? "rgba(255, 255, 255, 0.16)" : "#e5e5e5"
      }
    })
    button.addEventListener("mouseleave", () => {
      if (!this.panelManager.getIsOpen()) {
        Object.assign(button.style, getCreateButtonStyles(isDark, false))
      }
    })
    button.addEventListener("mousedown", (e) => {
      e.stopPropagation()
    })
    button.addEventListener("click", (e) => {
      e.preventDefault()
      e.stopPropagation()
      this.panelManager.toggle(button)
      this.updateButtonState(button)
    })

    host.appendChild(button)

    const anchor = this.getInsertAnchor(buttonsContainer)
    if (anchor) {
      buttonsContainer.insertBefore(host, anchor)
    } else {
      buttonsContainer.appendChild(host)
    }

    this.hostEl = host
    this.buttonEl = button
  }

  private getButtonsContainer(): HTMLElement | null {
    for (const selector of SELECTORS.MASTHEAD_BUTTONS) {
      const el = document.querySelector<HTMLElement>(selector)
      if (el) return el
    }
    return null
  }

  private getInsertAnchor(container: HTMLElement): HTMLElement | null {
    for (const selector of SELECTORS.MASTHEAD_INSERT_BEFORE) {
      const el = container.querySelector<HTMLElement>(selector)
      if (el) return el
    }
    return null
  }

  private updateButtonState(button: HTMLButtonElement): void {
    const isOpen = this.panelManager.getIsOpen()
    const isDark = isYoutubeDark()
    button.setAttribute("aria-expanded", String(isOpen))
    Object.assign(button.style, getCreateButtonStyles(isDark, isOpen))
  }

  private removeButton(): void {
    if (this.hostEl) {
      this.hostEl.remove()
      this.hostEl = null
      this.buttonEl = null
    }
  }
}
