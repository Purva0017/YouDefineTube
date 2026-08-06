export type ThemeColors = {
  bg: string
  bgElevated: string
  cardBg: string
  cardHover: string
  text: string
  subtext: string
  muted: string
  border: string
  borderStrong: string
  inputBg: string
  inputBorder: string
  label: string
  accent: string
  accentSoft: string
  accentGradient: string
  success: string
  danger: string
  dangerSoft: string
  shadow: string
  overlay: string
  tabBg: string
  tabActive: string
}

export function getThemeColors(isDark: boolean): ThemeColors {
  if (isDark) {
    return {
      bg: "#0b0b0f",
      bgElevated: "#121218",
      cardBg: "#16161d",
      cardHover: "#1c1c25",
      text: "#f4f4f5",
      subtext: "#a1a1aa",
      muted: "#71717a",
      border: "rgba(255,255,255,0.08)",
      borderStrong: "rgba(255,255,255,0.14)",
      inputBg: "#1a1a22",
      inputBorder: "rgba(255,255,255,0.12)",
      label: "#8b8b96",
      accent: "#ff2d55",
      accentSoft: "rgba(255,45,85,0.14)",
      accentGradient: "linear-gradient(135deg, #ff2d55 0%, #ff6b35 100%)",
      success: "#22c55e",
      danger: "#ef4444",
      dangerSoft: "rgba(239,68,68,0.15)",
      shadow: "0 24px 64px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.06)",
      overlay: "rgba(0,0,0,0.5)",
      tabBg: "rgba(255,255,255,0.04)",
      tabActive: "#1f1f28"
    }
  }

  return {
    bg: "#fafafa",
    bgElevated: "#ffffff",
    cardBg: "#ffffff",
    cardHover: "#f8fafc",
    text: "#18181b",
    subtext: "#52525b",
    muted: "#a1a1aa",
    border: "rgba(0,0,0,0.06)",
    borderStrong: "rgba(0,0,0,0.1)",
    inputBg: "#ffffff",
    inputBorder: "rgba(0,0,0,0.1)",
    label: "#71717a",
    accent: "#e11d48",
    accentSoft: "rgba(225,29,72,0.1)",
    accentGradient: "linear-gradient(135deg, #e11d48 0%, #f97316 100%)",
    success: "#16a34a",
    danger: "#dc2626",
    dangerSoft: "rgba(220,38,38,0.1)",
    shadow: "0 24px 64px rgba(15,23,42,0.18), 0 0 0 1px rgba(0,0,0,0.04)",
    overlay: "rgba(15,23,42,0.35)",
    tabBg: "rgba(0,0,0,0.04)",
    tabActive: "#ffffff"
  }
}

export const PANEL_WIDTH = 420
export const PANEL_MAX_HEIGHT = 640
