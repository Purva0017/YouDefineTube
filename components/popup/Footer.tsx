import type { ThemeColors } from "~/lib/theme"
import { Icons } from "../ui/Icons"

const NavButton = ({
  label,
  onClick,
  showExternalIcon = false,
  colors
}: {
  label: string
  onClick: () => void
  showExternalIcon?: boolean
  colors: ThemeColors
}) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      flex: 1,
      padding: "12px 8px",
      background: "none",
      border: "none",
      color: colors.subtext,
      fontSize: 11,
      fontWeight: 600,
      cursor: "pointer",
      transition: "color 0.15s, background 0.15s",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
      borderRadius: 8
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.color = colors.text
      e.currentTarget.style.background = colors.tabBg
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.color = colors.subtext
      e.currentTarget.style.background = "transparent"
    }}>
    {label}
    {showExternalIcon && <Icons.External />}
  </button>
)

export function Footer({
  setActiveView,
  colors
}: {
  setActiveView: (view: "main" | "support" | "donate") => void
  colors: ThemeColors
}) {
  return (
    <div
      style={{
        display: "flex",
        borderTop: `1px solid ${colors.border}`,
        background: colors.bgElevated,
        flexShrink: 0
      }}>
      <NavButton label="Support" onClick={() => setActiveView("donate")} colors={colors} />
      <NavButton
        label="Feature Request"
        onClick={() => window.open("https://forms.gle/uexgYsXNMYVr8Fs48", "_blank")}
        showExternalIcon
        colors={colors}
      />
      <NavButton label="Report Issue" onClick={() => setActiveView("support")} colors={colors} />
    </div>
  )
}
