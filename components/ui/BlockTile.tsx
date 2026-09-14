import type { ReactNode } from "react"
import type { ThemeColors } from "~/lib/theme"
import { Icons } from "./Icons"

function TileContent({
  label,
  description,
  icon,
  active,
  colors
}: {
  label: string
  description?: string
  icon: ReactNode
  active: boolean
  colors: ThemeColors
}) {
  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 8,
            background: active ? colors.accent : colors.tabBg,
            color: active ? "#fff" : colors.subtext,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s ease"
          }}>
          {icon}
        </div>
        {active && <Icons.Check size={14} color={colors.accent} strokeWidth={3} />}
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: colors.text, lineHeight: 1.3 }}>{label}</div>
        {description && (
          <div style={{ fontSize: 12, color: colors.muted, marginTop: 3, lineHeight: 1.4 }}>{description}</div>
        )}
      </div>
    </>
  )
}

export function BlockTile({
  label,
  description,
  icon,
  active,
  onClick,
  colors,
  isDark,
  footer
}: {
  label: string
  description?: string
  icon: ReactNode
  active: boolean
  onClick: () => void
  colors: ThemeColors
  isDark: boolean
  footer?: ReactNode
}) {
  const shellStyle = {
    borderRadius: 10,
    border: `1px solid ${active ? colors.accent : colors.border}`,
    background: active ? colors.accentSoft : "transparent",
    transition: "all 0.2s ease",
    width: "100%",
    overflow: "hidden" as const
  }

  const bodyStyle = {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "flex-start",
    gap: 10,
    padding: 14,
    width: "100%",
    textAlign: "left" as const
  }

  if (!footer) {
    return (
      <button type="button" onClick={onClick} style={{ ...shellStyle, ...bodyStyle, cursor: "pointer", minHeight: 96 }}>
        <TileContent label={label} description={description} icon={icon} active={active} colors={colors} />
      </button>
    )
  }

  return (
    <div style={shellStyle}>
      <button type="button" onClick={onClick} style={{ ...bodyStyle, border: "none", background: "transparent", cursor: "pointer" }}>
        <TileContent label={label} description={description} icon={icon} active={active} colors={colors} />
      </button>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          borderTop: `1px solid ${colors.border}`,
          padding: "10px 14px",
          background: isDark ? "rgba(0,0,0,0.15)" : "rgba(0,0,0,0.02)"
        }}>
        {footer}
      </div>
    </div>
  )
}
