import { useSettings } from "~/hooks/useSettings"
import { defaultSettings, type Settings } from "~/lib/settings"
import iconUrl from "url:~/assets/icon.png"
import { Icons } from "../ui/Icons"

export function Header({
  activeView,
  setActiveView,
  colors,
  isDark
}: {
  activeView: "main" | "support" | "donate"
  setActiveView: (view: "main" | "support" | "donate") => void
  colors: any
  isDark: boolean
}) {
  const { settings, setSettings, toggleSetting } = useSettings()

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
        padding: "16px 20px 8px",
        borderBottom: activeView === "main" ? `1px solid ${colors.border}` : "none"
      }}>
      {activeView === "main" ? (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img
            src={iconUrl}
            alt="YouDefineTube"
            style={{ width: 28, height: 28, borderRadius: 6 }}
          />
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>YouDefineTube</h1>
        </div>
      ) : (
        <button
          onClick={() => setActiveView("main")}
          style={{
            background: "none",
            border: "none",
            padding: 0,
            color: colors.subtext,
            fontSize: 16,
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 4
          }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back
        </button>
      )}

      {/* Header Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {/* Theme Toggle Button */}
        <button
          onClick={handleThemeChange}
          style={{
            background: "none",
            border: "none",
            padding: 6,
            color: colors.subtext,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "50%",
            transition: "background 0.2s"
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "none")}>
          {settings?.theme === "light" ? <Icons.Sun /> : <Icons.Moon />}
        </button>

        {/* Global Power Button */}
        <button
          onClick={() => toggleSetting("isExtensionEnabled")}
          style={{
            background: "none",
            border: "none",
            padding: 6,
            color: colors.text,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "50%",
            transition: "background 0.2s",
            transform: "translateY(-0.5px)"
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "none")}>
          <Icons.Power isOn={settings?.isExtensionEnabled} />
        </button>
      </div>
    </div>
  )
}
