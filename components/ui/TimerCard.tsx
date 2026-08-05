import { useStorage } from "@plasmohq/storage/hook"
import { STORAGE_KEYS } from "~/lib/constants"
import { createEmptyDailyUsage, getLocalDateKey, type DailyUsage } from "~/lib/time-tracking"
import { defaultSettings, type Settings } from "~/lib/settings"
import { Icons } from "./Icons"
import { formatDuration, formatMinutes } from "~/lib/utils"

export function TimerCard({ colors, isDark }: { colors: any; isDark: boolean }) {
  const [settings] = useStorage<Settings>("settings", defaultSettings)
  const [todayUsage] = useStorage<DailyUsage>(
    STORAGE_KEYS.TIME_TRACKING_TODAY,
    createEmptyDailyUsage(getLocalDateKey())
  )

  const limitMinutes = settings?.dailyLimitMinutes || defaultSettings.dailyLimitMinutes
  const limitReached = !!todayUsage?.dailyLimitReachedAt

  const limitMs = limitMinutes * 60000
  const watchPercent = ((todayUsage?.watchVideoMs || 0) / limitMs) * 100
  const browsePercent = ((todayUsage?.browseMs || 0) / limitMs) * 100
  const searchPercent = ((todayUsage?.searchMs || 0) / limitMs) * 100

  return (
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
        overflow: "hidden",
        flexShrink: 0
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

      <div
        style={{
          height: 40,
          background: isDark ? "#333" : "#e5e7eb",
          borderRadius: 10,
          display: "flex",
          overflow: "hidden"
        }}>
        <div style={{ width: `${watchPercent}%`, background: "#cc0000", transition: "width 0.3s" }} />
        <div style={{ width: `${browsePercent}%`, background: isDark ? "#ff4d4d" : "#ef4444", transition: "width 0.3s" }} />
        <div style={{ width: `${searchPercent}%`, background: isDark ? "#666" : "#9ca3af", transition: "width 0.3s" }} />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, color: colors.subtext }}>
            <Icons.Video /> Watch
          </div>
          <div style={{ fontSize: 13, fontWeight: 700 }}>{formatDuration(todayUsage?.watchVideoMs || 0)}</div>
        </div>
        <div style={{ width: 1, background: colors.border }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, color: colors.subtext }}>
            <Icons.Monitor /> Browse
          </div>
          <div style={{ fontSize: 13, fontWeight: 700 }}>{formatDuration(todayUsage?.browseMs || 0)}</div>
        </div>
        <div style={{ width: 1, background: colors.border }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, color: colors.subtext }}>
            <Icons.Search /> Search
          </div>
          <div style={{ fontSize: 13, fontWeight: 700 }}>{formatDuration(todayUsage?.searchMs || 0)}</div>
        </div>
      </div>
    </div>
  )
}
