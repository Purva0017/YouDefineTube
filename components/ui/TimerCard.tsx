import { useStorage } from "@plasmohq/storage/hook"
import { STORAGE_KEYS } from "~/lib/constants"
import { createEmptyDailyUsage, getLocalDateKey, type DailyUsage } from "~/lib/time-tracking"
import type { ThemeColors } from "~/lib/theme"
import { Icons } from "./Icons"
import { formatDuration } from "~/lib/utils"

export function TimerCard({ colors, isDark }: { colors: ThemeColors; isDark: boolean }) {
  const [todayUsage] = useStorage<DailyUsage>(
    STORAGE_KEYS.TIME_TRACKING_TODAY,
    createEmptyDailyUsage(getLocalDateKey())
  )

  const totalMs = todayUsage?.totalYoutubeMs || 0
  const watchMs = todayUsage?.watchVideoMs || 0
  const browseMs = todayUsage?.browseMs || 0
  const searchMs = todayUsage?.searchMs || 0

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

  // Dynamic insight based on browsing habits
  let insightText: string | null = null
  if (totalMs > 10 * 60 * 1000) {
    if (browsePercent >= 45) {
      insightText = `You spent ${Math.round(browsePercent)}% of your time browsing feeds. Consider hiding the home feed to save time.`
    } else if (watchPercent >= 70) {
      insightText = `High focus: ${Math.round(watchPercent)}% of your YouTube time was spent directly watching videos.`
    }
  }

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
    </div>
  )
}
