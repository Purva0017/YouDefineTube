import { useState } from "react"
import { useStorage } from "@plasmohq/storage/hook"
import { STORAGE_KEYS } from "~/lib/constants"
import {
  createEmptyDailyUsage,
  getLocalDateKey,
  type DailyUsage
} from "~/lib/time-tracking"
import type { ThemeColors } from "~/lib/theme"
import { Icons } from "./Icons"
import { formatDuration } from "~/lib/utils"

type UsageHistory = Record<string, DailyUsage>

export function WeeklyActivityCard({
  colors,
  isDark
}: {
  colors: ThemeColors
  isDark: boolean
}) {
  const [history] = useStorage<UsageHistory>(STORAGE_KEYS.TIME_TRACKING_HISTORY, {})
  const [todayUsage] = useStorage<DailyUsage>(
    STORAGE_KEYS.TIME_TRACKING_TODAY,
    createEmptyDailyUsage(getLocalDateKey())
  )

  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  // Generate the last 7 days ending with today
  const todayKey = getLocalDateKey()
  const days = []

  for (let i = 6; i >= 0; i--) {
    const timestamp = Date.now() - i * 24 * 60 * 60 * 1000
    const key = getLocalDateKey(timestamp)
    const dateObj = new Date(timestamp)
    const isToday = i === 0

    const usage: DailyUsage = isToday
      ? todayUsage || history?.[todayKey] || createEmptyDailyUsage(todayKey)
      : history?.[key] || createEmptyDailyUsage(key)

    const shortDay = isToday
      ? "Today"
      : dateObj.toLocaleDateString("en-US", { weekday: "short" })

    const fullDate = isToday
      ? "Today"
      : dateObj.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })

    days.push({
      dateKey: key,
      shortDay,
      fullDate,
      isToday,
      totalMs: usage.totalYoutubeMs || 0,
      watchMs: usage.watchVideoMs || 0,
      browseMs: usage.browseMs || 0,
      searchMs: usage.searchMs || 0
    })
  }

  const weeklyTotalMs = days.reduce((sum, d) => sum + d.totalMs, 0)
  const activeDaysCount = days.filter((d) => d.totalMs > 0).length
  const dailyAvgMs = activeDaysCount > 0 ? Math.round(weeklyTotalMs / activeDaysCount) : 0

  // Minimum 1 hour scale ceiling so bars are proportional
  const maxDayMs = Math.max(...days.map((d) => d.totalMs), 60 * 60 * 1000)

  // Color tokens matching TimerCard
  const watchColor = isDark ? "#f43f5e" : "#e11d48"
  const browseColor = isDark ? "#f59e0b" : "#d97706"
  const searchColor = isDark ? "#06b6d4" : "#0284c7"
  const emptyBarColor = isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)"

  const activeIndex = hoveredIdx !== null ? hoveredIdx : 6 // Default to Today (index 6)
  const inspectedDay = days[activeIndex]

  return (
    <div
      style={{
        background: colors.cardBg,
        borderRadius: 14,
        padding: "18px 20px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 14,
        border: `1px solid ${colors.border}`,
        boxShadow: colors.shadowSm
      }}>
      {/* Header with Title and Daily Average */}
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
            7-Day Activity
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 800,
              marginTop: 4,
              letterSpacing: "-0.02em",
              color: colors.text
            }}>
            {formatDuration(weeklyTotalMs)}
            <span style={{ fontSize: 13, fontWeight: 500, color: colors.subtext, marginLeft: 6 }}>
              total this week
            </span>
          </div>
        </div>

        <div
          style={{
            padding: "5px 10px",
            borderRadius: 8,
            background: colors.tabBg,
            border: `1px solid ${colors.border}`,
            fontSize: 11,
            fontWeight: 600,
            color: colors.subtext
          }}>
          Avg: <span style={{ color: colors.text, fontWeight: 700 }}>{formatDuration(dailyAvgMs)}</span>/day
        </div>
      </div>

      {/* 7-Bar Chart Container */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          height: 100,
          paddingTop: 10,
          paddingBottom: 4,
          gap: 6
        }}>
        {days.map((day, idx) => {
          const isSelected = idx === activeIndex
          const barHeightPx =
            day.totalMs > 0
              ? Math.max(8, Math.round((day.totalMs / maxDayMs) * 78))
              : 4

          const watchPct = day.totalMs > 0 ? (day.watchMs / day.totalMs) * 100 : 0
          const browsePct = day.totalMs > 0 ? (day.browseMs / day.totalMs) * 100 : 0
          const searchPct = day.totalMs > 0 ? (day.searchMs / day.totalMs) * 100 : 0

          return (
            <div
              key={day.dateKey}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              onClick={() => setHoveredIdx(idx)}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-end",
                height: "100%",
                cursor: "pointer",
                padding: "0 2px"
              }}>
              {/* Vertical Stacked Bar */}
              <div
                style={{
                  width: 20,
                  height: barHeightPx,
                  borderRadius: 6,
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column-reverse",
                  background: day.totalMs > 0 ? "transparent" : emptyBarColor,
                  transition: "all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)",
                  transform: isSelected ? "scaleY(1.05) scaleX(1.08)" : "none",
                  boxShadow: isSelected
                    ? `0 0 10px ${isDark ? "rgba(244, 63, 94, 0.35)" : "rgba(225, 29, 72, 0.25)"}`
                    : "none",
                  outline: isSelected ? `1.5px solid ${colors.text}` : "none",
                  outlineOffset: 1
                }}>
                {day.totalMs > 0 ? (
                  <>
                    <div
                      style={{
                        height: `${watchPct}%`,
                        background: watchColor,
                        minHeight: day.watchMs > 0 ? 2 : 0,
                        transition: "height 0.3s ease"
                      }}
                    />
                    <div
                      style={{
                        height: `${browsePct}%`,
                        background: browseColor,
                        minHeight: day.browseMs > 0 ? 2 : 0,
                        transition: "height 0.3s ease"
                      }}
                    />
                    <div
                      style={{
                        height: `${searchPct}%`,
                        background: searchColor,
                        minHeight: day.searchMs > 0 ? 2 : 0,
                        transition: "height 0.3s ease"
                      }}
                    />
                  </>
                ) : null}
              </div>

              {/* Day Label */}
              <div
                style={{
                  fontSize: 10.5,
                  fontWeight: day.isToday || isSelected ? 700 : 500,
                  color: day.isToday
                    ? colors.accent
                    : isSelected
                      ? colors.text
                      : colors.muted,
                  marginTop: 8,
                  letterSpacing: "0.01em",
                  userSelect: "none"
                }}>
                {day.shortDay}
              </div>
            </div>
          )
        })}
      </div>

      {/* Interactive Day Inspector Banner */}
      <div
        style={{
          padding: "10px 12px",
          borderRadius: 10,
          background: colors.tabBg,
          border: `1px solid ${colors.border}`,
          display: "flex",
          flexDirection: "column",
          gap: 6
        }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: colors.text }}>
            {inspectedDay.fullDate}
          </div>
          <div style={{ fontSize: 13, fontWeight: 800, color: colors.text }}>
            {formatDuration(inspectedDay.totalMs)}
          </div>
        </div>

        {inspectedDay.totalMs > 0 ? (
          <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 11, color: colors.subtext }}>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: watchColor }} />
              Watch: {formatDuration(inspectedDay.watchMs)}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: browseColor }} />
              Browse: {formatDuration(inspectedDay.browseMs)}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: searchColor }} />
              Search: {formatDuration(inspectedDay.searchMs)}
            </span>
          </div>
        ) : (
          <div style={{ fontSize: 11, color: colors.muted }}>
            No YouTube activity recorded on this day.
          </div>
        )}
      </div>

      {/* Legend */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 16,
          paddingTop: 2,
          fontSize: 11,
          fontWeight: 600,
          color: colors.muted
        }}>
        <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: watchColor }} />
          Watch
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: browseColor }} />
          Browse
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: searchColor }} />
          Search
        </span>
      </div>
    </div>
  )
}
