import type { ThemeColors } from "~/lib/theme"
import { Icons } from "../ui/Icons"

const NavButton = ({
  label,
  onClick,
  showExternalIcon = false,
  colors,
  isDark
}: {
  label: string
  onClick: () => void
  showExternalIcon?: boolean
  colors: ThemeColors
  isDark: boolean
}) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      flex: 1,
      padding: "12px 6px",
      background: "none",
      border: "none",
      color: colors.muted,
      fontSize: 13,
      fontWeight: 500,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
      borderRadius: 6,
      transition: "color 0.15s ease"
    }}
    onMouseEnter={(e) => { e.currentTarget.style.color = colors.text }}
    onMouseLeave={(e) => { e.currentTarget.style.color = colors.muted }}>
    {label}
    {showExternalIcon && <Icons.External />}
  </button>
)

export function Footer({
  setActiveView,
  colors,
  isDark
}: {
  setActiveView: (view: "main" | "support" | "donate") => void
  colors: ThemeColors
  isDark: boolean
}) {
  return (
    <div
      style={{
        display: "flex",
        borderTop: `1px solid ${colors.border}`,
        padding: "4px 12px",
        flexShrink: 0,
        background: colors.bgElevated
      }}>
      <NavButton label="Support" onClick={() => setActiveView("donate")} colors={colors} isDark={isDark} />
      <NavButton
        label="Feature Request"
        onClick={() => window.open("https://forms.gle/uexgYsXNMYVr8Fs48", "_blank")}
        showExternalIcon
        colors={colors}
        isDark={isDark}
      />
      <NavButton label="Report Issue" onClick={() => setActiveView("support")} colors={colors} isDark={isDark} />
    </div>
  )
}
