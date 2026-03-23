import { useEffect, useState } from "react"
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
  Youtube: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"
        fill="#FF0000"
      />
      <path d="m9.75 15.02 5.75-3.27-5.75-3.27v6.54z" fill="#fff" />
    </svg>
  ),
  Shorts: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.267 12.73s-.947-3.833 3.018-6.182L14.21 1.473a2.951 2.951 0 0 1 3.906.945h0a2.951 2.951 0 0 1-.945 3.907l-2.022 1.15s3.518-1.554 5.58 1.967c2.063 3.522-.946 7.355-3.018 9.704L8.784 22.227a2.951 2.951 0 0 1-3.907-.945h0a2.951 2.951 0 0 1 .945-3.907l2.022-1.15s-3.518 1.554-5.577-1.967z" />
      <path d="m10 15 5-3-5-3v6z" />
    </svg>
  ),
  Play: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  ),
  Comments: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      <path d="M8 9h8" />
      <path d="M8 13h6" />
    </svg>
  ),
  Chat: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <path d="m3 21 4-4" />
      <path d="M8 9h8" />
      <path d="M8 13h6" />
    </svg>
  ),
  Home: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
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
  )
}

function CustomToggle({ checked, onChange, isDark }: { checked: boolean; onChange: () => void; isDark: boolean }) {
  return (
    <div
      onClick={onChange}
      style={{
        width: 44,
        height: 24,
        borderRadius: 12,
        background: checked ? "#cc0000" : (isDark ? "#3f3f3f" : "#d1d5db"),
        position: "relative",
        cursor: "pointer",
        transition: "background 0.2s"
      }}>
      <div
        style={{
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: "white",
          position: "absolute",
          top: 3,
          left: checked ? 23 : 3,
          transition: "left 0.2s",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)"
        }}>
        {checked && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#cc0000" }} />}
      </div>
    </div>
  )
}

function IndexPopup() {
  const [settings, setSettings] = useStorage<Settings>("settings", defaultSettings)
  const [todayUsage, setTodayUsage] = useStorage<DailyUsage>(
    TIME_TRACKING_TODAY_KEY,
    createEmptyDailyUsage(getLocalDateKey())
  )

  const [inputLimitHours, setInputLimitHours] = useState<number | string>("")
  const [inputLimitMinutes, setInputLimitMinutes] = useState<number | string>("")

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
      // Use setInputLimitHours instead of direct assignment since it's a state setter
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

  return (
    <>
      <style>{`
        body {
          margin: 0;
          padding: 0;
          overflow: hidden;
          background: ${colors.bg};
        }
      `}</style>
      <div
        style={{
          width: 380,
          padding: "16px 20px",
          background: colors.bg,
          color: colors.text,
          fontFamily: "'Inter', system-ui, sans-serif",
          display: "flex",
          flexDirection: "column",
          gap: 12,
          transition: "background 0.3s, color 0.3s"
        }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            paddingBottom: 8,
            borderBottom: `1px solid ${colors.border}`
          }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Icons.Youtube />
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>YouDefineTube</h1>
          </div>

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

        {/* Settings List - Compact */}
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {[
            { key: "hideShorts", label: "Hide Shorts", icon: <Icons.Shorts /> },
            { key: "hideEndScreen", label: "Hide End Screen", icon: <Icons.Play /> },
            { key: "hideComments", label: "Hide Comments", icon: <Icons.Comments /> },
            { key: "hideLiveChat", label: "Hide Live Chat", icon: <Icons.Chat /> },
            {
              key: "hideHomepageRecommendations",
              label: "Hide Homepage Recommendations",
              icon: <Icons.Home />
            },
            { key: "hideSuggestedVideos", label: "Hide Suggested Videos", icon: <Icons.Play /> }
          ].map((item) => (
            <div
              key={item.key}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "6px 4px"
              }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  color: colors.text,
                  fontSize: 14,
                  fontWeight: 500
                }}>
                <div style={{ opacity: 0.8 }}>{item.icon}</div>
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

        {/* Daily Limit Card */}
        <div
          style={{
            background: colors.cardBg,
            borderRadius: 16,
            padding: 14,
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
      </div>
    </>
  )
}

export default IndexPopup
