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
  accentHover: string
  accentSoft: string
  success: string
  successSoft: string
  danger: string
  dangerSoft: string
  shadow: string
  shadowSm: string
  overlay: string
  tabBg: string
  tabActive: string
}

/*
 * Cool charcoal palette — less warmth, slightly darker.
 * Accent: warm red (#e04555 dark / #d63344 light).
 */
export function getThemeColors(isDark: boolean): ThemeColors {
  if (isDark) {
    return {
      bg: "#121214",
      bgElevated: "#18181c",
      cardBg: "#1c1c20",
      cardHover: "#242428",
      text: "#ececef",
      subtext: "#9a9aa3",
      muted: "#6e6e78",
      border: "rgba(255,255,255,0.08)",
      borderStrong: "rgba(255,255,255,0.14)",
      inputBg: "#222226",
      inputBorder: "rgba(255,255,255,0.12)",
      label: "#84848e",
      accent: "#e04555",
      accentHover: "#f05565",
      accentSoft: "rgba(224,69,85,0.14)",
      success: "#5a9a6e",
      successSoft: "rgba(90,154,110,0.14)",
      danger: "#c44c3f",
      dangerSoft: "rgba(196,76,63,0.14)",
      shadow: "0 8px 32px rgba(0,0,0,0.4)",
      shadowSm: "0 1px 3px rgba(0,0,0,0.25)",
      overlay: "rgba(0,0,0,0.6)",
      tabBg: "rgba(255,255,255,0.04)",
      tabActive: "#242428"
    }
  }

  return {
    bg: "#f4f4f6",
    bgElevated: "#ffffff",
    cardBg: "#ffffff",
    cardHover: "#efeff2",
    text: "#1a1a1e",
    subtext: "#5c5c66",
    muted: "#8e8e98",
    border: "rgba(0,0,0,0.08)",
    borderStrong: "rgba(0,0,0,0.13)",
    inputBg: "#ffffff",
    inputBorder: "rgba(0,0,0,0.12)",
    label: "#6e6e78",
    accent: "#d63344",
    accentHover: "#b82a38",
    accentSoft: "rgba(214,51,68,0.09)",
    success: "#4a8a5e",
    successSoft: "rgba(74,138,94,0.09)",
    danger: "#c44c3f",
    dangerSoft: "rgba(196,76,63,0.09)",
    shadow: "0 8px 32px rgba(0,0,0,0.08)",
    shadowSm: "0 1px 3px rgba(0,0,0,0.06)",
    overlay: "rgba(0,0,0,0.25)",
    tabBg: "rgba(0,0,0,0.04)",
    tabActive: "#ffffff"
  }
}

export const PANEL_WIDTH = 440
export const PANEL_MAX_HEIGHT = 660
