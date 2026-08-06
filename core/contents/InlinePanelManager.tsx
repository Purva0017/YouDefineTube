import { createRoot, type Root } from "react-dom/client"
import { ExtensionApp } from "~/components/ExtensionApp"
import { PANEL_MAX_HEIGHT, PANEL_WIDTH } from "~/lib/theme"

const PANEL_ID = "ydt-inline-panel-host"

export class InlinePanelManager {
  private hostEl: HTMLDivElement | null = null
  private panelWrap: HTMLDivElement | null = null
  private mountEl: HTMLDivElement | null = null
  private reactRoot: Root | null = null
  private isOpen = false
  private anchorEl: HTMLElement | null = null
  private onKeyDown: ((e: KeyboardEvent) => void) | null = null
  private onOutsideClick: ((e: MouseEvent) => void) | null = null
  private onStateChange: ((open: boolean) => void) | null = null
  private onReposition: (() => void) | null = null

  public setOnStateChange(cb: (open: boolean) => void): void {
    this.onStateChange = cb
  }

  public toggle(anchorEl?: HTMLElement | null): void {
    if (this.isOpen) {
      this.close()
    } else {
      this.open(anchorEl)
    }
  }

  public open(anchorEl?: HTMLElement | null): void {
    if (this.isOpen) return
    this.anchorEl = anchorEl || this.anchorEl
    this.ensureMounted()
    if (!this.hostEl || !this.panelWrap) return

    this.positionPanel()
    this.renderApp()
    this.setVisible(true)

    this.isOpen = true
    this.onStateChange?.(true)
    this.bindListeners()
  }

  public close(): void {
    if (!this.isOpen) return

    this.setVisible(false)
    this.isOpen = false
    this.onStateChange?.(false)
    this.unbindListeners()

    window.setTimeout(() => {
      if (!this.isOpen && this.hostEl) {
        this.hostEl.style.display = "none"
      }
    }, 150)
  }

  public getIsOpen(): boolean {
    return this.isOpen
  }

  public preload(): void {
    this.ensureMounted()
  }

  private setVisible(visible: boolean): void {
    if (!this.hostEl || !this.panelWrap) return

    this.hostEl.style.display = visible ? "block" : "block"
    this.hostEl.style.pointerEvents = visible ? "auto" : "none"
    this.panelWrap.style.opacity = visible ? "1" : "0"
    this.panelWrap.style.transform = visible ? "translateY(0)" : "translateY(-4px)"
    this.panelWrap.style.pointerEvents = visible ? "auto" : "none"
  }

  private ensureMounted(): void {
    if (this.hostEl?.isConnected) return

    const isDark =
      document.documentElement.hasAttribute("dark") ||
      window.matchMedia("(prefers-color-scheme: dark)").matches

    const host = document.createElement("div")
    host.id = PANEL_ID
    host.setAttribute("data-youdefinetube", "inline-panel")
    Object.assign(host.style, {
      display: "none",
      position: "fixed",
      inset: "0",
      zIndex: "2147483647",
      pointerEvents: "none"
    })

    const panelWrap = document.createElement("div")
    panelWrap.setAttribute("data-ydt-panel", "1")
    Object.assign(panelWrap.style, {
      position: "fixed",
      width: `${PANEL_WIDTH}px`,
      maxHeight: `${PANEL_MAX_HEIGHT}px`,
      opacity: "0",
      transform: "translateY(-4px)",
      transformOrigin: "top right",
      transition: "opacity 0.15s ease, transform 0.15s ease",
      pointerEvents: "none",
      borderRadius: "20px",
      overflow: "hidden",
      background: "transparent",
      boxShadow: isDark
        ? "0 24px 64px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.06)"
        : "0 24px 64px rgba(15,23,42,0.18), 0 0 0 1px rgba(0,0,0,0.04)",
      zIndex: "2147483647"
    })
    panelWrap.addEventListener("mousedown", (e) => e.stopPropagation())

    const mountEl = document.createElement("div")
    mountEl.style.height = "100%"
    mountEl.style.width = "100%"
    mountEl.style.display = "flex"
    mountEl.style.flexDirection = "column"
    panelWrap.appendChild(mountEl)

    host.appendChild(panelWrap)

    const mountTarget = document.body || document.documentElement
    mountTarget.appendChild(host)

    this.hostEl = host
    this.panelWrap = panelWrap
    this.mountEl = mountEl

    try {
      this.reactRoot = createRoot(mountEl)
      this.renderApp()
    } catch (err) {
      console.error("[YouDefineTube] Panel render failed:", err)
      mountEl.innerHTML = `<div style="padding:16px;color:${isDark ? "#f1f1f1" : "#0f0f0f"};font-family:Roboto,sans-serif"><p style="margin:0">Failed to load. Please reload.</p></div>`
    }
  }

  private renderApp(): void {
    if (!this.reactRoot) return
    this.reactRoot.render(<ExtensionApp onClose={() => this.close()} />)
  }

  private positionPanel(): void {
    if (!this.panelWrap) return

    const anchor = this.anchorEl
    const viewportW = window.innerWidth
    const viewportH = window.innerHeight
    const margin = 8
    const gap = 4

    let top = 56
    let right = margin

    if (anchor) {
      const rect = anchor.getBoundingClientRect()
      top = rect.bottom + gap
      right = viewportW - rect.right

      const maxHeight = Math.min(PANEL_MAX_HEIGHT, viewportH - top - margin)
      this.panelWrap.style.height = `${Math.max(360, maxHeight)}px`
    } else {
      this.panelWrap.style.height = `${Math.min(PANEL_MAX_HEIGHT, viewportH - 72)}px`
    }

    this.panelWrap.style.top = `${Math.max(margin, top)}px`
    this.panelWrap.style.right = `${Math.max(margin, right)}px`
    this.panelWrap.style.left = "auto"
  }

  private bindListeners(): void {
    this.onKeyDown = (e) => {
      if (e.key === "Escape") this.close()
    }
    document.addEventListener("keydown", this.onKeyDown)

    this.onOutsideClick = (e) => {
      const target = e.target as Node
      if (this.panelWrap?.contains(target)) return
      if (this.anchorEl?.contains(target)) return
      this.close()
    }
    window.setTimeout(() => {
      document.addEventListener("mousedown", this.onOutsideClick!, true)
    }, 0)

    this.onReposition = () => this.positionPanel()
    window.addEventListener("resize", this.onReposition)
    window.addEventListener("scroll", this.onReposition, true)
  }

  private unbindListeners(): void {
    if (this.onKeyDown) {
      document.removeEventListener("keydown", this.onKeyDown)
      this.onKeyDown = null
    }
    if (this.onOutsideClick) {
      document.removeEventListener("mousedown", this.onOutsideClick, true)
      this.onOutsideClick = null
    }
    if (this.onReposition) {
      window.removeEventListener("resize", this.onReposition)
      window.removeEventListener("scroll", this.onReposition, true)
      this.onReposition = null
    }
  }
}
