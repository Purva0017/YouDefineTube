import type { ReactNode } from "react"
import { useSettings } from "~/hooks/useSettings"
import { defaultSettings } from "~/lib/settings"
import type { ThemeColors } from "~/lib/theme"
import { EXTENSION_ICON_URL } from "~/lib/assets"
import { Icons } from "../ui/Icons"

function IconButton({
  onClick,
  label,
  children,
  colors,
  isDark,
  active
}: {
  onClick: () => void
  label: string
  children: ReactNode
  colors: ThemeColors
  isDark: boolean
  active?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      style={{
        background: active ? colors.accentSoft : "transparent",
        border: `1px solid ${active ? colors.borderStrong : "transparent"}`,
        padding: 8,
        color: active ? colors.accent : colors.subtext,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 10,
        transition: "all 0.15s ease"
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.background = active ? colors.accentSoft : "transparent"
      }}>
      {children}
    </button>
  )
}

export function Header({
  activeView,
  setActiveView,
  colors,
  isDark,
  onClose
}: {
  activeView: "main" | "support" | "donate"
  setActiveView: (view: "main" | "support" | "donate") => void
  colors: ThemeColors
  isDark: boolean
  onClose?: () => void
}) {
  const { settings, setSettings, toggleSetting } = useSettings()
  const isEnabled = !!settings?.isExtensionEnabled

  const handleThemeChange = () => {
    const current = settings?.theme || defaultSettings.theme
    const next = current === "dark" ? "light" : "dark"
    setSettings({ ...(settings || defaultSettings), theme: next })
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 16px 12px",
        borderBottom: `1px solid ${colors.border}`,
        background: colors.bgElevated,
        flexShrink: 0
      }}>
      {activeView === "main" ? (
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ position: "relative" }}>
            <img
              src={EXTENSION_ICON_URL}
              alt="YouDefineTube"
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                boxShadow: `0 4px 12px ${colors.accentSoft}`
              }}
            />
            <span
              style={{
                position: "absolute",
                bottom: -1,
                right: -1,
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: isEnabled ? colors.success : colors.danger,
                border: `2px solid ${colors.bgElevated}`
              }}
            />
          </div>
          <div>
            <h1 style={{ fontSize: 17, fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>
              YouDefineTube
            </h1>
            <p style={{ margin: 0, fontSize: 11, color: colors.muted, fontWeight: 500 }}>
              {isEnabled ? "Focus mode active" : "Extension paused"}
            </p>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setActiveView("main")}
          style={{
            background: colors.tabBg,
            border: `1px solid ${colors.border}`,
            padding: "8px 12px",
            color: colors.text,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
            borderRadius: 10
          }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back
        </button>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <IconButton onClick={handleThemeChange} label="Toggle theme" colors={colors} isDark={isDark}>
          {settings?.theme === "light" ? <Icons.Sun /> : <Icons.Moon />}
        </IconButton>
        <IconButton
          onClick={() => toggleSetting("isExtensionEnabled")}
          label="Toggle extension"
          colors={colors}
          isDark={isDark}
          active={isEnabled}>
          <Icons.Power isOn={isEnabled} size={18} color={isEnabled ? colors.accent : colors.danger} />
        </IconButton>
        {onClose && (
          <IconButton onClick={onClose} label="Close panel" colors={colors} isDark={isDark}>
            <Icons.Close size={16} />
          </IconButton>
        )}
      </div>
    </div>
  )
}
