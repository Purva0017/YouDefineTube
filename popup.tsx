import { useState } from "react"
import { useStorage } from "@plasmohq/storage/hook"

import { defaultSettings, type Settings } from "~/lib/settings"
import { STORAGE_KEYS } from "~/lib/constants"
import { createEmptyDailyUsage, getLocalDateKey, type DailyUsage } from "~/lib/time-tracking"

import { useTheme } from "./hooks/useTheme"
import { useSettings } from "./hooks/useSettings"
import { Header } from "./components/popup/Header"
import { Footer } from "./components/popup/Footer"
import { TimerCard } from "./components/ui/TimerCard"
import { DailyLimitCard } from "./components/ui/DailyLimitCard"
import { MainDashboard } from "./components/views/MainDashboard"
import { PowerOffView } from "./components/views/PowerOffView"
import { SupportView } from "./components/views/SupportView"
import { DonateView } from "./components/views/DonateView"
import { BookmarksView } from "./components/views/BookmarksView"

function IndexPopup() {
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
    <>
      <style>{`
        body {
          margin: 0;
          padding: 0;
          overflow: hidden;
          background: ${colors.bg};
        }
        .category-header {
          padding: 5px 2px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          user-select: none;
          border-radius: 4px;
          transition: background 0.1s ease;
        }
        .category-header:hover {
          background: ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'};
        }
        .setting-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 5px 4px;
          border-radius: 6px;
          transition: background 0.1s ease;
        }
        .setting-row:hover {
          background: ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.025)'};
        }
        /* Custom range slider styling */
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #cc0000;
          cursor: pointer;
          transition: transform 0.1s ease, background 0.1s ease;
        }
        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.25);
          background: #ff3333;
        }
        input[type="range"]::-moz-range-thumb {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #cc0000;
          cursor: pointer;
          border: none;
          transition: transform 0.1s ease, background 0.1s ease;
        }
        input[type="range"]::-moz-range-thumb:hover {
          transform: scale(1.25);
          background: #ff3333;
        }
        /* Tooltip styling */
        .tooltip-container {
          position: relative;
          display: inline-flex;
          align-items: center;
          cursor: pointer;
          color: ${colors.label};
          opacity: 0.65;
          transition: opacity 0.2s, color 0.2s;
        }
        .tooltip-container:hover {
          color: ${colors.text};
          opacity: 1;
        }
        .tooltip-text {
          visibility: hidden;
          width: 210px;
          background-color: ${isDark ? "#282828" : "#ffffff"};
          color: ${isDark ? "#ffffff" : "#111827"};
          text-align: left;
          border-radius: 8px;
          padding: 8px 12px;
          position: absolute;
          z-index: 999;
          bottom: 135%; /* Position above the icon */
          left: 50%;
          transform: translateX(-50%);
          opacity: 0;
          transition: opacity 0.2s ease, transform 0.2s ease;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
          border: 1px solid ${isDark ? "#3f3f3f" : "#d1d5db"};
          font-size: 11px;
          line-height: 1.45;
          font-weight: 500;
          pointer-events: none;
        }
        .tooltip-container:hover .tooltip-text {
          visibility: visible;
          opacity: 1;
          transform: translateX(-50%) translateY(-2px);
        }
      `}</style>

      <div
        style={{
          width: 390,
          height: 590,
          background: colors.bg,
          color: colors.text,
          fontFamily: "'Inter', system-ui, sans-serif",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          transition: "background 0.3s, color 0.3s"
        }}>

        <Header
          activeView={activeView}
          setActiveView={setActiveView}
          colors={colors}
          isDark={isDark}
        />

        {/* Main Content Area */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {activeView === "support" && (
            <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
              <SupportView colors={colors} isDark={isDark} />
            </div>
          )}

          {activeView === "donate" && (
            <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
              <DonateView colors={colors} isDark={isDark} />
            </div>
          )}

          {activeView === "main" && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
              {!settings?.isExtensionEnabled ? (
                <div style={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto" }}>
                  <PowerOffView colors={colors} />
                </div>
              ) : (
                <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                  {/* Tab Switcher Bar */}
                  <div style={{
                    display: "flex",
                    margin: "12px 20px 0",
                    background: isDark ? "#1e1e1e" : "#f3f4f6",
                    borderRadius: 10,
                    padding: 3,
                    border: `1px solid ${colors.border}`,
                    flexShrink: 0
                  }}>
                    <button
                      onClick={() => setMainTab("stats")}
                      style={{
                        flex: 1,
                        padding: "8px 0",
                        border: "none",
                        borderRadius: 8,
                        background: mainTab === "stats" ? (isDark ? "#2a2a2a" : "#ffffff") : "transparent",
                        color: mainTab === "stats" ? colors.text : colors.subtext,
                        fontWeight: 700,
                        fontSize: 11,
                        cursor: "pointer",
                        boxShadow: mainTab === "stats" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                        transition: "all 0.2s"
                      }}
                    >
                      📊 Stats
                    </button>
                    <button
                      onClick={() => setMainTab("filters")}
                      style={{
                        flex: 1,
                        padding: "8px 0",
                        border: "none",
                        borderRadius: 8,
                        background: mainTab === "filters" ? (isDark ? "#2a2a2a" : "#ffffff") : "transparent",
                        color: mainTab === "filters" ? colors.text : colors.subtext,
                        fontWeight: 700,
                        fontSize: 11,
                        cursor: "pointer",
                        boxShadow: mainTab === "filters" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                        transition: "all 0.2s"
                      }}
                    >
                      ⚙️ Blocks
                    </button>
                    <button
                      onClick={() => setMainTab("bookmarks")}
                      style={{
                        flex: 1,
                        padding: "8px 0",
                        border: "none",
                        borderRadius: 8,
                        background: mainTab === "bookmarks" ? (isDark ? "#2a2a2a" : "#ffffff") : "transparent",
                        color: mainTab === "bookmarks" ? colors.text : colors.subtext,
                        fontWeight: 700,
                        fontSize: 11,
                        cursor: "pointer",
                        boxShadow: mainTab === "bookmarks" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                        transition: "all 0.2s"
                      }}
                    >
                      🔖 Bookmarks
                    </button>
                  </div>

                  {/* Scrollable Tab Content */}
                  <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px 20px" }}>
                    {mainTab === "stats" && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        <TimerCard colors={colors} isDark={isDark} />
                        <DailyLimitCard colors={colors} isDark={isDark} />

                        {/* Extensions Band */}
                        <div
                          style={{
                            margin: "0px -20px -20px",
                            padding: "8px",
                            background: isDark ? "#2a2a2a" : "#f3f4f6",
                            borderTop: `1px solid ${colors.border}`,
                            textAlign: "center",
                            fontSize: 11,
                            fontWeight: 600,
                            color: colors.label
                          }}>
                          Extensions used today: {todayUsage?.extensionsUsed || 0} / 2
                        </div>
                      </div>
                    )}
                    {mainTab === "filters" && (
                      <MainDashboard colors={colors} isDark={isDark} />
                    )}
                    {mainTab === "bookmarks" && (
                      <BookmarksView colors={colors} isDark={isDark} />
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {activeView === "main" && (
          <Footer
            setActiveView={setActiveView}
            colors={colors}
          />
        )}
      </div>
    </>
  )
}

export default IndexPopup
