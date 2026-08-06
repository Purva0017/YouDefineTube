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
        padding: "32px 28px",
        textAlign: "center"
      }}>
      <div
        style={{
          width: 100,
          height: 100,
          borderRadius: 28,
          background: colors.tabBg,
          border: `1px solid ${colors.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 24
        }}>
        <Icons.Power isOn={false} size={44} color={colors.danger} />
      </div>

      <h2 style={{ margin: "0 0 8px 0", fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em" }}>
        Extension is paused
      </h2>
      <p style={{ margin: "0 0 28px 0", fontSize: 14, color: colors.subtext, lineHeight: 1.6, maxWidth: 280 }}>
        YouTube is running with default settings. Turn on YouDefineTube to block distractions and track your time.
      </p>

      <button
        type="button"
        onClick={() => toggleSetting("isExtensionEnabled")}
        style={{
          padding: "14px 28px",
          borderRadius: 14,
          background: colors.accentGradient,
          border: "none",
          color: "#fff",
          fontSize: 14,
          fontWeight: 700,
          cursor: "pointer",
          boxShadow: `0 10px 24px ${colors.accentSoft}`
        }}>
        Turn on YouDefineTube
      </button>
    </div>
  )
}
