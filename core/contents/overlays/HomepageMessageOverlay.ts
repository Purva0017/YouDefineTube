import { SELECTORS } from "~/lib/constants"
import type { Settings } from "~/lib/settings"
import { OVERLAY_THEME } from "./overlay-theme"

export class HomepageMessageOverlay {
  private messageEl: HTMLDivElement | null = null
  private hostEl: HTMLElement | null = null

  public update(settings: Settings): void {
    if (!settings.isExtensionEnabled) {
      this.remove()
      return
    }

    if (settings.hideHomepageRecommendations && window.location.pathname === "/") {
      this.show()
    } else {
      this.remove()
    }
  }

  private show(): void {
    const host = this.getHost()
    if (!host) {
      this.remove()
      return
    }

    if (this.messageEl?.isConnected && this.hostEl === host) {
      return
    }

    this.remove()

    const el = document.createElement("div")
    el.setAttribute("data-youdefinetube-home-message", "1")
    Object.assign(el.style, {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "calc(100vh - 160px)",
      width: "100%",
      boxSizing: "border-box",
      padding: "32px 24px"
    })

    const messageCard = document.createElement("div")
    Object.assign(messageCard.style, {
      maxWidth: "520px",
      textAlign: "center",
      fontFamily: OVERLAY_THEME.font,
      fontSize: "22px",
      fontWeight: "700",
      lineHeight: "1.35",
      color: OVERLAY_THEME.cardText,
      padding: "24px 28px",
      borderRadius: "16px",
      background: OVERLAY_THEME.cardBg,
      border: `1px solid ${OVERLAY_THEME.border}`,
      boxShadow: "0 10px 30px rgba(0, 0, 0, 0.25)"
    })
    messageCard.textContent = "Homepage recommendations are hidden. Search for what you came to watch."
    el.appendChild(messageCard)

    host.appendChild(el)
    this.messageEl = el
    this.hostEl = host
  }

  private remove(): void {
    if (this.messageEl) {
      this.messageEl.remove()
      this.messageEl = null
    }
    this.hostEl = null
  }

  private getHost(): HTMLElement | null {
    for (const selector of SELECTORS.HOMEPAGE_MESSAGE_HOST) {
      const el = document.querySelector<HTMLElement>(selector)
      if (el) return el
    }
    return null
  }
}
