import type { ReactNode } from "react"
import type { ThemeColors } from "~/lib/theme"

export function BlockSection({
  title,
  subtitle,
  activeCount,
  totalCount,
  colors,
  children
}: {
  title: string
  subtitle: string
  activeCount: number
  totalCount: number
  colors: ThemeColors
  children: ReactNode
}) {
  return (
    <div
      style={{
        background: colors.cardBg,
        border: `1px solid ${colors.border}`,
        borderRadius: 12,
        padding: 18,
        display: "flex",
        flexDirection: "column",
        gap: 14,
        boxShadow: colors.shadowSm
      }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: colors.text }}>{title}</div>
          <div style={{ fontSize: 13, color: colors.muted, marginTop: 3 }}>{subtitle}</div>
        </div>
        <div
          style={{
            padding: "5px 12px",
            borderRadius: 6,
            background: activeCount > 0 ? colors.accentSoft : colors.tabBg,
            fontSize: 12,
            fontWeight: 600,
            color: activeCount > 0 ? colors.accent : colors.muted,
            flexShrink: 0
          }}>
          {activeCount}/{totalCount}
        </div>
      </div>
      {children}
    </div>
  )
}
