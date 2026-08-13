import { useStorage } from "@plasmohq/storage/hook"
import { STORAGE_KEYS } from "~/lib/constants"
import { createEmptyDailyUsage, getEffectiveDailyLimitMinutes, getLocalDateKey, type DailyUsage } from "~/lib/time-tracking"
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

  const baseLimitMinutes = settings?.dailyLimitMinutes || defaultSettings.dailyLimitMinutes
  const extensionsUsed = todayUsage?.extensionsUsed || 0
  const limitMinutes = getEffectiveDailyLimitMinutes(baseLimitMinutes, extensionsUsed)
  const limitReached = !!todayUsage?.dailyLimitReachedAt
  const totalMs = todayUsage?.totalYoutubeMs || 0
  const limitMs = limitMinutes * 60000
  const usagePercent = limitMs > 0 ? Math.min(100, (totalMs / limitMs) * 100) : 0

  const watchPercent = limitMs > 0 ? ((todayUsage?.watchVideoMs || 0) / limitMs) * 100 : 0
  const browsePercent = limitMs > 0 ? ((todayUsage?.browseMs || 0) / limitMs) * 100 : 0
  const searchPercent = limitMs > 0 ? ((todayUsage?.searchMs || 0) / limitMs) * 100 : 0

  const segments = [
    { label: "Watch", value: todayUsage?.watchVideoMs || 0, percent: watchPercent, color: colors.accent },
    { label: "Browse", value: todayUsage?.browseMs || 0, percent: browsePercent, color: isDark ? "#e87878" : "#d94848" },
    { label: "Search", value: todayUsage?.searchMs || 0, percent: searchPercent, color: colors.muted }
  ]

  const ringTrack = isDark ? "#2e2a26" : "#eee9e3"

  return (
    <div
      style={{
        background: colors.cardBg,
        borderRadius: 12,
        padding: 20,
        display: "flex",
        flexDirection: "column",
        gap: 16,
        border: `1px solid ${colors.border}`,
        boxShadow: colors.shadowSm
      }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: colors.muted, letterSpacing: "0.04em" }}>
            Today on YouTube
          </div>
          <div style={{ fontSize: 32, fontWeight: 700, marginTop: 6, letterSpacing: "-0.03em", lineHeight: 1 }}>
            {formatDuration(totalMs)}
          </div>
          <div style={{ fontSize: 13, color: colors.subtext, marginTop: 6 }}>
            of {formatMinutes(limitMinutes)} daily limit
            {extensionsUsed > 0 ? ` (+${extensionsUsed * 5}m extended)` : ""}
          </div>
        </div>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: `conic-gradient(${colors.accent} ${usagePercent}%, ${ringTrack} 0)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0
          }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: "50%",
              background: colors.cardBg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontWeight: 700,
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
            padding: "10px 12px",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 8
          }}>
          <Icons.Warning /> Daily limit reached
        </div>
      )}

      <div
        style={{
          height: 6,
          background: ringTrack,
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
              borderRadius: 8,
              background: colors.tabBg,
              border: `1px solid ${colors.border}`
            }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 500, color: colors.muted }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: seg.color, display: "inline-block" }} />
              {seg.label}
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, marginTop: 4, letterSpacing: "-0.01em" }}>
              {formatDuration(seg.value)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
