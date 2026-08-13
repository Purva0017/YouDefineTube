import { MESSAGES } from "~/lib/messaging"
import { safeSendMessage } from "~/lib/extension-runtime"
import { appendToBody, fullscreenOverlayStyles, pauseCurrentVideo } from "./overlay-dom"
import { OVERLAY_THEME } from "./overlay-theme"

export class DailyLimitOverlay {
  private rootEl: HTMLDivElement | null = null
  private extensionsUsed = 0

  public show(limitMinutes: number, extensionsUsed: number = 0): void {
    this.extensionsUsed = extensionsUsed

    if (this.rootEl?.isConnected) {
      this.update(extensionsUsed)
      return
    }

    this.remove()
    pauseCurrentVideo()

    const overlay = document.createElement("div")
    overlay.setAttribute("data-youdefinetube-daily-limit-alert", "1")
    Object.assign(overlay.style, fullscreenOverlayStyles(OVERLAY_THEME.backdrop))

    const card = document.createElement("div")
    Object.assign(card.style, {
      width: "min(520px, 100%)",
      background: OVERLAY_THEME.cardBg,
      borderRadius: "20px",
      border: `1px solid ${OVERLAY_THEME.border}`,
      boxShadow: "0 24px 80px rgba(0, 0, 0, 0.45)",
      padding: "32px",
      fontFamily: OVERLAY_THEME.font,
      color: OVERLAY_THEME.cardText,
      textAlign: "center"
    })

    const title = document.createElement("div")
    Object.assign(title.style, { fontSize: "26px", fontWeight: "800", marginBottom: "14px" })
    title.textContent = "Daily YouTube limit reached"
    card.appendChild(title)

    const desc = document.createElement("div")
    Object.assign(desc.style, {
      fontSize: "16px",
      lineHeight: "1.6",
      marginBottom: "28px",
      color: OVERLAY_THEME.cardMuted
    })
    desc.textContent = `You've spent your ${limitMinutes} minutes on YouTube today. Your time is valuable—take a break or finish up intentionally.`
    card.appendChild(desc)

    const errorEl = document.createElement("div")
    errorEl.id = "ydt-extend-error"
    Object.assign(errorEl.style, {
      display: "none",
      fontSize: "14px",
      color: OVERLAY_THEME.accent,
      fontWeight: "600",
      marginBottom: "16px"
    })
    card.appendChild(errorEl)

    const btnContainer = document.createElement("div")
    Object.assign(btnContainer.style, { display: "flex", flexDirection: "column", gap: "12px" })

    const extendBtn = document.createElement("button")
    extendBtn.id = "ydt-extend-btn"
    Object.assign(extendBtn.style, {
      border: "none",
      borderRadius: "12px",
      padding: "14px 20px",
      fontWeight: "700",
      fontSize: "15px",
      cursor: "pointer",
      background: OVERLAY_THEME.accent,
      color: "#ffffff"
    })
    extendBtn.textContent = `Give me 5 more minutes (${extensionsUsed}/2 Used)`
    btnContainer.appendChild(extendBtn)

    const closeTabBtn = document.createElement("button")
    closeTabBtn.id = "ydt-close-tab-btn"
    Object.assign(closeTabBtn.style, {
      border: `1px solid ${OVERLAY_THEME.border}`,
      borderRadius: "12px",
      padding: "12px 20px",
      fontWeight: "600",
      fontSize: "15px",
      cursor: "pointer",
      background: "transparent",
      color: OVERLAY_THEME.cardText
    })
    closeTabBtn.textContent = "Close this tab"
    btnContainer.appendChild(closeTabBtn)

    const closeAllBtn = document.createElement("button")
    closeAllBtn.id = "ydt-close-all-btn"
    Object.assign(closeAllBtn.style, {
      border: "none",
      borderRadius: "12px",
      padding: "12px 20px",
      fontWeight: "600",
      fontSize: "15px",
      cursor: "pointer",
      background: "transparent",
      color: OVERLAY_THEME.accent
    })
    closeAllBtn.textContent = "Close all YouTube tabs"
    btnContainer.appendChild(closeAllBtn)

    card.appendChild(btnContainer)
    overlay.appendChild(card)
    appendToBody(overlay)
    this.rootEl = overlay

    this.attachListeners()
    this.update(extensionsUsed)
  }

  public remove(): void {
    if (this.rootEl) {
      this.rootEl.remove()
      this.rootEl = null
    }
  }

  private showError(message: string): void {
    const errorEl = this.rootEl?.querySelector<HTMLElement>("#ydt-extend-error")
    if (!errorEl) return
    errorEl.textContent = message
    errorEl.style.display = "block"
  }

  private update(extensionsUsed: number): void {
    this.extensionsUsed = extensionsUsed
    const btn = this.rootEl?.querySelector<HTMLButtonElement>("#ydt-extend-btn")
    if (!btn) return
    btn.disabled = extensionsUsed >= 2
    btn.textContent = `Give me 5 more minutes (${extensionsUsed}/2 Used)`
    btn.style.opacity = extensionsUsed >= 2 ? "0.5" : "1"
    btn.style.cursor = extensionsUsed >= 2 ? "not-allowed" : "pointer"
  }

  private attachListeners(): void {
    const extendBtn = this.rootEl?.querySelector<HTMLButtonElement>("#ydt-extend-btn")
    const closeTabBtn = this.rootEl?.querySelector("#ydt-close-tab-btn")
    const closeAllBtn = this.rootEl?.querySelector("#ydt-close-all-btn")

    extendBtn?.addEventListener("click", () => {
      if (this.extensionsUsed >= 2) {
        this.showError("You've used both 5-minute extensions for today.")
        return
      }

      extendBtn.disabled = true
      safeSendMessage<{ ok?: boolean; extensionsUsed?: number; error?: string }>(
        { type: MESSAGES.REQUEST_EXTENSION },
        (res) => {
          if (!res) {
            extendBtn.disabled = false
            this.showError("Couldn't reach the extension. Try again.")
            return
          }

          if (!res.ok) {
            extendBtn.disabled = false
            this.showError(res.error || "No extensions left for today.")
            if (typeof res.extensionsUsed === "number") {
              this.update(res.extensionsUsed)
            }
            return
          }

          if (typeof res.extensionsUsed === "number") {
            this.update(res.extensionsUsed)
          }
          this.remove()
        }
      )
    })

    closeTabBtn?.addEventListener("click", () => {
      safeSendMessage({ type: MESSAGES.CLOSE_CURRENT_TAB })
    })

    closeAllBtn?.addEventListener("click", () => {
      safeSendMessage({ type: MESSAGES.CLOSE_ALL_TABS })
    })
  }
}
