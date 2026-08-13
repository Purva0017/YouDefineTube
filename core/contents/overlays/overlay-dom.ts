import { OVERLAY_Z } from "./overlay-theme"

export function pauseCurrentVideo(): void {
  document.querySelector<HTMLVideoElement>("video")?.pause()
}

export function appendToBody(el: HTMLElement): void {
  if (!document.body) return
  document.body.appendChild(el)
}

export function ensureKeyframes(id: string, css: string): void {
  if (document.getElementById(id)) return
  const styleTag = document.createElement("style")
  styleTag.id = id
  styleTag.textContent = css
  document.head.appendChild(styleTag)
}

export function fullscreenOverlayStyles(background: string): Partial<CSSStyleDeclaration> {
  return {
    position: "fixed",
    inset: "0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    background,
    zIndex: String(OVERLAY_Z)
  }
}
