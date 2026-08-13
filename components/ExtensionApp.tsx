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
          line-height: 1.5;
          letter-spacing: -0.01em;
          font-size: 14px;
        }
        .ydt-extension-app * { box-sizing: border-box; }
        .ydt-scroll-area {
          overflow-y: auto;
          overflow-x: hidden;
          overscroll-behavior: contain;
          -webkit-overflow-scrolling: touch;
        }
        .ydt-extension-app ::-webkit-scrollbar { width: 4px; }
        .ydt-extension-app ::-webkit-scrollbar-thumb {
          background: ${isDark ? "rgba(255,245,230,0.10)" : "rgba(44,37,32,0.10)"};
          border-radius: 99px;
        }
        .ydt-extension-app ::-webkit-scrollbar-track { background: transparent; }
        .ydt-extension-app input[type="range"]:not(.ydt-wave-slider) {
          -webkit-appearance: none;
          appearance: none;
          height: 6px;
          background: ${isDark ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.1)"};
          border-radius: 99px;
          outline: none;
        }
        .ydt-extension-app input[type="range"]:not(.ydt-wave-slider)::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: ${isDark ? "#f4f0ff" : "#ffffff"};
          cursor: pointer;
          border: 2px solid ${colors.accent};
          box-shadow: 0 2px 8px rgba(0,0,0,0.25);
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
            <div className="ydt-scroll-area" style={{ flex: 1, padding: 20 }}>
              <SupportView colors={colors} isDark={isDark} />
            </div>
          )}

          {activeView === "donate" && (
            <div className="ydt-scroll-area" style={{ flex: 1, padding: 20 }}>
              <DonateView colors={colors} isDark={isDark} />
            </div>
          )}

          {activeView === "main" && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0 }}>
              {!settings?.isExtensionEnabled ? (
                <PowerOffView colors={colors} isDark={isDark} />
              ) : (
                <>
                  <div style={{ padding: "12px 20px 8px", flexShrink: 0 }}>
                    <TabBar active={mainTab} onChange={setMainTab} colors={colors} isDark={isDark} />
                  </div>

                  <div className="ydt-scroll-area" style={{ flex: 1, padding: "4px 20px 20px", minHeight: 0 }}>
                    {mainTab === "stats" && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        <TimerCard colors={colors} isDark={isDark} />
                        <DailyLimitCard colors={colors} isDark={isDark} />
                        <div
                          style={{
                            padding: "14px 16px",
                            background: colors.cardBg,
                            border: `1px solid ${colors.border}`,
                            borderRadius: 8,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between"
                          }}>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: colors.muted, letterSpacing: "0.03em" }}>
                              Time extensions today
                            </div>
                            <div style={{ fontSize: 11, color: colors.subtext, marginTop: 2 }}>
                              +5 minutes each
                            </div>
                          </div>
                          <div style={{ fontSize: 20, fontWeight: 700, color: colors.text, letterSpacing: "-0.02em" }}>
                            {todayUsage?.extensionsUsed || 0}
                            <span style={{ fontSize: 13, fontWeight: 500, color: colors.muted }}> / 2</span>
                          </div>
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

        {activeView === "main" && <Footer setActiveView={setActiveView} colors={colors} isDark={isDark} />}
      </div>
    </div>
  )
}
