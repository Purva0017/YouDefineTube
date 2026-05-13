import { MESSAGES } from "~/lib/messaging"
import { SELECTORS } from "~/lib/constants"
import type { Settings } from "~/lib/settings"

export class OverlayManager {
  private dailyLimitAlertEl: HTMLDivElement | null = null
  private homepageMessageEl: HTMLDivElement | null = null
  private homepageMessageHostEl: HTMLElement | null = null

  public showDailyLimitAlert(limitMinutes: number, extensionsUsed: number = 0): void {
    if (this.dailyLimitAlertEl?.isConnected) {
      this.updateDailyLimitAlert(extensionsUsed)
      return
    }

    this.removeDailyLimitAlert()
    this.pauseCurrentVideo()

    const overlay = document.createElement("div")
    overlay.setAttribute("data-youdefinetube-daily-limit-alert", "1")
    Object.assign(overlay.style, {
      position: "fixed",
      inset: "0",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
      background: "rgba(15, 23, 42, 0.72)",
      zIndex: "2147483647"
    })

    const card = document.createElement("div")
    Object.assign(card.style, {
      width: "min(520px, 100%)",
      background: "#ffffff",
      borderRadius: "20px",
      boxShadow: "0 24px 80px rgba(15, 23, 42, 0.28)",
      padding: "32px",
      fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
      color: "#0f172a",
      textAlign: "center"
    })

    const title = document.createElement("div")
    Object.assign(title.style, { fontSize: "26px", fontWeight: "800", marginBottom: "14px" })
    title.textContent = "Daily YouTube limit reached"
    card.appendChild(title)

    const desc = document.createElement("div")
    Object.assign(desc.style, { fontSize: "16px", lineHeight: "1.6", marginBottom: "28px", color: "#475569" })
    desc.textContent = `You've spent your ${limitMinutes} minutes on YouTube today. Your time is valuable—take a break or finish up intentionally.`
    card.appendChild(desc)

    const btnContainer = document.createElement("div")
    Object.assign(btnContainer.style, { display: "flex", flexDirection: "column", gap: "12px" })

    const extendBtn = document.createElement("button")
    extendBtn.id = "ydt-extend-btn"
    Object.assign(extendBtn.style, { border: "none", borderRadius: "12px", padding: "14px 20px", fontWeight: "700", fontSize: "15px", cursor: "pointer", background: "#0f172a", color: "#ffffff" })
    extendBtn.textContent = `Give me 5 more minutes (${extensionsUsed}/2 Used)`
    btnContainer.appendChild(extendBtn)

    const closeTabBtn = document.createElement("button")
    closeTabBtn.id = "ydt-close-tab-btn"
    Object.assign(closeTabBtn.style, { border: "1px solid #e2e8f0", borderRadius: "12px", padding: "12px 20px", fontWeight: "600", fontSize: "15px", cursor: "pointer", background: "#ffffff", color: "#0f172a" })
    closeTabBtn.textContent = "Close this tab"
    btnContainer.appendChild(closeTabBtn)

    const closeAllBtn = document.createElement("button")
    closeAllBtn.id = "ydt-close-all-btn"
    Object.assign(closeAllBtn.style, { border: "none", borderRadius: "12px", padding: "12px 20px", fontWeight: "600", fontSize: "15px", cursor: "pointer", background: "transparent", color: "#ef4444" })
    closeAllBtn.textContent = "Close all YouTube tabs"
    btnContainer.appendChild(closeAllBtn)

    card.appendChild(btnContainer)

    overlay.appendChild(card)
    document.body.appendChild(overlay)
    this.dailyLimitAlertEl = overlay

    this.attachAlertListeners(extensionsUsed)
  }

  private updateDailyLimitAlert(extensionsUsed: number): void {
    const btn = this.dailyLimitAlertEl?.querySelector<HTMLButtonElement>("#ydt-extend-btn")
    if (btn) {
      btn.disabled = extensionsUsed >= 2
      btn.textContent = `Give me 5 more minutes (${extensionsUsed}/2 Used)`
      btn.style.opacity = extensionsUsed >= 2 ? "0.5" : "1"
      btn.style.cursor = extensionsUsed >= 2 ? "not-allowed" : "pointer"
    }
  }

  private attachAlertListeners(extensionsUsed: number): void {
    const extendBtn = this.dailyLimitAlertEl?.querySelector("#ydt-extend-btn")
    const closeTabBtn = this.dailyLimitAlertEl?.querySelector("#ydt-close-tab-btn")
    const closeAllBtn = this.dailyLimitAlertEl?.querySelector("#ydt-close-all-btn")

    extendBtn?.addEventListener("click", () => {
      chrome.runtime.sendMessage({ type: MESSAGES.REQUEST_EXTENSION }, (res) => {
        if (res?.ok) this.removeDailyLimitAlert()
      })
    })

    closeTabBtn?.addEventListener("click", () => {
      chrome.runtime.sendMessage({ type: MESSAGES.CLOSE_CURRENT_TAB })
    })

    closeAllBtn?.addEventListener("click", () => {
      chrome.runtime.sendMessage({ type: MESSAGES.CLOSE_ALL_TABS })
    })
  }

  public removeDailyLimitAlert(): void {
    if (this.dailyLimitAlertEl) {
      this.dailyLimitAlertEl.remove()
      this.dailyLimitAlertEl = null
    }
  }

  public updateHomepageMessage(settings: Settings): void {
    if (settings.hideHomepageRecommendations && window.location.pathname === "/") {
      this.showHomepageMessage()
    } else {
      this.removeHomepageMessage()
    }
  }

  private showHomepageMessage(): void {
    const host = this.getHomepageMessageHost()
    if (!host) {
      this.removeHomepageMessage()
      return
    }

    if (this.homepageMessageEl && this.homepageMessageEl.isConnected && this.homepageMessageHostEl === host) {
      return
    }

    this.removeHomepageMessage()

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
      fontFamily: "system-ui, sans-serif",
      fontSize: "22px",
      fontWeight: "700",
      lineHeight: "1.35",
      color: "#0f172a",
      padding: "24px 28px",
      borderRadius: "16px",
      background: "rgba(255, 255, 255, 0.92)",
      boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)"
    })
    messageCard.textContent = "Homepage recommendations are hidden. Search for what you came to watch."
    el.appendChild(messageCard)

    host.appendChild(el)
    this.homepageMessageEl = el
    this.homepageMessageHostEl = host
  }

  private removeHomepageMessage(): void {
    if (this.homepageMessageEl) {
      this.homepageMessageEl.remove()
      this.homepageMessageEl = null
    }
    this.homepageMessageHostEl = null
  }

  private getHomepageMessageHost(): HTMLElement | null {
    for (const selector of SELECTORS.HOMEPAGE_MESSAGE_HOST) {
      const el = document.querySelector<HTMLElement>(selector)
      if (el) return el
    }
    return null
  }

  private pauseCurrentVideo(): void {
    document.querySelector<HTMLVideoElement>("video")?.pause()
  }
}
