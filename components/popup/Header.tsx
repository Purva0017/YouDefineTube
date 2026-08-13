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
  isDark
}: {
  onClick: () => void
  label: string
  children: ReactNode
  colors: ThemeColors
  isDark: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      style={{
        background: "transparent",
        border: "none",
        padding: 8,
        color: colors.muted,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 8,
        transition: "color 0.15s ease, background 0.15s ease"
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = colors.text
        e.currentTarget.style.background = colors.tabBg
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = colors.muted
        e.currentTarget.style.background = "transparent"
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
        padding: "16px 20px",
        borderBottom: `1px solid ${colors.border}`,
        background: colors.bgElevated,
        flexShrink: 0
      }}>
      {activeView === "main" ? (
        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
          <img
            src={EXTENSION_ICON_URL}
            alt="YouDefineTube"
            style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0 }}
          />
          <div style={{ minWidth: 0 }}>
            <h1 style={{ fontSize: 17, fontWeight: 700, margin: 0, lineHeight: 1.2 }}>
              YouDefineTube
            </h1>
            <p style={{ margin: "3px 0 0", fontSize: 13, color: colors.muted, fontWeight: 400, lineHeight: 1.3 }}>
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
            padding: "8px 14px",
            color: colors.text,
            fontSize: 14,
            fontWeight: 500,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 4,
            borderRadius: 8,
            transition: "background 0.15s ease"
          }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back
        </button>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}>
        <IconButton onClick={handleThemeChange} label="Toggle theme" colors={colors} isDark={isDark}>
          {settings?.theme === "light" ? <Icons.Sun /> : <Icons.Moon />}
        </IconButton>
        {activeView === "main" && (
          <button
            type="button"
            onClick={() => toggleSetting("isExtensionEnabled")}
            aria-label="Toggle extension"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 14px",
              borderRadius: 8,
              border: `1px solid ${isEnabled ? colors.accent : colors.border}`,
              background: isEnabled ? colors.accentSoft : colors.tabBg,
              color: isEnabled ? colors.accent : colors.muted,
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
              transition: "all 0.2s ease"
            }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: isEnabled ? colors.accent : colors.muted,
                transition: "background 0.2s ease"
              }}
            />
            {isEnabled ? "On" : "Off"}
          </button>
        )}
        {onClose && (
          <IconButton onClick={onClose} label="Close panel" colors={colors} isDark={isDark}>
            <Icons.Close size={16} />
          </IconButton>
        )}
      </div>
    </div>
  )
}
