import type { ThemeColors } from "~/lib/theme"

export function CustomToggle({
  checked,
  onChange,
  isDark,
  size = "medium"
}: {
  checked: boolean
  onChange: () => void
  isDark: boolean
  size?: "small" | "medium"
}) {
  const isSmall = size === "small"
  const colors = isDark
    ? { off: "#3f3f4a", on: "#ff2d55" }
    : { off: "#d4d4d8", on: "#e11d48" }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      style={{
        width: isSmall ? 34 : 46,
        height: isSmall ? 20 : 26,
        borderRadius: 99,
        background: checked ? colors.on : colors.off,
        position: "relative",
        cursor: "pointer",
        transition: "background 0.2s ease",
        border: "none",
        padding: 0,
        flexShrink: 0,
        boxShadow: checked ? "0 4px 12px rgba(255,45,85,0.25)" : "inset 0 1px 2px rgba(0,0,0,0.1)"
      }}>
      <span
        style={{
          width: isSmall ? 14 : 20,
          height: isSmall ? 14 : 20,
          borderRadius: "50%",
          background: "white",
          position: "absolute",
          top: isSmall ? 3 : 3,
          left: checked ? (isSmall ? 17 : 23) : 3,
          transition: "left 0.2s cubic-bezier(0.22, 1, 0.36, 1)",
          boxShadow: "0 2px 6px rgba(0,0,0,0.18)"
        }}
      />
    </button>
  )
}
