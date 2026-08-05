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
  colors: any
}) => (
  <button
    onClick={onClick}
    style={{
      flex: 1,
      padding: "10px 0",
      background: "none",
      border: "none",
      color: colors.subtext,
      fontSize: 12,
      fontWeight: 600,
      cursor: "pointer",
      transition: "color 0.2s",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
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
  colors: any
}) {
  return (
    <div
      style={{
        display: "flex",
        borderTop: `1px solid ${colors.border}`,
        background: colors.bg
      }}>
      <NavButton
        label="Support the Dev"
        onClick={() => setActiveView("donate")}
        colors={colors}
      />
      <NavButton
        label="Request Feature"
        onClick={() => window.open("https://forms.gle/uexgYsXNMYVr8Fs48", "_blank")}
        showExternalIcon
        colors={colors}
      />
      <NavButton
        label="Report Issue"
        onClick={() => setActiveView("support")}
        colors={colors}
      />
    </div>
  )
}
