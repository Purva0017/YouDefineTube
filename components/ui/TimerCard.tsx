import { useStorage } from "@plasmohq/storage/hook"
import { STORAGE_KEYS } from "~/lib/constants"
import { createEmptyDailyUsage, getLocalDateKey, type DailyUsage } from "~/lib/time-tracking"
import { defaultSettings, type Settings } from "~/lib/settings"
import type { ThemeColors } from "~/lib/theme"
import { Icons } from "./Icons"
import { formatDuration, formatMinutes } from "~/lib/utils"

export function TimerCard({ colors, isDark }: { colors: ThemeColors; isDark: boolean }) {
  const [settings] = useStorage<Settings>("settings", defaultSettings)
  const [todayUsage] = useStorage<DailyUsage>(
    STORAGE_KEYS.TIME_TRACKING_TODAY,
    createEmptyDailyUsage(getLocalDateKey())
  )

  const limitMinutes = settings?.dailyLimitMinutes || defaultSettings.dailyLimitMinutes
  const limitReached = !!todayUsage?.dailyLimitReachedAt
  const totalMs = todayUsage?.totalYoutubeMs || 0
  const limitMs = limitMinutes * 60000
  const usagePercent = Math.min(100, (totalMs / limitMs) * 100)

  const watchPercent = ((todayUsage?.watchVideoMs || 0) / limitMs) * 100
  const browsePercent = ((todayUsage?.browseMs || 0) / limitMs) * 100
  const searchPercent = ((todayUsage?.searchMs || 0) / limitMs) * 100

  const segments = [
    { label: "Watch", value: todayUsage?.watchVideoMs || 0, percent: watchPercent, color: colors.accent },
    { label: "Browse", value: todayUsage?.browseMs || 0, percent: browsePercent, color: isDark ? "#ff6b6b" : "#f43f5e" },
    { label: "Search", value: todayUsage?.searchMs || 0, percent: searchPercent, color: isDark ? "#71717a" : "#94a3b8" }
  ]

  return (
    <div
      style={{
        background: colors.cardBg,
        borderRadius: 16,
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 14,
        border: `1px solid ${colors.border}`,
        boxShadow: isDark ? "inset 0 1px 0 rgba(255,255,255,0.04)" : "0 1px 2px rgba(0,0,0,0.04)"
      }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: colors.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Today on YouTube
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 4, letterSpacing: "-0.03em" }}>
            {formatDuration(totalMs)}
          </div>
          <div style={{ fontSize: 12, color: colors.subtext, marginTop: 2 }}>
            of {formatMinutes(limitMinutes)} daily limit
          </div>
        </div>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: `conic-gradient(${colors.accent} ${usagePercent}%, ${isDark ? "#2a2a35" : "#e5e7eb"} 0)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0
          }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: colors.cardBg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 11,
              fontWeight: 800,
              color: colors.text
            }}>
            {Math.round(usagePercent)}%
          </div>
        </div>
      </div>

      {limitReached && (
        <div
          style={{
            background: colors.dangerSoft,
            color: colors.danger,
            padding: "8px 12px",
            borderRadius: 10,
            fontSize: 12,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: 6
          }}>
          <Icons.Warning /> Daily limit reached
        </div>
      )}

      <div
        style={{
          height: 8,
          background: isDark ? "#22222c" : "#eef2f7",
          borderRadius: 99,
          display: "flex",
          overflow: "hidden"
        }}>
        {segments.map((seg) => (
          <div
            key={seg.label}
            style={{
              width: `${seg.percent}%`,
              background: seg.color,
              transition: "width 0.3s ease"
            }}
          />
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
        {segments.map((seg) => (
          <div
            key={seg.label}
            style={{
              padding: "10px 8px",
              borderRadius: 12,
              background: colors.tabBg,
              border: `1px solid ${colors.border}`
            }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: colors.muted }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: seg.color, display: "inline-block" }} />
              {seg.label}
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, marginTop: 4 }}>{formatDuration(seg.value)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
