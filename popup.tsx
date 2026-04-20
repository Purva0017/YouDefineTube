import { useEffect, useState } from "react"
import iconUrl from "url:~/assets/icon.png"
import paypalQrUrl from "url:~/assets/paypal-qr.png"
import razorpayQrUrl from "url:~/assets/razorpay-qr.png"
import { useStorage } from "@plasmohq/storage/hook"

import { defaultSettings, type Settings } from "~/lib/settings"
import {
  TIME_TRACKING_TODAY_KEY,
  createEmptyDailyUsage,
  getLocalDateKey,
  type DailyUsage
} from "~/lib/time-tracking"

const formatDuration = (ms: number) => {
  const totalMinutes = Math.floor(ms / 60000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (hours === 0) {
    return `${minutes}m`
  }

  return `${hours}h ${minutes}m`
}

const formatMinutes = (m: number) => {
  const hours = Math.floor(m / 60)
  const minutes = m % 60
  if (hours === 0) return `${minutes}m`
  return `${hours}h ${minutes}m`
}

// Icons from screen.png
const Icons = {
  Shorts: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="m13.467 1.19-8 4.7a5 5 0 00-.255 8.46 5 5 0 005.32 8.462l8-4.7a5 5 0 00.258-8.462 5 5 0 001.641-6.464l-.12-.217a5 5 0 00-6.844-1.78m5.12 2.79a2.999 2.999 0 01-1.067 4.107l-1.327.78a1 1 0 00.096 1.775l.943.423a3 3 0 01.288 5.323l-8 4.7a3 3 0 01-3.039-5.173l1.327-.78a1 1 0 00-.097-1.775l-.942-.423a3 3 0 01-.288-5.323l8-4.7a3 3 0 014.106 1.066ZM15 12l-5-3v6l5-3Z" />
    </svg>
  ),
  Play: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  ),
  Comments: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M1 6a4 4 0 014-4h14a4 4 0 014 4v10a4 4 0 01-4 4h-4.8l-5.105 2.836A1.41 1.41 0 017 21.604V20H5a4 4 0 01-4-4V6Zm8 12v2.601l4.229-2.35.453-.251H19a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h4ZM7 8a1 1 0 000 2h10a1 1 0 100-2H7Zm-1 5a1 1 0 001 1h6a1 1 0 000-2H7a1 1 0 00-1 1Z" />
    </svg>
  ),
  Chat: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2z" />
      <path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1" />
    </svg>
  ),
  Home: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="m11.485 2.143-8 4.8-2 1.2a1 1 0 001.03 1.714L3 9.567V20a2 2 0 002 2h6v-7h2v7h6a2 2 0 002-2V9.567l.485.29a1 1 0 001.03-1.714l-2-1.2-8-4.8a1 1 0 00-1.03 0ZM5 8.366l7-4.2 7 4.2V20h-4v-5.5a1.5 1.5 0 00-1.5-1.5h-3A1.5 1.5 0 009 14.5V20H5V8.366Z" />
    </svg>
  ),
  Sidebar: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="14" x="3" y="5" rx="2" />
      <path d="M13 5v14" />
      <path d="M7 10l3 2-3 2v-4z" />
      <path d="M16.5 9h1.5" />
      <path d="M16.5 12h1.5" />
      <path d="M16.5 15h1.5" />
    </svg>
  ),
  EndScreen: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="0.8" y="2.5" width="18.4" height="13" rx="2" />
      <rect x="3" y="6" width="7.5" height="6" rx="1" />
      <circle cx="15" cy="9" r="2.5" />
    </svg>
  ),
  Video: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m22 8-6 4 6 4V8Z" />
      <rect width="14" height="12" x="2" y="6" rx="2" ry="2" />
    </svg>
  ),
  Search: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  ),
  Monitor: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="14" x="2" y="3" rx="2" />
      <line x1="8" x2="16" y1="21" y2="21" />
      <line x1="12" x2="12" y1="17" y2="21" />
    </svg>
  ),
  Warning: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  ),
  Sun: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M22 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  ),
  Moon: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  ),
  External: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 4 }}>
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  ),
  Chevron: ({ rotated }: { rotated?: boolean }) => (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        marginLeft: 4,
        transition: "transform 0.2s",
        transform: `translateY(0.5px) ${rotated ? "rotate(0deg)" : "rotate(-90deg)"}`,
        opacity: 0.5
      }}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
  CategoryToggle: ({ rotated }: { rotated?: boolean }) => (
    <svg
      width="10"
      height="10"
      viewBox="2 2 12 12"
      fill="currentColor"
      style={{
        transition: "transform 0.15s ease",
        transform: rotated ? "rotate(90deg)" : "rotate(0deg)",
        transformOrigin: "center",
        flexShrink: 0
      }}
    >
      <path d="M5 3l6 5-6 5z" />
    </svg>
  )
}

function CustomToggle({
  checked,
  onChange,
  isDark,
  size = "medium"
}: {
  checked: boolean;
  onChange: () => void;
  isDark: boolean;
  size?: "small" | "medium"
}) {
  const isSmall = size === "small"
  return (
    <div
      onClick={onChange}
      style={{
        width: isSmall ? 32 : 44,
        height: isSmall ? 18 : 24,
        borderRadius: isSmall ? 9 : 12,
        background: checked ? "#cc0000" : (isDark ? "#3f3f3f" : "#d1d5db"),
        position: "relative",
        cursor: "pointer",
        transition: "background 0.2s"
      }}>
      <div
        style={{
          width: isSmall ? 14 : 18,
          height: isSmall ? 14 : 18,
          borderRadius: "50%",
          background: "white",
          position: "absolute",
          top: isSmall ? 2 : 3,
          left: checked ? (isSmall ? 16 : 23) : (isSmall ? 2 : 3),
          transition: "left 0.2s",
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)"
        }}
      />
    </div>
  )
}

function IndexPopup() {
  const [settings, setSettings] = useStorage<Settings>("settings", defaultSettings)
  const [todayUsage, setTodayUsage] = useStorage<DailyUsage>(
    TIME_TRACKING_TODAY_KEY,
    createEmptyDailyUsage(getLocalDateKey())
  )
  const [activeView, setActiveView] = useState<"main" | "support" | "donate">("main")

  const [inputLimitHours, setInputLimitHours] = useState<number | string>("")
  const [inputLimitMinutes, setInputLimitMinutes] = useState<number | string>("")

  const [isSearchOpen, setIsSearchOpen] = useState(true)
  const [isGeneralOpen, setIsGeneralOpen] = useState(true)

  // Theme Logic
  const [systemDark, setSystemDark] = useState(false)
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)")
    setSystemDark(media.matches)
    const listener = (e: MediaQueryListEvent) => setSystemDark(e.matches)
    media.addEventListener("change", listener)
    return () => media.removeEventListener("change", listener)
  }, [])

  const currentTheme = settings?.theme || "system"
  const isDark = currentTheme === "system" ? systemDark : currentTheme === "dark"

  // Theme Colors
  const colors = {
    bg: isDark ? "#0f0f0f" : "#ffffff",
    cardBg: isDark ? "#1e1e1e" : "#f9fafb",
    text: isDark ? "#f1f1f1" : "#111827",
    subtext: isDark ? "#aaaaaa" : "#4b5563",
    border: isDark ? "#2a2a2a" : "#f3f4f6",
    inputBg: isDark ? "#2a2a2a" : "#ffffff",
    inputBorder: isDark ? "#3f3f3f" : "#e5e7eb",
    label: isDark ? "#888888" : "#6b7280"
  }

  // Sync inputs with settings on load and when settings change elsewhere
  useEffect(() => {
    if (settings) {
      const totalMinutes = settings.dailyLimitMinutes || defaultSettings.dailyLimitMinutes
      setInputLimitHours(Math.floor(totalMinutes / 60))
      setInputLimitMinutes(totalMinutes % 60)
    }
  }, [settings?.dailyLimitMinutes])

  const limitMinutes = settings?.dailyLimitMinutes || defaultSettings.dailyLimitMinutes
  const limitReached = !!todayUsage?.dailyLimitReachedAt

  const onToggle = (key: keyof Settings) => {
    setSettings({ ...(settings || defaultSettings), [key]: !settings?.[key] })
  }

  const onUpdateLimit = () => {
    const h = Number.parseInt(String(inputLimitHours), 10) || 0
    const m = Number.parseInt(String(inputLimitMinutes), 10) || 0
    const nextLimit = h * 60 + m
    const finalLimit = nextLimit > 0 ? nextLimit : 1

    const nextSettings = { ...(settings || defaultSettings), dailyLimitMinutes: finalLimit }
    setSettings(nextSettings)

    if (todayUsage) {
      const nextUsage = { ...todayUsage, extensionsUsed: 0 }
      const currentTotalMinutes = Math.floor((nextUsage.totalYoutubeMs || 0) / 60000)
      const allowedLimitMinutes = finalLimit

      if (currentTotalMinutes < allowedLimitMinutes) {
        nextUsage.dailyLimitReachedAt = null
      } else if (!nextUsage.dailyLimitReachedAt) {
        nextUsage.dailyLimitReachedAt = Date.now()
      }
      setTodayUsage(nextUsage)
    }
  }

  // Progress Bar Widths
  const totalMs = todayUsage?.totalYoutubeMs || 1 // Avoid division by zero
  const limitMs = limitMinutes * 60000

  const watchPercent = ((todayUsage?.watchVideoMs || 0) / limitMs) * 100
  const browsePercent = ((todayUsage?.browseMs || 0) / limitMs) * 100
  const searchPercent = ((todayUsage?.searchMs || 0) / limitMs) * 100

  const [isHoverTheme, setIsHoverTheme] = useState(false)

  const renderMainDashboard = () => (
    <>
      {/* Settings List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>

        {/* General Distractions Header */}
        <div
          onClick={() => setIsGeneralOpen(!isGeneralOpen)}
          className="category-header"
          style={{ marginTop: 2 }}>
          <Icons.CategoryToggle rotated={isGeneralOpen} />
          <span style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: "uppercase" as const,
            letterSpacing: "0.06em",
            color: isDark ? "#cccccc" : "#555555",
            flex: 1
          }}>
            General Distractions
          </span>
        </div>

        {isGeneralOpen && (
          <div style={{ paddingLeft: 18 }}>
            {[
              { key: "hideShorts", label: "Hide Shorts", icon: <Icons.Shorts /> },
              { key: "hideHomepageRecommendations", label: "Hide Homepage Recommendations", icon: <Icons.Home /> },
              { key: "hideSuggestedVideos", label: "Hide Video Sidebar Recommendations", icon: <Icons.Sidebar /> },
              { key: "hideComments", label: "Hide Comments", icon: <Icons.Comments /> },
              { key: "hideEndScreen", label: "Hide End Screen", icon: <Icons.EndScreen /> },
              { key: "hideLiveChat", label: "Hide Live Chat", icon: <Icons.Chat /> },
            ].map((item) => (
              <div key={item.key}>
                <div className="setting-row">
                  <div style={{ display: "flex", alignItems: "center", gap: 8, color: colors.text, fontSize: 13, fontWeight: 500 }}>
                    <div style={{ opacity: 0.7, display: "flex", alignItems: "center" }}>{item.icon}</div>
                    {item.label}
                    {item.key === "hideHomepageRecommendations" && (
                      <Icons.Chevron rotated={!!settings?.hideHomepageRecommendations} />
                    )}
                  </div>
                  <CustomToggle
                    checked={!!settings?.[item.key as keyof Settings]}
                    onChange={() => onToggle(item.key as keyof Settings)}
                    isDark={isDark}
                  />
                </div>
                {item.key === "hideHomepageRecommendations" && settings?.hideHomepageRecommendations && (
                  <div className="setting-row" style={{ paddingLeft: 28, marginTop: -2 }}>
                    <div style={{ color: colors.subtext, fontSize: 12, fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 10, height: 10, borderLeft: `1.5px solid ${isDark ? '#444' : '#d1d5db'}`, borderBottom: `1.5px solid ${isDark ? '#444' : '#d1d5db'}`, marginBottom: 2 }} />
                      Redirect to Subscriptions
                    </div>
                    <CustomToggle
                      checked={!!settings?.redirectHomeToSubscriptions}
                      onChange={() => onToggle("redirectHomeToSubscriptions")}
                      isDark={isDark}
                      size="small"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Search Refinements Header */}
        <div
          onClick={() => setIsSearchOpen(!isSearchOpen)}
          className="category-header"
          style={{ marginTop: 4 }}>
          <Icons.CategoryToggle rotated={isSearchOpen} />
          <span style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: "uppercase" as const,
            letterSpacing: "0.06em",
            color: isDark ? "#cccccc" : "#555555",
            flex: 1
          }}>
            Search Refinements
          </span>
        </div>

        {isSearchOpen && (
          <div style={{ paddingLeft: 18 }}>
            {[
              { key: "hidePeopleAlsoWatched", label: "Hide 'People also watched'", icon: <Icons.Search /> },
              { key: "hidePeopleAlsoSearchFor", label: "Hide 'People also search for'", icon: <Icons.Search /> },
              { key: "hideFromRelatedSearches", label: "Hide 'From related searches'", icon: <Icons.Search /> },
              { key: "hideChannelsNewToYou", label: "Hide 'Channels new to you'", icon: <Icons.Search /> },
              { key: "hideExploreMore", label: "Hide 'Explore more'", icon: <Icons.Search /> }
            ].map((item) => (
              <div key={item.key} className="setting-row">
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: colors.text, fontSize: 13, fontWeight: 500 }}>
                  <div style={{ opacity: 0.7, display: "flex", alignItems: "center" }}>{item.icon}</div>
                  {item.label}
                </div>
                <CustomToggle
                  checked={!!settings?.[item.key as keyof Settings]}
                  onChange={() => onToggle(item.key as keyof Settings)}
                  isDark={isDark}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Daily Limit Card */}
      <div
        style={{
          background: colors.cardBg,
          borderRadius: 16,
          padding: "14px",
          margin: "10px 0",
          display: "flex",
          flexDirection: "column",
          gap: 10,
          border: `1px solid ${colors.border}`
        }}>
        <div style={{ fontSize: 16, fontWeight: 700 }}>Daily Limit</div>

        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
          <div
            onClick={() => onToggle("dailyLimitEnabled")}
            style={{
              width: 18,
              height: 18,
              borderRadius: 4,
              background: settings?.dailyLimitEnabled ? "#cc0000" : colors.inputBg,
              border: `2px solid ${settings?.dailyLimitEnabled ? "#cc0000" : colors.inputBorder}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s"
            }}>
            {settings?.dailyLimitEnabled && (
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, opacity: 0.9 }}>
            Enable Daily Limit Alert
          </span>
        </label>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: colors.inputBg,
              border: `1px solid ${colors.inputBorder}`,
              borderRadius: 10,
              padding: "4px 10px",
              flex: 1
            }}>
            <input
              type="number"
              value={inputLimitHours}
              onChange={(e) => setInputLimitHours(e.target.value)}
              style={{
                width: "100%",
                border: "none",
                outline: "none",
                fontSize: 15,
                fontWeight: 600,
                textAlign: "center",
                background: "transparent",
                color: colors.text
              }}
            />
            <span style={{ fontSize: 13, color: colors.label }}>h</span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: colors.inputBg,
              border: `1px solid ${colors.inputBorder}`,
              borderRadius: 10,
              padding: "4px 10px",
              flex: 1
            }}>
            <input
              type="number"
              value={inputLimitMinutes}
              onChange={(e) => setInputLimitMinutes(e.target.value)}
              style={{
                width: "100%",
                border: "none",
                outline: "none",
                fontSize: 15,
                fontWeight: 600,
                textAlign: "center",
                background: "transparent",
                color: colors.text
              }}
            />
            <span style={{ fontSize: 13, color: colors.label }}>m</span>
          </div>
          <button
            onClick={onUpdateLimit}
            style={{
              flex: 1.5,
              padding: "8px 0",
              background: "#cc0000",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              transition: "background 0.2s"
            }}>
            Update limit
          </button>
        </div>
      </div>

      {/* Today on YouTube Card */}
      <div
        style={{
          background: colors.cardBg,
          borderRadius: 16,
          padding: 14,
          display: "flex",
          flexDirection: "column",
          gap: 10,
          border: `1px solid ${colors.border}`,
          position: "relative",
          overflow: "hidden"
        }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>Today on YouTube</div>
          {limitReached && (
            <div
              style={{
                background: "#fee2e2",
                color: "#dc2626",
                padding: "3px 8px",
                borderRadius: 99,
                fontSize: 10,
                fontWeight: 800,
                display: "flex",
                alignItems: "center",
                gap: 3
              }}>
              Limit Reached <Icons.Warning />
            </div>
          )}
        </div>

        <div style={{ fontSize: 24, fontWeight: 800 }}>
          Total: {formatDuration(todayUsage?.totalYoutubeMs || 0)} / {formatMinutes(limitMinutes)}
        </div>

        {/* Segmented Progress Bar */}
        <div
          style={{
            height: 40,
            background: isDark ? "#333" : "#e5e7eb",
            borderRadius: 10,
            display: "flex",
            overflow: "hidden"
          }}>
          <div
            style={{ width: `${watchPercent}%`, background: "#cc0000", transition: "width 0.3s" }}
          />
          <div
            style={{
              width: `${browsePercent}%`,
              background: isDark ? "#ff4d4d" : "#ef4444",
              transition: "width 0.3s"
            }}
          />
          <div
            style={{
              width: `${searchPercent}%`,
              background: isDark ? "#666" : "#9ca3af",
              transition: "width 0.3s"
            }}
          />
        </div>

        {/* Detailed Breakdown */}
        <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                fontSize: 12,
                fontWeight: 600,
                color: colors.subtext
              }}>
              <Icons.Video /> Watch
            </div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>
              {formatDuration(todayUsage?.watchVideoMs || 0)}
            </div>
          </div>
          <div style={{ width: 1, background: colors.border }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                fontSize: 12,
                fontWeight: 600,
                color: colors.subtext
              }}>
              <Icons.Monitor /> Browse
            </div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>
              {formatDuration(todayUsage?.browseMs || 0)}
            </div>
          </div>
          <div style={{ width: 1, background: colors.border }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                fontSize: 12,
                fontWeight: 600,
                color: colors.subtext
              }}>
              <Icons.Search /> Search
            </div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>
              {formatDuration(todayUsage?.searchMs || 0)}
            </div>
          </div>
        </div>

        {/* Extensions Band */}
        <div
          style={{
            margin: "0 -14px -14px",
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
    </>
  )

  const renderSupportView = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header */}
      <div style={{ marginBottom: 2, textAlign: "center" }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 6px 0" }}>Having Trouble?</h2>
        <p style={{ fontSize: 13, color: colors.subtext, lineHeight: "1.5", margin: 0 }}>
          Try these quick fixes first — they solve most issues.
        </p>
      </div>

      {/* Troubleshoot Steps */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {[
          "Refresh the YouTube page",
          "Close all YouTube tabs & restart your browser",
          "Disable other extensions to rule out conflicts",
          "Remove & re-install YouDefineTube"
        ].map((step, i) => (
          <div key={i} style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
            padding: "6px 0"
          }}>
            <div style={{
              width: 20,
              height: 20,
              borderRadius: "50%",
              background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 11,
              fontWeight: 700,
              color: isDark ? "#888" : "#777",
              flexShrink: 0
            }}>
              {i + 1}
            </div>
            <span style={{ fontSize: 13, color: colors.subtext, lineHeight: "1.5", paddingTop: 1 }}>
              {step}
            </span>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        fontSize: 11,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.04em",
        color: colors.label
      }}>
        <div style={{ flex: 1, height: 1, background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)" }} />
        Still not working?
        <div style={{ flex: 1, height: 1, background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)" }} />
      </div>

      {/* Report Bug Button */}
      <button
        onClick={() => window.open("https://forms.gle/Nb5e5Cbuvuz9ukkDA", "_blank")}
        style={{
          width: "100%",
          padding: "13px 16px",
          borderRadius: 10,
          border: "none",
          background: "#cc0000",
          color: "#ffffff",
          fontWeight: 700,
          fontSize: 14,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          transition: "opacity 0.15s ease"
        }}>
        Report Bug <Icons.External />
      </button>

      {/* Email fallback */}
      <div style={{
        fontSize: 12,
        color: colors.subtext,
        textAlign: "center",
        lineHeight: "1.6"
      }}>
        Or email me at{" "}
        <a
          href="mailto:purvaap17@gmail.com"
          style={{ color: "#cc0000", textDecoration: "none", fontWeight: 700 }}>
          purvaap17@gmail.com
        </a>
        <br />
        <span style={{ fontSize: 11, opacity: 0.7 }}>
          Include a description, screenshot, and browser (Chrome, Edge, Brave, etc.)
        </span>
      </div>
    </div>
  )

  const renderDonateView = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Hero Section */}
      <div style={{ textAlign: "center", marginBottom: 10 }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 10px 0" }}>Fuel the Mission</h2>
        <p style={{ fontSize: 13, color: colors.subtext, lineHeight: "1.5", margin: 0 }}>
          Maintaining this extension requires constant updates. Your contribution helps keep it
          distraction-free for everyone.
        </p>
      </div>

      {/* Payment Gateway Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* India - Razorpay */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.03)",
            border: `1px solid ${colors.border}`,
            borderRadius: 16,
            padding: 20,
            display: "flex",
            flexDirection: "column",
            alignItems: "center"
          }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 800,
              textTransform: "uppercase",
              padding: "2px 8px",
              background: "#3395FF22",
              color: "#3395FF",
              borderRadius: 100,
              marginBottom: 10
            }}>
            India
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 12px 0" }}>Razorpay</h3>
          <button
            onClick={() => window.open("https://pages.razorpay.com/pl_SYKSUs58XJryrS/view", "_blank")}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: 12,
              border: "none",
              background: "#3395FF",
              color: "#ffffff",
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
              marginBottom: 16
            }}>
            Pay via Razorpay
          </button>
          <div style={{ background: "#ffffff", padding: 10, borderRadius: 12, border: isDark ? "none" : "1px solid #e5e7eb" }}>
            <img src={razorpayQrUrl} alt="Razorpay QR" style={{ width: 120, height: 120 }} />
          </div>
        </div>

        {/* Global - PayPal */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.03)",
            border: `1px solid ${colors.border}`,
            borderRadius: 16,
            padding: 20,
            display: "flex",
            flexDirection: "column",
            alignItems: "center"
          }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 800,
              textTransform: "uppercase",
              padding: "2px 8px",
              background: "#ffc43922",
              color: "#ffc439",
              borderRadius: 100,
              marginBottom: 10
            }}>
            International
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 12px 0" }}>PayPal</h3>
          <button
            onClick={() => window.open("https://www.paypal.com/ncp/payment/4RJMMJD45G5DQ", "_blank")}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: 12,
              border: "none",
              background: "#ffc439",
              color: "#003087",
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
              marginBottom: 16
            }}>
            Pay via PayPal
          </button>
          <div style={{ background: "#ffffff", padding: 10, borderRadius: 12, border: isDark ? "none" : "1px solid #e5e7eb" }}>
            <img src={paypalQrUrl} alt="PayPal QR" style={{ width: 120, height: 120 }} />
          </div>
        </div>
      </div>

      <div style={{ textAlign: "center", padding: "10px 0 20px", opacity: 0.5, fontSize: 11 }}>
        © {new Date().getFullYear()} YouDefineTube by Purva Patel
      </div>
    </div>
  )

  const NavButton = ({
    label,
    onClick,
    isActive,
    showExternalIcon = false
  }: {
    label: string
    onClick: () => void
    isActive?: boolean
    showExternalIcon?: boolean
  }) => (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: "10px 0",
        background: "none",
        border: "none",
        color: isActive ? "#cc0000" : colors.subtext,
        fontSize: 12,
        fontWeight: 600,
        cursor: "pointer",
        transition: "color 0.2s",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}>
      {label}
      {showExternalIcon && <Icons.External />}
    </button>
  )

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
        {/* Header */}
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
                <path d="m15 18-6-6 6-6" />
              </svg>
              Back
            </button>
          )}

          <button
            onClick={() =>
              setSettings({ ...(settings || defaultSettings), theme: isDark ? "light" : "dark" })
            }
            onMouseEnter={() => setIsHoverTheme(true)}
            onMouseLeave={() => setIsHoverTheme(false)}
            style={{
              background: isHoverTheme ? colors.cardBg : "none",
              border: "none",
              padding: 6,
              borderRadius: 8,
              cursor: "pointer",
              color: colors.text,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background 0.2s"
            }}
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}>
            {isDark ? <Icons.Sun /> : <Icons.Moon />}
          </button>
        </div>

        {/* Content Area */}
        <div
          style={{
            flex: 1,
            padding: "8px 10px 20px",
            overflowY: "auto"
          }}>
          {activeView === "main" && renderMainDashboard()}
          {activeView === "support" && renderSupportView()}
          {activeView === "donate" && renderDonateView()}
        </div>

        {/* Footer Navigation */}
        {activeView === "main" && (
          <div
            style={{
              display: "flex",
              borderTop: `1px solid ${colors.border}`,
              background: colors.bg
            }}>
            <NavButton
              label="Support the Dev"
              onClick={() => setActiveView("donate")}
              isActive={activeView === "donate"}
            />
            <NavButton
              label="Request Feature"
              onClick={() => window.open("https://forms.gle/uexgYsXNMYVr8Fs48", "_blank")}
              showExternalIcon
            />
            <NavButton
              label="Report Issue"
              onClick={() => setActiveView("support")}
              isActive={activeView === "support"}
            />
          </div>
        )}
      </div>
    </>
  )
}

export default IndexPopup
