import { MESSAGES } from "~/lib/messaging"
import type { Settings } from "~/lib/settings"
import { formatDuration, formatMinutes, formatTimeStr } from "~/lib/utils"
import { safeSendMessage } from "~/lib/extension-runtime"
import { OVERLAY_THEME, OVERLAY_Z } from "./overlays/overlay-theme"
import { ensureKeyframes, pauseCurrentVideo } from "./overlays/overlay-dom"
import { HomepageMessageOverlay } from "./overlays/HomepageMessageOverlay"

export class OverlayManager {
  private readonly homepage = new HomepageMessageOverlay()
  private focusBlockerEl: HTMLDivElement | null = null
  private focusBlockerScheduleKey: string | null = null
  private frictionPromptEl: HTMLDivElement | null = null
  private frictionGoalEl: HTMLDivElement | null = null

  public updateHomepageMessage(settings: Settings): void {
    this.homepage.update(settings)
  }

  public showFocusBlockerAlert(
    scheduleName: string,
    startTime: string,
    endTime: string,
    onOpenSettings?: () => void,
    onDisableSchedule?: () => void
  ): void {
    const scheduleKey = `${scheduleName}|${startTime}|${endTime}`

    if (this.focusBlockerEl?.isConnected) {
      if (this.focusBlockerScheduleKey === scheduleKey) return
      this.updateFocusBlockerContent(scheduleName, startTime, endTime)
      this.focusBlockerScheduleKey = scheduleKey
      return
    }

    this.removeFocusBlockerAlert()
    pauseCurrentVideo()

    const isBedtime = /bed|sleep|night|rest|evening/i.test(scheduleName)
    const icon = isBedtime ? "🌙" : "🛡️"
    const bgGradient = isBedtime
      ? "linear-gradient(135deg, #141418, #1c1c22)"
      : OVERLAY_THEME.backdropGradient

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
      zIndex: String(OVERLAY_Z),
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

    ensureKeyframes(
      "ydt-blocker-styles",
      `
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
    )

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
    desc.setAttribute("data-ydt-focus-desc", "1")
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
      borderLeft: `3px solid ${OVERLAY_THEME.accent}`,
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
      safeSendMessage({ type: MESSAGES.CLOSE_CURRENT_TAB })
    })
    btnContainer.appendChild(closeTabBtn)

    if (onOpenSettings) {
      const settingsBtn = document.createElement("button")
      Object.assign(settingsBtn.style, {
        border: "1px solid rgba(255, 255, 255, 0.2)",
        borderRadius: "12px",
        padding: "13px 20px",
        fontWeight: "600",
        fontSize: "14px",
        cursor: "pointer",
        background: "rgba(255, 255, 255, 0.07)",
        color: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        transition: "transform 0.15s, background-color 0.15s, border-color 0.15s"
      })
      settingsBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg><span>Open Settings / Modify Schedule</span>`
      settingsBtn.onmouseover = () => {
        settingsBtn.style.backgroundColor = "rgba(255, 255, 255, 0.14)"
        settingsBtn.style.borderColor = "rgba(255, 255, 255, 0.35)"
        settingsBtn.style.transform = "scale(1.01)"
      }
      settingsBtn.onmouseout = () => {
        settingsBtn.style.backgroundColor = "rgba(255, 255, 255, 0.07)"
        settingsBtn.style.borderColor = "rgba(255, 255, 255, 0.2)"
        settingsBtn.style.transform = "none"
      }
      settingsBtn.addEventListener("click", () => {
        onOpenSettings()
      })
      btnContainer.appendChild(settingsBtn)
    }

    if (onDisableSchedule) {
      const disableBtn = document.createElement("button")
      disableBtn.setAttribute("data-ydt-disable-btn", "1")
      Object.assign(disableBtn.style, {
        border: "none",
        background: "transparent",
        color: "#94a3b8",
        fontSize: "13px",
        fontWeight: "500",
        cursor: "pointer",
        padding: "6px 8px",
        textDecoration: "underline",
        textUnderlineOffset: "3px",
        transition: "color 0.15s"
      })
      disableBtn.textContent = isBedtime ? "Turn off Bedtime Blocker for now" : "Turn off Focus Blocker for now"
      disableBtn.onmouseover = () => { disableBtn.style.color = "#ffffff" }
      disableBtn.onmouseout = () => { disableBtn.style.color = "#94a3b8" }
      disableBtn.addEventListener("click", () => {
        onDisableSchedule()
      })
      btnContainer.appendChild(disableBtn)
    }

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
      safeSendMessage({ type: MESSAGES.CLOSE_ALL_TABS })
    })
    btnContainer.appendChild(closeAllBtn)

    contentContainer.appendChild(btnContainer)
    overlay.appendChild(contentContainer)
    document.body.appendChild(overlay)
    this.focusBlockerEl = overlay
    this.focusBlockerScheduleKey = scheduleKey
  }

  private updateFocusBlockerContent(scheduleName: string, startTime: string, endTime: string): void {
    const isBedtime = /bed|sleep|night|rest|evening/i.test(scheduleName)
    const title = this.focusBlockerEl?.querySelector("h2")
    const desc = this.focusBlockerEl?.querySelector<HTMLElement>("[data-ydt-focus-desc]")
    const disableBtn = this.focusBlockerEl?.querySelector<HTMLButtonElement>("[data-ydt-disable-btn]")

    if (title) {
      title.textContent = isBedtime ? "Time to rest" : "Focus Mode Active"
    }
    if (desc) {
      desc.innerHTML = `YouTube is blocked during your schedule: <br><strong>${scheduleName}</strong> (${formatTimeStr(startTime)} - ${formatTimeStr(endTime)})`
    }
    if (disableBtn) {
      disableBtn.textContent = isBedtime ? "Turn off Bedtime Blocker for now" : "Turn off Focus Blocker for now"
    }
  }

  public removeFocusBlockerAlert(): void {
    if (this.focusBlockerEl) {
      this.focusBlockerEl.remove()
      this.focusBlockerEl = null
    }
    this.focusBlockerScheduleKey = null
  }

  public showFrictionPrompt(onSubmit: (goal: string) => void, onDismiss?: () => void): void {
    if (this.frictionPromptEl?.isConnected) return

    this.removeFrictionPrompt()
    pauseCurrentVideo()

    const overlay = document.createElement("div")
    overlay.setAttribute("data-youdefinetube-friction-prompt", "1")
    Object.assign(overlay.style, {
      position: "fixed",
      inset: "0",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
      background: OVERLAY_THEME.backdropGradient,
      backdropFilter: "blur(20px)",
      webkitBackdropFilter: "blur(20px)",
      zIndex: String(OVERLAY_Z),
      color: "#ffffff",
      fontFamily: "system-ui, -apple-system, sans-serif"
    })

    const card = document.createElement("div")
    Object.assign(card.style, {
      position: "relative",
      width: "min(480px, 100%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      textAlign: "center"
    })

    if (onDismiss) {
      const closeBtn = document.createElement("button")
      closeBtn.type = "button"
      closeBtn.setAttribute("aria-label", "Dismiss friction screen")
      closeBtn.title = "Dismiss for this session"
      Object.assign(closeBtn.style, {
        position: "absolute",
        top: "-8px",
        right: "-8px",
        width: "36px",
        height: "36px",
        borderRadius: "50%",
        border: "1px solid rgba(255, 255, 255, 0.15)",
        background: "rgba(15, 23, 42, 0.9)",
        color: "#94a3b8",
        fontSize: "22px",
        lineHeight: "1",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "color 0.15s, background-color 0.15s, border-color 0.15s"
      })
      closeBtn.innerHTML = "&times;"
      closeBtn.onmouseover = () => {
        closeBtn.style.color = "#ffffff"
        closeBtn.style.backgroundColor = "rgba(255, 255, 255, 0.12)"
        closeBtn.style.borderColor = "rgba(255, 255, 255, 0.3)"
      }
      closeBtn.onmouseout = () => {
        closeBtn.style.color = "#94a3b8"
        closeBtn.style.backgroundColor = "rgba(15, 23, 42, 0.9)"
        closeBtn.style.borderColor = "rgba(255, 255, 255, 0.15)"
      }
      closeBtn.addEventListener("click", () => {
        this.removeFrictionPrompt()
        onDismiss()
      })
      card.appendChild(closeBtn)
    }

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
      safeSendMessage({ type: MESSAGES.CLOSE_CURRENT_TAB })
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

  private timeLimitToastEl: HTMLDivElement | null = null
  private timeLimitToastTimer: ReturnType<typeof setTimeout> | null = null

  public showTimeLimitWarning(
    payload: {
      level: 50 | 90
      usedMs: number
      limitMs: number
      limitMinutes: number
    },
    onManageLimit?: () => void
  ): void {
    if (this.timeLimitToastEl) {
      this.timeLimitToastEl.remove()
      this.timeLimitToastEl = null
    }
    if (this.timeLimitToastTimer) {
      clearTimeout(this.timeLimitToastTimer)
      this.timeLimitToastTimer = null
    }

    const is90 = payload.level === 90
    const usedMinutes = Math.round(payload.usedMs / 60000)
    const remainingMinutes = Math.max(0, payload.limitMinutes - usedMinutes)

    const accentColor = is90 ? "#ef4444" : "#f59e0b"
    const accentBg = is90 ? "rgba(239, 68, 68, 0.15)" : "rgba(245, 158, 11, 0.15)"
    const borderColor = is90 ? "rgba(239, 68, 68, 0.4)" : "rgba(245, 158, 11, 0.4)"
    const icon = is90 ? "⚠️" : "⏳"
    const title = is90 ? "90% Daily YouTube Limit Reached" : "50% Daily YouTube Limit Reached"
    const subtitle = is90
      ? `You have used ${usedMinutes} of ${payload.limitMinutes} min. Only ${remainingMinutes} min left today!`
      : `You've used ${usedMinutes} of ${payload.limitMinutes} min (${Math.round((payload.usedMs / payload.limitMs) * 100)}%).`

    const toast = document.createElement("div")
    toast.setAttribute("data-youdefinetube-time-limit-warning", String(payload.level))
    Object.assign(toast.style, {
      position: "fixed",
      bottom: "24px",
      right: "24px",
      zIndex: String(OVERLAY_Z + 10),
      maxWidth: "380px",
      padding: "16px 18px",
      borderRadius: "14px",
      background: "rgba(18, 18, 22, 0.96)",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      border: `1px solid ${borderColor}`,
      boxShadow: `0 12px 36px rgba(0, 0, 0, 0.5), 0 0 16px ${accentBg}`,
      color: "#ffffff",
      fontFamily: OVERLAY_THEME.font,
      display: "flex",
      flexDirection: "column",
      gap: "10px",
      opacity: "0",
      transform: "translateY(16px)",
      transition: "opacity 0.25s ease, transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)"
    })

    const header = document.createElement("div")
    Object.assign(header.style, {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "8px"
    })

    const titleGroup = document.createElement("div")
    Object.assign(titleGroup.style, {
      display: "flex",
      alignItems: "center",
      gap: "8px"
    })

    const iconSpan = document.createElement("span")
    iconSpan.textContent = icon
    iconSpan.style.fontSize = "18px"
    titleGroup.appendChild(iconSpan)

    const titleSpan = document.createElement("span")
    titleSpan.textContent = title
    Object.assign(titleSpan.style, {
      fontSize: "13px",
      fontWeight: "700",
      color: accentColor,
      letterSpacing: "-0.01em"
    })
    titleGroup.appendChild(titleSpan)
    header.appendChild(titleGroup)

    const closeBtn = document.createElement("button")
    closeBtn.innerHTML = "&times;"
    Object.assign(closeBtn.style, {
      background: "none",
      border: "none",
      color: "#94a3b8",
      fontSize: "18px",
      cursor: "pointer",
      padding: "0 4px",
      lineHeight: "1",
      transition: "color 0.15s"
    })
    closeBtn.onmouseover = () => { closeBtn.style.color = "#ffffff" }
    closeBtn.onmouseout = () => { closeBtn.style.color = "#94a3b8" }

    const dismissToast = () => {
      toast.style.opacity = "0"
      toast.style.transform = "translateY(12px)"
      setTimeout(() => {
        toast.remove()
        if (this.timeLimitToastEl === toast) {
          this.timeLimitToastEl = null
        }
      }, 250)
    }

    closeBtn.addEventListener("click", dismissToast)
    header.appendChild(closeBtn)
    toast.appendChild(header)

    const bodyText = document.createElement("div")
    bodyText.textContent = subtitle
    Object.assign(bodyText.style, {
      fontSize: "12px",
      lineHeight: "1.4",
      color: "#cbd5e1"
    })
    toast.appendChild(bodyText)

    // Action buttons row
    const btnRow = document.createElement("div")
    Object.assign(btnRow.style, {
      display: "flex",
      justifyContent: "flex-end",
      gap: "8px",
      marginTop: "2px"
    })

    if (onManageLimit) {
      const manageBtn = document.createElement("button")
      manageBtn.textContent = "Manage Limit"
      Object.assign(manageBtn.style, {
        background: "rgba(255, 255, 255, 0.08)",
        border: "1px solid rgba(255, 255, 255, 0.14)",
        borderRadius: "8px",
        padding: "5px 12px",
        fontSize: "11px",
        fontWeight: "600",
        color: "#f8fafc",
        cursor: "pointer",
        transition: "background 0.15s ease"
      })
      manageBtn.onmouseover = () => { manageBtn.style.background = "rgba(255, 255, 255, 0.16)" }
      manageBtn.onmouseout = () => { manageBtn.style.background = "rgba(255, 255, 255, 0.08)" }
      manageBtn.addEventListener("click", () => {
        dismissToast()
        onManageLimit()
      })
      btnRow.appendChild(manageBtn)
    }

    const dismissBtn = document.createElement("button")
    dismissBtn.textContent = "Dismiss"
    Object.assign(dismissBtn.style, {
      background: accentBg,
      border: `1px solid ${accentColor}`,
      borderRadius: "8px",
      padding: "5px 12px",
      fontSize: "11px",
      fontWeight: "600",
      color: accentColor,
      cursor: "pointer",
      transition: "opacity 0.15s ease"
    })
    dismissBtn.onmouseover = () => { dismissBtn.style.opacity = "0.8" }
    dismissBtn.onmouseout = () => { dismissBtn.style.opacity = "1" }
    dismissBtn.addEventListener("click", dismissToast)
    btnRow.appendChild(dismissBtn)

    toast.appendChild(btnRow)
    document.body.appendChild(toast)
    this.timeLimitToastEl = toast

    // Trigger enter animation
    requestAnimationFrame(() => {
      toast.style.opacity = "1"
      toast.style.transform = "translateY(0)"
    })

    // Auto-dismiss after 12 seconds
    this.timeLimitToastTimer = setTimeout(dismissToast, 12000)
  }

  private dailyLimitBlockerEl: HTMLDivElement | null = null
  private pauseEnforcementListener: ((e: Event) => void) | null = null

  public showDailyLimitBlocker(
    limitMinutes: number,
    totalUsedMs: number,
    onOpenSettings?: () => void
  ): void {
    if (this.dailyLimitBlockerEl?.isConnected) {
      this.pauseAllVideos()
      return
    }

    this.removeDailyLimitBlocker()
    this.pauseAllVideos()

    // Continuously enforce pause so videos and shorts cannot play in background
    if (!this.pauseEnforcementListener) {
      this.pauseEnforcementListener = (e: Event) => {
        const target = e.target as HTMLVideoElement
        if (target && typeof target.pause === "function") {
          try {
            target.pause()
          } catch {}
        }
      }
      document.addEventListener("play", this.pauseEnforcementListener, true)
    }

    const quotes = [
      "\"Starve your distractions, feed your focus.\"",
      "\"Time is what we want most, but what we use worst.\" — William Penn",
      "\"Disconnect to reconnect with what truly matters in your life.\"",
      "\"The key is in not spending time, but in investing it.\" — Stephen R. Covey"
    ]
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)]
    const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "local time"
    const limitLabel = formatMinutes(limitMinutes)
    const usedLabel = formatDuration(totalUsedMs)

    const overlay = document.createElement("div")
    overlay.setAttribute("data-youdefinetube-daily-limit-blocker", "1")
    Object.assign(overlay.style, {
      position: "fixed",
      inset: "0",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
      background: "linear-gradient(135deg, rgba(16, 16, 20, 0.98), rgba(8, 8, 12, 0.99))",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      zIndex: String(OVERLAY_Z),
      color: "#ffffff",
      fontFamily: OVERLAY_THEME.font,
      opacity: "0",
      transition: "opacity 0.3s ease"
    })

    const card = document.createElement("div")
    Object.assign(card.style, {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      textAlign: "center",
      width: "min(520px, 100%)",
      padding: "36px 32px",
      borderRadius: "24px",
      background: "rgba(255, 255, 255, 0.03)",
      border: "1px solid rgba(255, 255, 255, 0.09)",
      boxShadow: "0 24px 80px rgba(0, 0, 0, 0.6)"
    })

    const iconEl = document.createElement("div")
    Object.assign(iconEl.style, {
      fontSize: "64px",
      marginBottom: "16px",
      filter: "drop-shadow(0 0 16px rgba(239, 68, 68, 0.4))",
      animation: "ydt-pulse 2s infinite ease-in-out"
    })
    iconEl.textContent = "🛑"
    card.appendChild(iconEl)

    ensureKeyframes(
      "ydt-limit-blocker-styles",
      `
        @keyframes ydt-pulse {
          0%, 100% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.08); opacity: 1; }
        }
      `
    )

    const title = document.createElement("h2")
    Object.assign(title.style, {
      fontSize: "28px",
      fontWeight: "800",
      margin: "0 0 10px 0",
      letterSpacing: "-0.02em",
      color: "#ffffff"
    })
    title.textContent = "Daily Limit Reached"
    card.appendChild(title)

    const desc = document.createElement("p")
    Object.assign(desc.style, {
      fontSize: "15px",
      lineHeight: "1.6",
      margin: "0 0 20px 0",
      color: "#94a3b8"
    })
    desc.innerHTML = `You've reached your daily allowance of <strong>${limitLabel}</strong> on YouTube today.`
    card.appendChild(desc)

    // Usage summary box
    const statBox = document.createElement("div")
    Object.assign(statBox.style, {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      width: "100%",
      padding: "12px 16px",
      borderRadius: "12px",
      background: "rgba(239, 68, 68, 0.08)",
      border: "1px solid rgba(239, 68, 68, 0.25)",
      marginBottom: "20px",
      boxSizing: "border-box"
    })

    const statLeft = document.createElement("div")
    statLeft.style.textAlign = "left"
    statLeft.innerHTML = `
      <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #ef4444; letter-spacing: 0.04em;">Time Spent Today</div>
      <div style="font-size: 18px; font-weight: 800; color: #ffffff; margin-top: 2px;">${usedLabel} <span style="font-size: 12px; font-weight: 400; color: #94a3b8;">/ ${limitLabel}</span></div>
    `
    statBox.appendChild(statLeft)

    const statRight = document.createElement("div")
    statRight.style.textAlign = "right"
    statRight.innerHTML = `
      <div style="font-size: 11px; font-weight: 600; color: #94a3b8;">Status</div>
      <div style="font-size: 13px; font-weight: 700; color: #ef4444; margin-top: 2px;">100% Used · Blocked</div>
    `
    statBox.appendChild(statRight)
    card.appendChild(statBox)

    // Quote
    const quoteCard = document.createElement("div")
    Object.assign(quoteCard.style, {
      fontSize: "13.5px",
      fontStyle: "italic",
      lineHeight: "1.5",
      color: "rgba(255, 255, 255, 0.75)",
      padding: "14px 16px",
      background: "rgba(255, 255, 255, 0.02)",
      borderRadius: "12px",
      borderLeft: "3px solid #ef4444",
      marginBottom: "20px",
      width: "100%",
      boxSizing: "border-box",
      textAlign: "left"
    })
    quoteCard.textContent = randomQuote
    card.appendChild(quoteCard)

    // Midnight notice
    const resetNotice = document.createElement("div")
    Object.assign(resetNotice.style, {
      fontSize: "12px",
      color: "#64748b",
      marginBottom: "24px"
    })
    resetNotice.textContent = `⏱️ Resets automatically at 12:00 AM (${userTimeZone})`
    card.appendChild(resetNotice)

    // Buttons container
    const btnContainer = document.createElement("div")
    Object.assign(btnContainer.style, {
      display: "flex",
      flexDirection: "column",
      gap: "10px",
      width: "100%"
    })

    const closeTabBtn = document.createElement("button")
    closeTabBtn.textContent = "Close YouTube"
    Object.assign(closeTabBtn.style, {
      padding: "14px 24px",
      fontSize: "15px",
      fontWeight: "700",
      borderRadius: "12px",
      border: "none",
      background: "#dc2626",
      color: "#ffffff",
      cursor: "pointer",
      boxShadow: "0 4px 16px rgba(220, 38, 38, 0.35)",
      transition: "background 0.2s, transform 0.1s"
    })
    closeTabBtn.onmouseover = () => { closeTabBtn.style.background = "#ef4444" }
    closeTabBtn.onmouseout = () => { closeTabBtn.style.background = "#dc2626" }
    closeTabBtn.addEventListener("click", () => {
      safeSendMessage({ type: MESSAGES.CLOSE_ALL_TABS })
    })
    btnContainer.appendChild(closeTabBtn)

    if (onOpenSettings) {
      const adjustBtn = document.createElement("button")
      adjustBtn.textContent = "Adjust Daily Limit"
      Object.assign(adjustBtn.style, {
        padding: "12px 24px",
        fontSize: "13.5px",
        fontWeight: "600",
        borderRadius: "12px",
        border: "1px solid rgba(255, 255, 255, 0.14)",
        background: "rgba(255, 255, 255, 0.05)",
        color: "#e2e8f0",
        cursor: "pointer",
        transition: "background 0.2s"
      })
      adjustBtn.onmouseover = () => { adjustBtn.style.background = "rgba(255, 255, 255, 0.1)" }
      adjustBtn.onmouseout = () => { adjustBtn.style.background = "rgba(255, 255, 255, 0.05)" }
      adjustBtn.addEventListener("click", () => {
        onOpenSettings()
      })
      btnContainer.appendChild(adjustBtn)
    }

    card.appendChild(btnContainer)
    overlay.appendChild(card)
    document.body.appendChild(overlay)
    this.dailyLimitBlockerEl = overlay

    requestAnimationFrame(() => {
      overlay.style.opacity = "1"
    })
  }

  public removeDailyLimitBlocker(): void {
    if (this.dailyLimitBlockerEl) {
      this.dailyLimitBlockerEl.remove()
      this.dailyLimitBlockerEl = null
    }
    if (this.pauseEnforcementListener) {
      document.removeEventListener("play", this.pauseEnforcementListener, true)
      this.pauseEnforcementListener = null
    }
  }

  private pauseAllVideos(): void {
    document.querySelectorAll<HTMLVideoElement>("video").forEach((v) => {
      try {
        if (!v.paused) v.pause()
      } catch {}
    })
  }
}
