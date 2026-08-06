import { useState, useEffect, useRef } from "react"
import { useStorage } from "@plasmohq/storage/hook"
import { useSettings } from "~/hooks/useSettings"
import { STORAGE_KEYS } from "~/lib/constants"
import { createEmptyDailyUsage, getLocalDateKey, type DailyUsage } from "~/lib/time-tracking"
import { defaultSettings } from "~/lib/settings"
import type { ThemeColors } from "~/lib/theme"
import { Icons } from "./Icons"

interface SpinnerButtonsProps {
  onIncrement: () => void
  onDecrement: () => void
  startRepeat: (action: () => void) => void
  stopRepeat: () => void
  borderColor: string
  colors: ThemeColors
}

function SpinnerButtons({
  onIncrement,
  onDecrement,
  startRepeat,
  stopRepeat,
  borderColor,
  colors
}: SpinnerButtonsProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", borderLeft: `1px solid ${borderColor}`, padding: "0 2px" }}>
      <button
        type="button"
        onMouseDown={() => startRepeat(onIncrement)}
        onMouseUp={stopRepeat}
        onMouseLeave={stopRepeat}
        onTouchStart={() => startRepeat(onIncrement)}
        onTouchEnd={stopRepeat}
        className="spinner-btn"
        style={{ padding: "3px 6px", color: colors.subtext }}
      >
        <Icons.ChevronUp size={10} />
      </button>
      <button
        type="button"
        onMouseDown={() => startRepeat(onDecrement)}
        onMouseUp={stopRepeat}
        onMouseLeave={stopRepeat}
        onTouchStart={() => startRepeat(onDecrement)}
        onTouchEnd={stopRepeat}
        className="spinner-btn"
        style={{ padding: "3px 6px", color: colors.subtext }}
      >
        <Icons.ChevronDown size={10} />
      </button>
    </div>
  )
}

export function DailyLimitCard({ colors, isDark }: { colors: ThemeColors; isDark: boolean }) {
  const { settings, setSettings, toggleSetting } = useSettings()
  const [todayUsage, setTodayUsage] = useStorage<DailyUsage>(
    STORAGE_KEYS.TIME_TRACKING_TODAY,
    createEmptyDailyUsage(getLocalDateKey())
  )

  const [inputLimitHours, setInputLimitHours] = useState<number | string>("")
  const [inputLimitMinutes, setInputLimitMinutes] = useState<number | string>("")

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const startRepeat = (action: () => void) => {
    action()
    timeoutRef.current = setTimeout(() => {
      intervalRef.current = setInterval(action, 100)
    }, 400)
  }

  const stopRepeat = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    if (intervalRef.current) clearInterval(intervalRef.current)
  }

  useEffect(() => {
    const totalMinutes = settings?.dailyLimitMinutes ?? defaultSettings.dailyLimitMinutes
    setInputLimitHours(Math.floor(totalMinutes / 60))
    setInputLimitMinutes(totalMinutes % 60)
  }, [settings?.dailyLimitMinutes])

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

  const inputWrapStyle = {
    display: "flex",
    alignItems: "center",
    background: colors.inputBg,
    border: `1px solid ${colors.inputBorder}`,
    borderRadius: 12,
    padding: "2px 2px 2px 10px",
    flex: 1
  } as const

  return (
    <div
      style={{
        background: colors.cardBg,
        borderRadius: 16,
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 14,
        border: `1px solid ${colors.border}`
      }}>
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: colors.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Daily Limit
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, marginTop: 4 }}>Set your YouTube budget</div>
      </div>

      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          cursor: "pointer",
          padding: "10px 12px",
          borderRadius: 12,
          background: colors.tabBg,
          border: `1px solid ${colors.border}`
        }}>
        <div
          onClick={() => toggleSetting("enableDailyLimitAlert")}
          style={{
            width: 20,
            height: 20,
            borderRadius: 6,
            background: settings?.enableDailyLimitAlert ? colors.accent : colors.inputBg,
            border: `2px solid ${settings?.enableDailyLimitAlert ? colors.accent : colors.inputBorder}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s",
            flexShrink: 0
          }}>
          {settings?.enableDailyLimitAlert && <Icons.Check color="white" size={12} />}
        </div>
        <span style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>
          Show alert when limit is reached
        </span>
      </label>

      <style>{`
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        input[type="number"] { -moz-appearance: textfield; }
        .spinner-btn {
          background: transparent;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0.6;
          border-radius: 6px;
          transition: opacity 0.15s, background 0.15s;
        }
        .spinner-btn:hover { opacity: 1; background: ${colors.tabBg}; }
      `}</style>

      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <div style={inputWrapStyle}>
          <input
            type="number"
            value={inputLimitHours}
            onChange={(e) => {
              const val = e.target.value
              if (val === "") { setInputLimitHours(""); return }
              const num = parseInt(val, 10)
              if (!isNaN(num)) setInputLimitHours(Math.min(23, Math.max(0, num)))
            }}
            style={{ width: "100%", minWidth: 24, border: "none", outline: "none", fontSize: 15, fontWeight: 700, textAlign: "center", background: "transparent", color: colors.text }}
          />
          <span style={{ fontSize: 12, color: colors.muted, marginRight: 4, userSelect: "none" }}>h</span>
          <SpinnerButtons
            onIncrement={() => setInputLimitHours((prev) => Math.min(23, (Number(prev) || 0) + 1))}
            onDecrement={() => setInputLimitHours((prev) => Math.max(0, (Number(prev) || 0) - 1))}
            startRepeat={startRepeat}
            stopRepeat={stopRepeat}
            borderColor={colors.inputBorder}
            colors={colors}
          />
        </div>
        <div style={inputWrapStyle}>
          <input
            type="number"
            value={inputLimitMinutes}
            onChange={(e) => {
              const val = e.target.value
              if (val === "") { setInputLimitMinutes(""); return }
              const num = parseInt(val, 10)
              if (!isNaN(num)) setInputLimitMinutes(Math.min(59, Math.max(0, num)))
            }}
            style={{ width: "100%", minWidth: 24, border: "none", outline: "none", fontSize: 15, fontWeight: 700, textAlign: "center", background: "transparent", color: colors.text }}
          />
          <span style={{ fontSize: 12, color: colors.muted, marginRight: 4, userSelect: "none" }}>m</span>
          <SpinnerButtons
            onIncrement={() => setInputLimitMinutes((prev) => Math.min(59, (Number(prev) || 0) + 1))}
            onDecrement={() => setInputLimitMinutes((prev) => Math.max(0, (Number(prev) || 0) - 1))}
            startRepeat={startRepeat}
            stopRepeat={stopRepeat}
            borderColor={colors.inputBorder}
            colors={colors}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={onUpdateLimit}
        style={{
          width: "100%",
          padding: "12px 0",
          background: colors.accentGradient,
          color: "#fff",
          border: "none",
          borderRadius: 12,
          fontSize: 13,
          fontWeight: 700,
          cursor: "pointer",
          boxShadow: `0 8px 20px ${colors.accentSoft}`
        }}>
        Save daily limit
      </button>
    </div>
  )
}
