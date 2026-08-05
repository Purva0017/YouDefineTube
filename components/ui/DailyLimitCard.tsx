import { useState, useEffect, useRef } from "react"
import { useStorage } from "@plasmohq/storage/hook"
import { useSettings } from "~/hooks/useSettings"
import { STORAGE_KEYS } from "~/lib/constants"
import { createEmptyDailyUsage, getLocalDateKey, type DailyUsage } from "~/lib/time-tracking"
import { defaultSettings, type Settings } from "~/lib/settings"
import { Icons } from "./Icons"

interface SpinnerButtonsProps {
  onIncrement: () => void
  onDecrement: () => void
  startRepeat: (action: () => void) => void
  stopRepeat: () => void
  borderColor: string
}

function SpinnerButtons({
  onIncrement,
  onDecrement,
  startRepeat,
  stopRepeat,
  borderColor
}: SpinnerButtonsProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        borderLeft: `1px solid ${borderColor}`,
        paddingLeft: 2,
        paddingRight: 2
      }}>
      <button
        onMouseDown={() => startRepeat(onIncrement)}
        onMouseUp={stopRepeat} // triggered when the mouse is up after click
        onMouseLeave={stopRepeat} // triggered when the cursor moves from inside the button to outside the button

        // onTouchStart and onTouchEnd are mobile-specific touch events that handle interactions on touchscreen devices (like smartphones, tablets, or touchscreen laptops).
        onTouchStart={() => startRepeat(onIncrement)}
        onTouchEnd={stopRepeat}
        className="spinner-btn"
        style={{ padding: "2px 4px" }}
      >
        <Icons.ChevronUp size={10} />
      </button>
      <button
        onMouseDown={() => startRepeat(onDecrement)}
        onMouseUp={stopRepeat}
        onMouseLeave={stopRepeat}
        onTouchStart={() => startRepeat(onDecrement)}
        onTouchEnd={stopRepeat}
        className="spinner-btn"
        style={{ padding: "2px 4px" }}
      >
        <Icons.ChevronDown size={10} />
      </button>
    </div>
  )
}

export function DailyLimitCard({ colors, isDark }: { colors: any; isDark: boolean }) {
  const { settings, setSettings, toggleSetting } = useSettings()
  const [todayUsage, setTodayUsage] = useStorage<DailyUsage>(
    STORAGE_KEYS.TIME_TRACKING_TODAY,
    createEmptyDailyUsage(getLocalDateKey())
  ) // storing the jsons 

  const [inputLimitHours, setInputLimitHours] = useState<number | string>("")
  const [inputLimitMinutes, setInputLimitMinutes] = useState<number | string>("")

  const intervalRef = useRef<any>(null)
  const timeoutRef = useRef<any>(null)

  // startRepeat is called once onMouseDown (the mouse is down on the button)
  const startRepeat = (action: () => void) => {
    action()
    // if mouse is down for 0.4s, start repeating the action every 0.1s (while the mouse is down)
    timeoutRef.current = setTimeout(() => {
      intervalRef.current = setInterval(action, 100)
    }, 400)
  }

  // stopRepeat is called once onMouseUp (the mouse is up after click) and once onMouseLeave (the cursor moves from inside the button to outside the button)
  const stopRepeat = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    if (intervalRef.current) clearInterval(intervalRef.current)
  }

  // sets input limit hours and minutes from user settings or the default one if no user set value
  // we keep defaultSettings because there might be a case when the useStorage has not set the defaultSettings as settings, So settings might be null or undefined
  useEffect(() => {
    const totalMinutes = settings?.dailyLimitMinutes ?? defaultSettings.dailyLimitMinutes // using ?? instead of || because if settings.dailyLimitMinutes is 0, 0 is falsy and 0 || 60 would be 60
    setInputLimitHours(Math.floor(totalMinutes / 60))
    setInputLimitMinutes(totalMinutes % 60)
  }, [settings?.dailyLimitMinutes])

  const onUpdateLimit = () => {
    const h = Number.parseInt(String(inputLimitHours), 10) || 0 // || 0 because parseInt(...) can return NaN.
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
        // if the limit is reached and dailyLimitReachedAt was null (!null translates to true), set the dailyLimitReachedAt to current time
        nextUsage.dailyLimitReachedAt = Date.now()
      }
      setTodayUsage(nextUsage)
    }
  }

  return (
    <div
      style={{
        background: colors.cardBg,
        borderRadius: 16,
        padding: "14px",
        margin: "10px 0",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        border: `1px solid ${colors.border}`,
        flexShrink: 0
      }}>
      <div style={{ fontSize: 16, fontWeight: 700 }}>Daily Limit</div>

      <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
        <div
          onClick={() => toggleSetting("enableDailyLimitAlert")}
          style={{
            width: 18,
            height: 18,
            borderRadius: 4,
            background: settings?.enableDailyLimitAlert ? "#cc0000" : colors.inputBg, // if enableDailyLimitAlert is true, bg is red
            border: `2px solid ${settings?.enableDailyLimitAlert ? "#cc0000" : colors.inputBorder}`, // even border is red
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s"
          }}>
          {settings?.enableDailyLimitAlert && (
            <Icons.Check color="white" /> // the tick is always of white color, applied when the enableDailyLimitAlert boolean is true
          )}
        </div>
        <span style={{ fontSize: 13, fontWeight: 600, opacity: 0.9 }}>
          Enable Daily Limit Alert
        </span>
      </label>

      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        {/* Hide the default up and down arrow buttons (spinners) that browsers automatically render inside <input type="number"> fields. And show custom styled ones */}
        {/* The below style tag is Global Scoped */}
        {/* In React/JSX, <style> is treated as a standard HTML element. */}
        {/* By wrapping the CSS in { ... } and using a template literal string (backticks `), you are passing the CSS as a string to React. */}
        {/* It is applied on Mount and Re-render. (by React) */}
        {/* On Updates (Re-renders): React compares the virtual DOM. It doesn't destroy and recreate the <style> tag. Instead, it updates the text content inside the existing tag. */}
        <style>{`
          input[type="number"]::-webkit-inner-spin-button,
          input[type="number"]::-webkit-outer-spin-button {
            -webkit-appearance: none;
            margin: 0;
          }
          input[type="number"] {
            -moz-appearance: textfield;
          }
          .spinner-btn {
            background: transparent;
            border: none;
            color: ${colors.text};
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0.55;
            transition: opacity 0.15s, background-color 0.15s;
            border-radius: 4px;
          }
          .spinner-btn:hover {
            opacity: 1;
            background-color: ${isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.05)"};
          }
          .spinner-btn:active {
            background-color: ${isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.1)"};
          }
        `}</style>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            background: colors.inputBg,
            border: `1px solid ${colors.inputBorder}`,
            borderRadius: 10,
            padding: "2px 2px 2px 10px",
            flex: 1
          }}>
          <input
            type="number"
            // Setting type="number" on an HTML <input> tag provides several built-in browser behaviors:
            // 1. Mobile Keyboard Optimization (Best for UX) 
            // When a user taps the input on a mobile device (iOS/Android), the browser automatically opens a numeric keypad (numbers 0-9) instead of the standard alphabet keyboard.
            // 2. Character Filtering
            // The browser restricts what characters can be typed in the box. It will block normal letters (A-Z) and only allow:
            // Digits (0-9)
            // Signs (+, -)
            // Decimals (.)
            // The letter e (used for scientific exponential notation, e.g., 1e5).
            // 3. Accessibility (a11y)
            // Screen readers will read this input to visually impaired users as a "spinbutton" or "numeric input," informing them that only numbers are valid input.
            // 4. Enables Spinner Arrow Features
            // It signals to the browser that this is a numeric counter, which normally triggers the default browser up/down arrows (the ones we hid using our .spinner-btn CSS override style block).

            value={inputLimitHours}

            // the below onChange is just for temporary state of input limit hours. It is there so you can actually type in the input.
            // The actual update in the limits will happen when Update Limit button is clicked.
            // onChange is only for Direct Browser Interactions (So not called on changes through Increment or Decrement buttons)
            // The Buttons Programmatically Update State
            onChange={(e) => {
              const val = e.target.value;
              if (val === "") { setInputLimitHours(""); return; }
              const num = parseInt(val, 10);
              if (!isNaN(num)) setInputLimitHours(Math.min(23, Math.max(0, num)));
            }}
            style={{ width: "100%", minWidth: 24, border: "none", outline: "none", fontSize: 15, fontWeight: 600, textAlign: "center", background: "transparent", color: colors.text }}
          />
          <span style={{ fontSize: 13, color: colors.label, marginRight: 6, userSelect: "none" }}>h</span>
          <SpinnerButtons
            onIncrement={() => setInputLimitHours(prev => Math.min(23, (Number(prev) || 0) + 1))}
            onDecrement={() => setInputLimitHours(prev => Math.max(0, (Number(prev) || 0) - 1))}
            startRepeat={startRepeat}
            stopRepeat={stopRepeat}
            borderColor={colors.inputBorder}
          />
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            background: colors.inputBg,
            border: `1px solid ${colors.inputBorder}`,
            borderRadius: 10,
            padding: "2px 2px 2px 10px",
            flex: 1
          }}>
          <input
            type="number"
            value={inputLimitMinutes}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "") { setInputLimitMinutes(""); return; }
              const num = parseInt(val, 10);
              if (!isNaN(num)) setInputLimitMinutes(Math.min(59, Math.max(0, num)));
            }}
            style={{ width: "100%", minWidth: 24, border: "none", outline: "none", fontSize: 15, fontWeight: 600, textAlign: "center", background: "transparent", color: colors.text }}
          />
          <span style={{ fontSize: 13, color: colors.label, marginRight: 6, userSelect: "none" }}>m</span>
          <SpinnerButtons
            onIncrement={() => setInputLimitMinutes(prev => Math.min(59, (Number(prev) || 0) + 1))}
            onDecrement={() => setInputLimitMinutes(prev => Math.max(0, (Number(prev) || 0) - 1))}
            startRepeat={startRepeat}
            stopRepeat={stopRepeat}
            borderColor={colors.inputBorder}
          />
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
  )
}
