import { useSettings } from "~/hooks/useSettings"
import type { ThemeColors } from "~/lib/theme"
import { Icons } from "../ui/Icons"

export function PowerOffView({ colors, isDark }: { colors: ThemeColors; isDark: boolean }) {
  const { toggleSetting } = useSettings()

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        flex: 1,
        padding: "40px 32px",
        textAlign: "center"
      }}>
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: 16,
          background: colors.tabBg,
          border: `1px solid ${colors.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 20
        }}>
        <Icons.Power isOn={false} size={32} color={colors.muted} />
      </div>

      <h2 style={{ margin: "0 0 8px 0", fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em" }}>
        Extension is paused
      </h2>
      <p style={{ margin: "0 0 24px 0", fontSize: 13, color: colors.subtext, lineHeight: 1.6, maxWidth: 260 }}>
        YouTube is running with defaults. Turn on YouDefineTube to block distractions and track your time.
      </p>

      <button
        type="button"
        onClick={() => toggleSetting("isExtensionEnabled")}
        style={{
          padding: "12px 24px",
          borderRadius: 8,
          background: colors.accent,
          border: "none",
          color: "#fff",
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
          transition: "background 0.15s ease"
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = colors.accentHover }}
        onMouseLeave={(e) => { e.currentTarget.style.background = colors.accent }}>
        Turn on YouDefineTube
      </button>
    </div>
  )
}
