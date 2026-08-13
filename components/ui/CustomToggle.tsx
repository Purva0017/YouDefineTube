import type { ThemeColors } from "~/lib/theme"

export function CustomToggle({
  checked,
  onChange,
  isDark,
  colors,
  size = "medium"
}: {
  checked: boolean
  onChange: () => void
  isDark: boolean
  colors?: ThemeColors
  size?: "small" | "medium"
}) {
  const isSmall = size === "small"
  const trackOff = isDark ? "#3a3530" : "#d6d0c8"
  const trackOn = colors?.accent ?? "#e04555"

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      style={{
        width: isSmall ? 40 : 48,
        height: isSmall ? 22 : 26,
        borderRadius: 99,
        background: checked ? trackOn : trackOff,
        position: "relative",
        cursor: "pointer",
        transition: "background 0.2s ease",
        border: "none",
        padding: 0,
        flexShrink: 0
      }}>
      <span
        style={{
          width: isSmall ? 16 : 20,
          height: isSmall ? 16 : 20,
          borderRadius: "50%",
          background: "white",
          position: "absolute",
          top: 3,
          left: checked ? (isSmall ? 21 : 25) : 3,
          transition: "left 0.2s cubic-bezier(0.22, 1, 0.36, 1)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)"
        }}
      />
    </button>
  )
}
