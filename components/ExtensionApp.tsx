import { useState } from "react"
import { useStorage } from "@plasmohq/storage/hook"

import { defaultSettings, type Settings } from "~/lib/settings"
import { STORAGE_KEYS } from "~/lib/constants"
import { createEmptyDailyUsage, getLocalDateKey, type DailyUsage } from "~/lib/time-tracking"
import { PANEL_WIDTH } from "~/lib/theme"

import { useTheme } from "~/hooks/useTheme"
import { useSettings } from "~/hooks/useSettings"
import { Header } from "./popup/Header"
import { Footer } from "./popup/Footer"
import { TimerCard } from "./ui/TimerCard"
import { DailyLimitCard } from "./ui/DailyLimitCard"
import { TabBar } from "./ui/TabBar"
import { MainDashboard } from "./views/MainDashboard"
import { PowerOffView } from "./views/PowerOffView"
import { SupportView } from "./views/SupportView"
import { DonateView } from "./views/DonateView"
import { BookmarksView } from "./views/BookmarksView"

type ExtensionAppProps = {
  onClose?: () => void
}

export function ExtensionApp({ onClose }: ExtensionAppProps) {
  const { settings, setSettings } = useSettings()
  const [todayUsage] = useStorage<DailyUsage>(
    STORAGE_KEYS.TIME_TRACKING_TODAY,
    createEmptyDailyUsage(getLocalDateKey())
  )

  const [activeView, setActiveView] = useState<"main" | "support" | "donate">("main")
  const mainTab = settings?.activeTab || "stats"
  const setMainTab = (tab: "stats" | "filters" | "bookmarks") => {
    setSettings({ ...(settings || defaultSettings), activeTab: tab })
  }
  const { isDark, colors } = useTheme()

  return (
    <div className="ydt-extension-app" style={{ background: colors.bg, color: colors.text, height: "100%" }}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" />
      <style>{`
        .ydt-extension-app {
          margin: 0;
          padding: 0;
          overflow: hidden;
          background: ${colors.bg};
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          -webkit-font-smoothing: antialiased;
        }
        .ydt-extension-app * { box-sizing: border-box; }
        .ydt-extension-app ::-webkit-scrollbar { width: 6px; }
        .ydt-extension-app ::-webkit-scrollbar-thumb {
          background: ${isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)"};
          border-radius: 99px;
        }
        .ydt-extension-app .category-header {
          padding: 8px 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          user-select: none;
          border-radius: 10px;
          transition: background 0.15s ease;
        }
        .ydt-extension-app .category-header:hover {
          background: ${colors.cardHover};
        }
        .ydt-extension-app .setting-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 6px;
          border-radius: 10px;
          transition: background 0.15s ease;
        }
        .ydt-extension-app .setting-row:hover {
          background: ${colors.cardHover};
        }
        .ydt-extension-app input[type="range"] { accent-color: ${colors.accent}; }
        .ydt-extension-app input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: ${colors.accent};
          cursor: pointer;
          box-shadow: 0 2px 8px ${colors.accentSoft};
        }
        .ydt-extension-app .tooltip-container {
          position: relative;
          display: inline-flex;
          align-items: center;
          cursor: pointer;
          color: ${colors.label};
          opacity: 0.7;
        }
        .ydt-extension-app .tooltip-container:hover { opacity: 1; color: ${colors.text}; }
        .ydt-extension-app .tooltip-text {
          visibility: hidden;
          width: 220px;
          background: ${colors.cardBg};
          color: ${colors.text};
          border-radius: 10px;
          padding: 10px 12px;
          position: absolute;
          z-index: 999;
          bottom: 130%;
          left: 50%;
          transform: translateX(-50%);
          opacity: 0;
          transition: opacity 0.2s ease, transform 0.2s ease;
          box-shadow: ${colors.shadow};
          border: 1px solid ${colors.borderStrong};
          font-size: 11px;
          line-height: 1.45;
          font-weight: 500;
          pointer-events: none;
        }
        .ydt-extension-app .tooltip-container:hover .tooltip-text {
          visibility: visible;
          opacity: 1;
          transform: translateX(-50%) translateY(-2px);
        }
      `}</style>

      <div
        style={{
          width: PANEL_WIDTH,
          height: "100%",
          background: colors.bg,
          color: colors.text,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden"
        }}>
        <Header
          activeView={activeView}
          setActiveView={setActiveView}
          colors={colors}
          isDark={isDark}
          onClose={onClose}
        />

        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0 }}>
          {activeView === "support" && (
            <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
              <SupportView colors={colors} isDark={isDark} />
            </div>
          )}

          {activeView === "donate" && (
            <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
              <DonateView colors={colors} isDark={isDark} />
            </div>
          )}

          {activeView === "main" && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0 }}>
              {!settings?.isExtensionEnabled ? (
                <PowerOffView colors={colors} isDark={isDark} />
              ) : (
                <>
                  <div style={{ padding: "14px 0 12px", flexShrink: 0 }}>
                    <TabBar active={mainTab} onChange={setMainTab} colors={colors} isDark={isDark} />
                  </div>

                  <div style={{ flex: 1, overflowY: "auto", padding: "4px 16px 16px", minHeight: 0 }}>
                    {mainTab === "stats" && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                        <TimerCard colors={colors} isDark={isDark} />
                        <DailyLimitCard colors={colors} isDark={isDark} />
                        <div
                          style={{
                            padding: "12px 14px",
                            background: colors.accentSoft,
                            border: `1px solid ${colors.border}`,
                            borderRadius: 12,
                            textAlign: "center",
                            fontSize: 12,
                            fontWeight: 600,
                            color: colors.subtext
                          }}>
                          Extensions used today:{" "}
                          <span style={{ color: colors.accent, fontWeight: 800 }}>
                            {todayUsage?.extensionsUsed || 0}
                          </span>{" "}
                          / 2
                        </div>
                      </div>
                    )}
                    {mainTab === "filters" && <MainDashboard colors={colors} isDark={isDark} />}
                    {mainTab === "bookmarks" && (
                      <BookmarksView colors={colors} isDark={isDark} inline />
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {activeView === "main" && <Footer setActiveView={setActiveView} colors={colors} />}
      </div>
    </div>
  )
}
