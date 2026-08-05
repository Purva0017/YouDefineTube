import { MESSAGES } from "~/lib/messaging"
import { SELECTORS } from "~/lib/constants"
import type { Settings } from "~/lib/settings"
import { formatTimeStr } from "~/lib/utils"

export class OverlayManager {
  private dailyLimitAlertEl: HTMLDivElement | null = null
  private homepageMessageEl: HTMLDivElement | null = null
  private homepageMessageHostEl: HTMLElement | null = null
  private focusBlockerEl: HTMLDivElement | null = null
  private frictionPromptEl: HTMLDivElement | null = null
  private frictionGoalEl: HTMLDivElement | null = null

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
    if (!settings.isExtensionEnabled) {
      this.removeHomepageMessage()
      return
    }

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

  public showFocusBlockerAlert(scheduleName: string, startTime: string, endTime: string): void {
    if (this.focusBlockerEl?.isConnected) return

    this.removeFocusBlockerAlert()
    this.pauseCurrentVideo()

    const isBedtime = /bed|sleep|night|rest|evening/i.test(scheduleName)
    const icon = isBedtime ? "🌙" : "🛡️"
    const bgGradient = isBedtime
      ? "linear-gradient(135deg, #0b132b, #1c2541)"
      : "linear-gradient(135deg, #111827, #1f2937)"

    const bedtimeQuotes = [
      "\"Sleep is the best meditation.\" — Dalai Lama",
      "\"A well-spent day brings happy sleep.\" — Leonardo da Vinci",
      "\"Your future depends on your dreams, so go to sleep.\" — Mesut Barazany",
      "\"Tomorrow is a new day; begin it well and serenely.\" — Ralph Waldo Emerson"
    ]

    const focusQuotes = [
      "\"Starve your distractions, feed your focus.\"",
      "\"Deep work is the superpower of the 21st century.\"",
      "\"Focus is a muscle, and you build it by avoiding distractions.\"",
      "\"Concentrate all your thoughts upon the work at hand.\" — Alexander Graham Bell"
    ]

    const quotes = isBedtime ? bedtimeQuotes : focusQuotes
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)]

    const overlay = document.createElement("div")
    overlay.setAttribute("data-youdefinetube-focus-blocker", "1")
    Object.assign(overlay.style, {
      position: "fixed",
      inset: "0",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
      background: bgGradient,
      backdropFilter: "blur(16px)",
      webkitBackdropFilter: "blur(16px)",
      zIndex: "2147483647",
      color: "#ffffff",
      fontFamily: "system-ui, -apple-system, sans-serif"
    })

    const contentContainer = document.createElement("div")
    Object.assign(contentContainer.style, {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      textAlign: "center",
      width: "min(520px, 100%)",
      padding: "32px",
      borderRadius: "24px",
      background: "rgba(255, 255, 255, 0.03)",
      border: "1px solid rgba(255, 255, 255, 0.08)",
      boxShadow: "0 24px 80px rgba(0, 0, 0, 0.4)"
    })

    const iconEl = document.createElement("div")
    Object.assign(iconEl.style, {
      fontSize: "64px",
      marginBottom: "20px",
      filter: "drop-shadow(0 0 16px rgba(255, 255, 255, 0.2))",
      animation: "ydt-pulse 2s infinite ease-in-out"
    })
    iconEl.textContent = icon
    contentContainer.appendChild(iconEl)

    if (!document.getElementById("ydt-blocker-styles")) {
      const styleTag = document.createElement("style")
      styleTag.id = "ydt-blocker-styles"
      styleTag.textContent = `
        @keyframes ydt-pulse {
          0%, 100% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.08); opacity: 1; }
        }
        @keyframes ydt-shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-6px); }
          40%, 80% { transform: translateX(6px); }
        }
      `
      document.head.appendChild(styleTag)
    }

    const title = document.createElement("h2")
    Object.assign(title.style, {
      fontSize: "28px",
      fontWeight: "800",
      margin: "0 0 12px 0",
      letterSpacing: "-0.01em"
    })
    title.textContent = isBedtime ? "Time to rest" : "Focus Mode Active"
    contentContainer.appendChild(title)

    const desc = document.createElement("p")
    Object.assign(desc.style, {
      fontSize: "15px",
      lineHeight: "1.6",
      margin: "0 0 24px 0",
      color: "#94a3b8"
    })
    desc.innerHTML = `YouTube is blocked during your schedule: <br><strong>${scheduleName}</strong> (${formatTimeStr(startTime)} - ${formatTimeStr(endTime)})`
    contentContainer.appendChild(desc)

    const quoteCard = document.createElement("div")
    Object.assign(quoteCard.style, {
      fontSize: "14px",
      fontStyle: "italic",
      lineHeight: "1.5",
      color: "rgba(255, 255, 255, 0.7)",
      padding: "16px",
      background: "rgba(255, 255, 255, 0.02)",
      borderRadius: "12px",
      borderLeft: "3px solid #cc0000",
      marginBottom: "28px",
      width: "100%",
      boxSizing: "border-box"
    })
    quoteCard.textContent = randomQuote
    contentContainer.appendChild(quoteCard)

    const btnContainer = document.createElement("div")
    Object.assign(btnContainer.style, {
      display: "flex",
      flexDirection: "column",
      gap: "12px",
      width: "100%"
    })

    const closeTabBtn = document.createElement("button")
    Object.assign(closeTabBtn.style, {
      border: "none",
      borderRadius: "12px",
      padding: "14px 20px",
      fontWeight: "700",
      fontSize: "15px",
      cursor: "pointer",
      background: "#ffffff",
      color: "#0f172a",
      transition: "transform 0.15s, background-color 0.15s"
    })
    closeTabBtn.textContent = "Close this tab"
    closeTabBtn.onmouseover = () => { closeTabBtn.style.backgroundColor = "#e2e8f0"; closeTabBtn.style.transform = "scale(1.02)"; }
    closeTabBtn.onmouseout = () => { closeTabBtn.style.backgroundColor = "#ffffff"; closeTabBtn.style.transform = "none"; }
    closeTabBtn.addEventListener("click", () => {
      chrome.runtime.sendMessage({ type: MESSAGES.CLOSE_CURRENT_TAB })
    })
    btnContainer.appendChild(closeTabBtn)

    const closeAllBtn = document.createElement("button")
    Object.assign(closeAllBtn.style, {
      border: "1px solid rgba(255, 255, 255, 0.15)",
      borderRadius: "12px",
      padding: "12px 20px",
      fontWeight: "600",
      fontSize: "15px",
      cursor: "pointer",
      background: "transparent",
      color: "#f87171",
      transition: "background-color 0.15s, border-color 0.15s"
    })
    closeAllBtn.textContent = "Close all YouTube tabs"
    closeAllBtn.onmouseover = () => { closeAllBtn.style.backgroundColor = "rgba(239, 68, 68, 0.08)"; closeAllBtn.style.borderColor = "rgba(239, 68, 68, 0.3)"; }
    closeAllBtn.onmouseout = () => { closeAllBtn.style.backgroundColor = "transparent"; closeAllBtn.style.borderColor = "rgba(255, 255, 255, 0.15)"; }
    closeAllBtn.addEventListener("click", () => {
      chrome.runtime.sendMessage({ type: MESSAGES.CLOSE_ALL_TABS })
    })
    btnContainer.appendChild(closeAllBtn)

    contentContainer.appendChild(btnContainer)
    overlay.appendChild(contentContainer)
    document.body.appendChild(overlay)
    this.focusBlockerEl = overlay
  }

  public removeFocusBlockerAlert(): void {
    if (this.focusBlockerEl) {
      this.focusBlockerEl.remove()
      this.focusBlockerEl = null
    }
  }

  public showFrictionPrompt(onSubmit: (goal: string) => void): void {
    if (this.frictionPromptEl?.isConnected) return

    this.removeFrictionPrompt()
    this.pauseCurrentVideo()

    const overlay = document.createElement("div")
    overlay.setAttribute("data-youdefinetube-friction-prompt", "1")
    Object.assign(overlay.style, {
      position: "fixed",
      inset: "0",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
      background: "linear-gradient(135deg, rgba(15, 23, 42, 0.96), rgba(3, 7, 18, 0.98))",
      backdropFilter: "blur(20px)",
      webkitBackdropFilter: "blur(20px)",
      zIndex: "2147483647",
      color: "#ffffff",
      fontFamily: "system-ui, -apple-system, sans-serif"
    })

    const card = document.createElement("div")
    Object.assign(card.style, {
      width: "min(480px, 100%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      textAlign: "center"
    })

    const emoji = document.createElement("div")
    Object.assign(emoji.style, { fontSize: "48px", marginBottom: "16px" })
    emoji.textContent = "🤔"
    card.appendChild(emoji)

    const title = document.createElement("h2")
    Object.assign(title.style, {
      fontSize: "32px",
      fontWeight: "800",
      margin: "0 0 8px 0",
      letterSpacing: "-0.02em"
    })
    title.textContent = "Are you sure?"
    card.appendChild(title)

    const desc = document.createElement("p")
    Object.assign(desc.style, {
      fontSize: "16px",
      lineHeight: "1.5",
      color: "#94a3b8",
      margin: "0 0 28px 0"
    })
    desc.textContent = "What are you looking to accomplish on YouTube right now?"
    card.appendChild(desc)

    const form = document.createElement("form")
    Object.assign(form.style, {
      width: "100%",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "16px"
    })

    const input = document.createElement("input")
    input.type = "text"
    input.placeholder = "e.g. Figma tutorial, study music..."
    Object.assign(input.style, {
      width: "100%",
      boxSizing: "border-box",
      height: "50px",
      borderRadius: "12px",
      border: "1px solid rgba(255, 255, 255, 0.15)",
      background: "rgba(255, 255, 255, 0.05)",
      color: "#ffffff",
      fontSize: "15px",
      padding: "0 16px",
      outline: "none",
      textAlign: "center",
      transition: "border-color 0.2s, box-shadow 0.2s"
    })
    input.onfocus = () => {
      input.style.borderColor = "#cc0000"
      input.style.boxShadow = "0 0 0 3px rgba(204, 0, 0, 0.2)"
    }
    input.onblur = () => {
      input.style.borderColor = "rgba(255, 255, 255, 0.15)"
      input.style.boxShadow = "none"
    }
    form.appendChild(input)

    const btnContainer = document.createElement("div")
    Object.assign(btnContainer.style, {
      display: "flex",
      gap: "12px",
      width: "100%"
    })

    const submitBtn = document.createElement("button")
    submitBtn.type = "submit"
    Object.assign(submitBtn.style, {
      flex: "1",
      height: "48px",
      borderRadius: "12px",
      border: "none",
      background: "#ffffff",
      color: "#0f172a",
      fontWeight: "700",
      fontSize: "14px",
      cursor: "pointer",
      transition: "transform 0.15s, background-color 0.15s"
    })
    submitBtn.textContent = "Define Goal"
    submitBtn.onmouseover = () => { submitBtn.style.backgroundColor = "#e2e8f0"; submitBtn.style.transform = "scale(1.02)"; }
    submitBtn.onmouseout = () => { submitBtn.style.backgroundColor = "#ffffff"; submitBtn.style.transform = "none"; }
    btnContainer.appendChild(submitBtn)

    const cancelBtn = document.createElement("button")
    cancelBtn.type = "button"
    Object.assign(cancelBtn.style, {
      flex: "1",
      height: "48px",
      borderRadius: "12px",
      border: "1px solid rgba(255, 255, 255, 0.15)",
      background: "rgba(255, 255, 255, 0.05)",
      color: "#ffffff",
      fontWeight: "600",
      fontSize: "14px",
      cursor: "pointer",
      transition: "background-color 0.15s"
    })
    cancelBtn.textContent = "Nevermind"
    cancelBtn.onmouseover = () => { cancelBtn.style.backgroundColor = "rgba(255, 255, 255, 0.1)"; }
    cancelBtn.onmouseout = () => { cancelBtn.style.backgroundColor = "rgba(255, 255, 255, 0.05)"; }
    cancelBtn.addEventListener("click", () => {
      chrome.runtime.sendMessage({ type: MESSAGES.CLOSE_CURRENT_TAB })
    })
    btnContainer.appendChild(cancelBtn)

    form.appendChild(btnContainer)
    card.appendChild(form)
    overlay.appendChild(card)

    form.addEventListener("submit", (e) => {
      e.preventDefault()
      const val = input.value.trim()
      if (!val) {
        input.style.borderColor = "#ef4444"
        input.style.boxShadow = "0 0 0 3px rgba(239, 68, 68, 0.2)"
        input.style.animation = "ydt-shake 0.4s ease-in-out"
        setTimeout(() => {
          input.style.animation = "none"
        }, 400)
        return
      }
      onSubmit(val)
    })

    document.body.appendChild(overlay)
    this.frictionPromptEl = overlay
    input.focus()
  }

  public removeFrictionPrompt(): void {
    if (this.frictionPromptEl) {
      this.frictionPromptEl.remove()
      this.frictionPromptEl = null
    }
  }

  public showFrictionGoalOverlay(goal: string, onDone: () => void, onClose: () => void): void {
    if (this.frictionGoalEl?.isConnected) {
      const textEl = this.frictionGoalEl.querySelector("#ydt-goal-text")
      if (textEl) textEl.textContent = goal
      return
    }

    this.removeFrictionGoalOverlay()

    const badge = document.createElement("div")
    badge.setAttribute("data-youdefinetube-goal-badge", "1")
    Object.assign(badge.style, {
      position: "fixed",
      bottom: "24px",
      right: "24px",
      background: "rgba(15, 23, 42, 0.85)",
      backdropFilter: "blur(8px)",
      webkitBackdropFilter: "blur(8px)",
      border: "1px solid rgba(255, 255, 255, 0.15)",
      borderRadius: "16px",
      padding: "10px 14px",
      display: "flex",
      alignItems: "center",
      gap: "12px",
      zIndex: "2147483646",
      boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)",
      color: "#ffffff",
      fontFamily: "system-ui, -apple-system, sans-serif",
      maxWidth: "340px",
      transition: "transform 0.2s, opacity 0.2s"
    })

    badge.onmouseover = () => { badge.style.transform = "translateY(-2px)"; }
    badge.onmouseout = () => { badge.style.transform = "none"; }

    const icon = document.createElement("div")
    Object.assign(icon.style, { fontSize: "16px" })
    icon.textContent = "🎯"
    badge.appendChild(icon)

    const textContainer = document.createElement("div")
    Object.assign(textContainer.style, {
      display: "flex",
      flexDirection: "column",
      minWidth: "0"
    })

    const label = document.createElement("div")
    Object.assign(label.style, {
      fontSize: "9px",
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: "0.05em",
      color: "#94a3b8",
      marginBottom: "2px"
    })
    label.textContent = "Focus Goal"
    textContainer.appendChild(label)

    const goalText = document.createElement("div")
    goalText.id = "ydt-goal-text"
    Object.assign(goalText.style, {
      fontSize: "13px",
      fontWeight: "600",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    })
    goalText.textContent = goal
    textContainer.appendChild(goalText)

    badge.appendChild(textContainer)

    const doneBtn = document.createElement("button")
    Object.assign(doneBtn.style, {
      border: "none",
      borderRadius: "8px",
      background: "#10b981",
      color: "#ffffff",
      fontSize: "11px",
      fontWeight: "700",
      padding: "6px 10px",
      cursor: "pointer",
      whiteSpace: "nowrap",
      transition: "background-color 0.15s"
    })
    doneBtn.textContent = "Done"
    doneBtn.onmouseover = () => { doneBtn.style.backgroundColor = "#059669"; }
    doneBtn.onmouseout = () => { doneBtn.style.backgroundColor = "#10b981"; }
    doneBtn.addEventListener("click", () => {
      doneBtn.disabled = true
      closeBtn.style.display = "none"
      goalText.textContent = "Goal achieved! Excellent."
      Object.assign(badge.style, {
        background: "rgba(16, 185, 129, 0.95)",
        borderColor: "rgba(255, 255, 255, 0.25)"
      })
      label.textContent = "Celebration"
      
      let sec = 2
      doneBtn.textContent = `Closing tab (${sec}s)...`
      const interval = setInterval(() => {
        sec--
        if (sec <= 0) {
          clearInterval(interval)
          onDone()
        } else {
          doneBtn.textContent = `Closing tab (${sec}s)...`
        }
      }, 1000)
    })
    badge.appendChild(doneBtn)

    const closeBtn = document.createElement("button")
    Object.assign(closeBtn.style, {
      border: "none",
      background: "transparent",
      color: "#94a3b8",
      fontSize: "14px",
      cursor: "pointer",
      padding: "4px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "color 0.15s"
    })
    closeBtn.innerHTML = "&times;"
    closeBtn.onmouseover = () => { closeBtn.style.color = "#ffffff"; }
    closeBtn.onmouseout = () => { closeBtn.style.color = "#94a3b8"; }
    closeBtn.addEventListener("click", () => {
      badge.style.opacity = "0"
      badge.style.transform = "translateY(10px)"
      setTimeout(() => {
        onClose()
      }, 200)
    })
    badge.appendChild(closeBtn)

    document.body.appendChild(badge)
    this.frictionGoalEl = badge
  }

  public removeFrictionGoalOverlay(): void {
    if (this.frictionGoalEl) {
      this.frictionGoalEl.remove()
      this.frictionGoalEl = null
    }
  }

  private pauseCurrentVideo(): void {
    document.querySelector<HTMLVideoElement>("video")?.pause()
  }
}
