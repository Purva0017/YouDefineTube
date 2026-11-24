import { useStorage } from "@plasmohq/storage/hook"
import { STORAGE_KEYS } from "~/lib/constants"
import { createEmptyDailyUsage, getLocalDateKey, type DailyUsage } from "~/lib/time-tracking"
import type { ThemeColors } from "~/lib/theme"
import { Icons } from "./Icons"
import { formatDuration } from "~/lib/utils"
import { useSettings } from "~/hooks/useSettings"
import { CustomToggle } from "./CustomToggle"
import { useState } from "react"

export function TimerCard({ colors, isDark }: { colors: ThemeColors; isDark: boolean }) {
  const [todayUsage] = useStorage<DailyUsage>(
    STORAGE_KEYS.TIME_TRACKING_TODAY,
    createEmptyDailyUsage(getLocalDateKey())
  )

  const isCurrentDay = todayUsage?.date === getLocalDateKey()
  const totalMs = isCurrentDay ? todayUsage?.totalYoutubeMs || 0 : 0
  const watchMs = isCurrentDay ? todayUsage?.watchVideoMs || 0 : 0
  const browseMs = isCurrentDay ? todayUsage?.browseMs || 0 : 0
  const searchMs = isCurrentDay ? todayUsage?.searchMs || 0 : 0

  const safeTotal = Math.max(totalMs, 1)
  const watchPercent = totalMs > 0 ? (watchMs / safeTotal) * 100 : 0
  const browsePercent = totalMs > 0 ? (browseMs / safeTotal) * 100 : 0
  const searchPercent = totalMs > 0 ? (searchMs / safeTotal) * 100 : 0

  // High-contrast, harmonious palette:
  // Watch = Vivid Rose/Crimson, Browse = Warm Amber Gold, Search = Electric Cyan
  const palette = {
    watch: {
      color: isDark ? "#f43f5e" : "#e11d48",
      gradient: isDark ? "linear-gradient(90deg, #f43f5e, #fb7185)" : "linear-gradient(90deg, #e11d48, #f43f5e)",
      bg: isDark ? "rgba(244, 63, 94, 0.1)" : "rgba(225, 29, 72, 0.08)"
    },
    browse: {
      color: isDark ? "#f59e0b" : "#d97706",
      gradient: isDark ? "linear-gradient(90deg, #f59e0b, #fbbf24)" : "linear-gradient(90deg, #d97706, #f59e0b)",
      bg: isDark ? "rgba(245, 158, 11, 0.1)" : "rgba(217, 119, 6, 0.08)"
    },
    search: {
      color: isDark ? "#06b6d4" : "#0284c7",
      gradient: isDark ? "linear-gradient(90deg, #06b6d4, #38bdf8)" : "linear-gradient(90deg, #0284c7, #0ea5e9)",
      bg: isDark ? "rgba(6, 182, 212, 0.1)" : "rgba(2, 132, 199, 0.08)"
    }
  }

  const barTrack = isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.07)"

  const segments = [
    { label: "Watch", value: watchMs, percent: watchPercent, ...palette.watch },
    { label: "Browse", value: browseMs, percent: browsePercent, ...palette.browse },
    { label: "Search", value: searchMs, percent: searchPercent, ...palette.search }
  ]

  const activeSegments = segments.filter((s) => s.percent > 0)

  const { settings, setSettings, toggleSetting } = useSettings()
  const enableDailyTimeLimit = !!settings?.enableDailyTimeLimit
  const dailyLimitMinutes = settings?.dailyTimeLimitMinutes ?? 120
  const limitMs = dailyLimitMinutes * 60 * 1000
  const rawPercent = limitMs > 0 ? (totalMs / limitMs) * 100 : 0
  const isOver50 = rawPercent >= 50
  const isOver90 = rawPercent >= 90
  const isOver100 = rawPercent >= 100
  const [isCustomEditing, setIsCustomEditing] = useState(false)
  const [customInputValue, setCustomInputValue] = useState(String(dailyLimitMinutes))

  const handleSetLimit = (mins: number) => {
    const clamped = Math.max(1, Math.min(1440, Math.round(mins)))
    setSettings({ dailyTimeLimitMinutes: clamped })
    setCustomInputValue(String(clamped))
    setIsCustomEditing(false)
  }

  const formatLimitLabel = (mins: number) => {
    if (mins >= 60) {
      const h = Math.floor(mins / 60)
      const m = mins % 60
      return m > 0 ? `${h}h ${m}m` : `${h}h`
    }
    return `${mins}m`
  }

  const PRESETS = [30, 60, 90, 120, 180, 240]

  // Dynamic insight based on browsing habits
  let insightText: string | null = null
  if (totalMs > 10 * 60 * 1000) {
    if (browsePercent >= 45) {
      insightText = `You spent ${Math.round(browsePercent)}% of your time browsing feeds. Consider hiding the home feed to save time.`
    } else if (watchPercent >= 70) {
      insightText = `High focus: ${Math.round(watchPercent)}% of your YouTube time was spent directly watching videos.`
    }
  }

  const limitBarGradient = isOver90
    ? "linear-gradient(90deg, #ef4444, #f43f5e)"
    : isOver50
    ? "linear-gradient(90deg, #f59e0b, #fbbf24)"
    : "linear-gradient(90deg, #10b981, #06b6d4)"

  return (
    <div
      style={{
        background: colors.cardBg,
        borderRadius: 14,
        padding: "20px 20px 18px",
        display: "flex",
        flexDirection: "column",
        gap: 16,
        border: `1px solid ${colors.border}`,
        boxShadow: colors.shadowSm
      }}>
      {/* Top Header: Total time & live status */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 11,
              fontWeight: 700,
              color: colors.muted,
              letterSpacing: "0.06em",
              textTransform: "uppercase"
            }}>
            <Icons.Chart size={13} />
            Time on YouTube Today
          </div>
          <div
            style={{
              fontSize: 34,
              fontWeight: 800,
              marginTop: 6,
              letterSpacing: "-0.03em",
              lineHeight: 1,
              color: colors.text
            }}>
            {formatDuration(totalMs)}
          </div>
          <div style={{ fontSize: 13, color: colors.subtext, marginTop: 6 }}>
            {totalMs > 0 ? "Tracked across active sessions today" : "No YouTube activity recorded yet today"}
          </div>
        </div>

        {/* Live status badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "5px 10px",
            borderRadius: 20,
            background: totalMs > 0
              ? (isDark ? "rgba(239, 68, 68, 0.12)" : "rgba(220, 38, 38, 0.08)")
              : colors.tabBg,
            border: `1px solid ${
              totalMs > 0
                ? (isDark ? "rgba(239, 68, 68, 0.28)" : "rgba(220, 38, 38, 0.22)")
                : colors.border
            }`,
            fontSize: 12,
            fontWeight: 600,
            color: totalMs > 0 ? (isDark ? "#ff5a6e" : "#dc2626") : colors.muted,
            transition: "all 0.2s ease"
          }}>
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: totalMs > 0 ? "#ef4444" : colors.muted,
              boxShadow: totalMs > 0 ? "0 0 8px rgba(239, 68, 68, 0.8)" : "none",
              display: "inline-block"
            }}
          />
          {totalMs > 0 ? "Tracking" : "Idle"}
        </div>
      </div>

      {/* Proportional Segmented Progress Bar */}
      <div>
        <div
          style={{
            height: 9,
            background: barTrack,
            borderRadius: 999,
            display: "flex",
            overflow: "hidden",
            gap: activeSegments.length > 1 ? 2.5 : 0,
            padding: 0
          }}>
          {totalMs > 0 ? (
            activeSegments.map((seg) => (
              <div
                key={seg.label}
                title={`${seg.label}: ${formatDuration(seg.value)} (${Math.round(seg.percent)}%)`}
                style={{
                  width: `${seg.percent}%`,
                  background: seg.gradient,
                  borderRadius: 999,
                  transition: "width 0.4s ease"
                }}
              />
            ))
          ) : (
            <div style={{ width: "100%", height: "100%", background: "transparent" }} />
          )}
        </div>
      </div>

      {/* 3 Metric Cards: Watch, Browse, Search */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
        {segments.map((seg) => (
          <div
            key={seg.label}
            style={{
              padding: "12px 10px",
              borderRadius: 10,
              background: colors.tabBg,
              border: `1px solid ${colors.border}`,
              display: "flex",
              flexDirection: "column",
              gap: 4
            }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, color: colors.subtext }}>
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: seg.color,
                    display: "inline-block",
                    flexShrink: 0
                  }}
                />
                {seg.label}
              </div>
              {totalMs > 0 && (
                <span style={{ fontSize: 11, fontWeight: 600, color: colors.muted }}>
                  {Math.round(seg.percent)}%
                </span>
              )}
            </div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                marginTop: 2,
                letterSpacing: "-0.01em",
                color: colors.text
              }}>
              {formatDuration(seg.value)}
            </div>
          </div>
        ))}
      </div>

      {/* Mindful insight tip if relevant */}
      {insightText && (
        <div
          style={{
            padding: "10px 12px",
            borderRadius: 8,
            background: colors.tabBg,
            border: `1px solid ${colors.border}`,
            fontSize: 12,
            lineHeight: "1.45",
            color: colors.subtext,
            display: "flex",
            alignItems: "flex-start",
            gap: 8
          }}>
          <span style={{ fontSize: 14, flexShrink: 0 }}>💡</span>
          <span>{insightText}</span>
        </div>
      )}

      {/* Divider */}
      <div style={{ height: 1, background: colors.border, margin: "2px 0 0" }} />

      {/* ==================== DAILY TIME LIMIT SECTION ==================== */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {/* Header with toggle */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 15 }}>🎯</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: colors.text, display: "flex", alignItems: "center", gap: 6 }}>
                Daily YouTube Limit
                {enableDailyTimeLimit && (
                  <span
                    style={{
                      fontSize: 10.5,
                      fontWeight: 700,
                      padding: "2px 7px",
                      borderRadius: 12,
                      background: isOver90
                        ? (isDark ? "rgba(239, 68, 68, 0.2)" : "rgba(239, 68, 68, 0.12)")
                        : isOver50
                        ? (isDark ? "rgba(245, 158, 11, 0.2)" : "rgba(245, 158, 11, 0.12)")
                        : (isDark ? "rgba(16, 185, 129, 0.2)" : "rgba(16, 185, 129, 0.12)"),
                      color: isOver90 ? "#ef4444" : isOver50 ? "#f59e0b" : "#10b981",
                      border: `1px solid ${
                        isOver90
                          ? "rgba(239, 68, 68, 0.3)"
                          : isOver50
                          ? "rgba(245, 158, 11, 0.3)"
                          : "rgba(16, 185, 129, 0.3)"
                      }`
                    }}>
                    {formatLimitLabel(dailyLimitMinutes)} limit
                  </span>
                )}
              </div>
              <div style={{ fontSize: 11, color: colors.muted, marginTop: 1 }}>
                Warns at 50% & 90% · Resets at 12:00 AM
              </div>
            </div>
          </div>

          <CustomToggle
            checked={enableDailyTimeLimit}
            onChange={() => toggleSetting("enableDailyTimeLimit")}
            isDark={isDark}
            colors={colors}
            size="small"
          />
        </div>

        {enableDailyTimeLimit && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
              padding: "12px 14px",
              borderRadius: 10,
              background: colors.tabBg,
              border: `1px solid ${colors.border}`
            }}>
            {/* Limit Adjustment Row: Presets & Stepper */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: colors.muted, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Daily Allowance
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <button
                    type="button"
                    onClick={() => handleSetLimit(dailyLimitMinutes - 15)}
                    style={{
                      background: colors.cardBg,
                      border: `1px solid ${colors.border}`,
                      borderRadius: 6,
                      color: colors.text,
                      width: 24,
                      height: 24,
                      cursor: "pointer",
                      fontSize: 13,
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: 0
                    }}
                    title="Decrease by 15 min">
                    -
                  </button>
                  <span style={{ fontSize: 13, fontWeight: 800, color: colors.text, minWidth: 48, textAlign: "center" }}>
                    {formatLimitLabel(dailyLimitMinutes)}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleSetLimit(dailyLimitMinutes + 15)}
                    style={{
                      background: colors.cardBg,
                      border: `1px solid ${colors.border}`,
                      borderRadius: 6,
                      color: colors.text,
                      width: 24,
                      height: 24,
                      cursor: "pointer",
                      fontSize: 13,
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: 0
                    }}
                    title="Increase by 15 min">
                    +
                  </button>
                </div>
              </div>

              {/* Preset Chips */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {PRESETS.map((mins) => {
                  const isSelected = dailyLimitMinutes === mins
                  return (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => handleSetLimit(mins)}
                      style={{
                        padding: "3px 9px",
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: isSelected ? 700 : 500,
                        background: isSelected ? colors.accent : colors.cardBg,
                        color: isSelected ? "#ffffff" : colors.text,
                        border: `1px solid ${isSelected ? colors.accent : colors.border}`,
                        cursor: "pointer",
                        transition: "all 0.15s ease"
                      }}>
                      {formatLimitLabel(mins)}
                    </button>
                  )
                })}
                <button
                  type="button"
                  onClick={() => setIsCustomEditing(!isCustomEditing)}
                  style={{
                    padding: "3px 9px",
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: isCustomEditing ? 700 : 500,
                    background: isCustomEditing ? colors.accent : colors.cardBg,
                    color: isCustomEditing ? "#ffffff" : colors.muted,
                    border: `1px solid ${isCustomEditing ? colors.accent : colors.border}`,
                    cursor: "pointer"
                  }}>
                  Custom
                </button>
              </div>

              {/* Custom Minutes Input if toggled */}
              {isCustomEditing && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                  <input
                    type="number"
                    min={1}
                    max={1440}
                    value={customInputValue}
                    onChange={(e) => setCustomInputValue(e.target.value)}
                    placeholder="Minutes"
                    style={{
                      flex: 1,
                      padding: "5px 8px",
                      borderRadius: 6,
                      background: colors.cardBg,
                      border: `1px solid ${colors.border}`,
                      color: colors.text,
                      fontSize: 12,
                      outline: "none"
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const parsed = parseInt(customInputValue, 10)
                      if (!isNaN(parsed) && parsed > 0) {
                        handleSetLimit(parsed)
                      }
                    }}
                    style={{
                      padding: "5px 12px",
                      borderRadius: 6,
                      background: colors.accent,
                      border: "none",
                      color: "#ffffff",
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: "pointer"
                    }}>
                    Save
                  </button>
                </div>
              )}
            </div>

            {/* Progress vs Limit with Threshold Markers */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: colors.text }}>
                  {formatDuration(totalMs)}{" "}
                  <span style={{ fontSize: 11, fontWeight: 400, color: colors.muted }}>
                    / {formatDuration(limitMs)} used
                  </span>
                </span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    color: isOver90 ? "#ef4444" : isOver50 ? "#f59e0b" : colors.text
                  }}>
                  {Math.round(rawPercent)}%
                </span>
              </div>

              {/* Progress bar container with 50% and 90% notches */}
              <div style={{ position: "relative", width: "100%", paddingTop: 4, paddingBottom: 16 }}>
                <div
                  style={{
                    height: 8,
                    background: barTrack,
                    borderRadius: 999,
                    position: "relative",
                    overflow: "hidden"
                  }}>
                  <div
                    style={{
                      width: `${Math.min(100, Math.max(0, rawPercent))}%`,
                      height: "100%",
                      background: limitBarGradient,
                      borderRadius: 999,
                      transition: "width 0.4s ease, background 0.3s ease"
                    }}
                  />
                </div>

                {/* 50% Threshold marker */}
                <div
                  style={{
                    position: "absolute",
                    left: "50%",
                    top: 2,
                    transform: "translateX(-50%)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    pointerEvents: "none"
                  }}>
                  <div
                    style={{
                      width: 2,
                      height: 12,
                      background: isOver50 ? "#f59e0b" : colors.muted,
                      borderRadius: 1
                    }}
                  />
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      color: isOver50 ? "#f59e0b" : colors.muted,
                      marginTop: 2
                    }}>
                    50%
                  </span>
                </div>

                {/* 90% Threshold marker */}
                <div
                  style={{
                    position: "absolute",
                    left: "90%",
                    top: 2,
                    transform: "translateX(-50%)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    pointerEvents: "none"
                  }}>
                  <div
                    style={{
                      width: 2,
                      height: 12,
                      background: isOver90 ? "#ef4444" : colors.muted,
                      borderRadius: 1
                    }}
                  />
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      color: isOver90 ? "#ef4444" : colors.muted,
                      marginTop: 2
                    }}>
                    90%
                  </span>
                </div>
              </div>
            </div>

            {/* Warning status alerts */}
            {isOver100 ? (
              <div
                style={{
                  padding: "9px 12px",
                  borderRadius: 8,
                  background: isDark ? "rgba(220, 38, 38, 0.2)" : "rgba(220, 38, 38, 0.12)",
                  border: `1px solid ${isDark ? "rgba(220, 38, 38, 0.5)" : "rgba(220, 38, 38, 0.35)"}`,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 12,
                  color: isDark ? "#ff6b7e" : "#dc2626"
                }}>
                <span style={{ fontSize: 16 }}>🛑</span>
                <div>
                  <div style={{ fontWeight: 800 }}>Daily Limit Reached (Hard Block Active)</div>
                  <div style={{ fontSize: 11, opacity: 0.9, marginTop: 1 }}>
                    YouTube is blocked for today. Resets automatically at 12:00 AM.
                  </div>
                </div>
              </div>
            ) : isOver90 ? (
              <div
                style={{
                  padding: "9px 12px",
                  borderRadius: 8,
                  background: isDark ? "rgba(239, 68, 68, 0.12)" : "rgba(239, 68, 68, 0.08)",
                  border: `1px solid ${isDark ? "rgba(239, 68, 68, 0.35)" : "rgba(239, 68, 68, 0.25)"}`,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 12,
                  color: isDark ? "#ff6b7e" : "#dc2626"
                }}>
                <span style={{ fontSize: 14 }}>🚨</span>
                <div>
                  <div style={{ fontWeight: 700 }}>90% Limit Reached (2nd Warning Triggered)</div>
                  <div style={{ fontSize: 11, opacity: 0.9, marginTop: 1 }}>
                    Only {Math.max(0, dailyLimitMinutes - Math.round(totalMs / 60000))} min remaining today.
                  </div>
                </div>
              </div>
            ) : isOver50 ? (
              <div
                style={{
                  padding: "9px 12px",
                  borderRadius: 8,
                  background: isDark ? "rgba(245, 158, 11, 0.12)" : "rgba(245, 158, 11, 0.08)",
                  border: `1px solid ${isDark ? "rgba(245, 158, 11, 0.35)" : "rgba(245, 158, 11, 0.25)"}`,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 12,
                  color: isDark ? "#fbbf24" : "#d97706"
                }}>
                <span style={{ fontSize: 14 }}>⏳</span>
                <div>
                  <div style={{ fontWeight: 700 }}>50% Limit Reached (1st Warning Triggered)</div>
                  <div style={{ fontSize: 11, opacity: 0.9, marginTop: 1 }}>
                    Half of your daily limit used ({formatDuration(totalMs)}).
                  </div>
                </div>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: 11.5,
                  color: colors.subtext,
                  padding: "2px 2px"
                }}>
                <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ color: "#10b981", fontWeight: 700 }}>✓</span>
                  <span>{formatDuration(Math.max(0, limitMs - totalMs))} remaining today</span>
                </span>
                <span style={{ fontSize: 11, color: colors.muted }}>
                  Warnings at 50% & 90%
                </span>
              </div>
            )}

            {/* Timezone & Midnight Reset Notice */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                fontSize: 11,
                color: colors.muted,
                paddingTop: 2,
                borderTop: `1px dashed ${colors.border}`
              }}>
              <span style={{ fontSize: 12 }}>⏱️</span>
              <span>
                Resets daily at 12:00 AM ({Intl.DateTimeFormat().resolvedOptions().timeZone || "local time"})
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
