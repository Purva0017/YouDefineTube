import type { ReactNode } from "react"
import type { ThemeColors } from "~/lib/theme"
import { Icons } from "./Icons"

export type MasonryTileVariant = "shield" | "search"
export type MasonryTileSize = "sm" | "md" | "lg" | "full"

const SEARCH_PALETTE = {
  dark: { accent: "#8ba4ff", soft: "rgba(107,138,253,0.18)", glow: "rgba(107,138,253,0.28)" },
  light: { accent: "#4f6fe8", soft: "rgba(79,111,232,0.12)", glow: "rgba(79,111,232,0.2)" }
}

const SIZE_HEIGHT: Record<MasonryTileSize, number> = {
  sm: 112,
  md: 136,
  lg: 172,
  full: 120
}

const EXPAND_EASE = "cubic-bezier(0.4, 0, 0.2, 1)"
const EXPAND_DURATION = "0.38s"

export function MasonryTile({
  label,
  description,
  icon,
  active,
  onClick,
  colors,
  isDark,
  variant = "shield",
  size = "sm",
  embeddedExpand,
  expandHeight = 76,
  expanded = false,
  gridColumn,
  gridRow,
  layoutMode = "masonry"
}: {
  label: string
  description?: string
  icon: ReactNode
  active: boolean
  onClick: () => void
  colors: ThemeColors
  isDark: boolean
  variant?: MasonryTileVariant
  size?: MasonryTileSize
  embeddedExpand?: ReactNode
  expandHeight?: number
  expanded?: boolean
  gridColumn?: string
  gridRow?: string
  layoutMode?: "grid" | "masonry"
}) {
  const search = variant === "search" ? (isDark ? SEARCH_PALETTE.dark : SEARCH_PALETTE.light) : null
  const accent = search?.accent ?? colors.accent
  const accentSoft = search?.soft ?? colors.accentSoft
  const accentGlow = search?.glow ?? `${colors.accent}33`
  const minHeight = SIZE_HEIGHT[size]
  const hasEmbeddedExpand = embeddedExpand !== undefined
  const shellHeight = hasEmbeddedExpand ? minHeight + expandHeight : minHeight

  const shellStyle = {
    ...(layoutMode === "masonry"
      ? {
          breakInside: "avoid" as const,
          WebkitColumnBreakInside: "avoid" as const,
          pageBreakInside: "avoid" as const,
          display: "inline-block" as const,
          marginBottom: 10
        }
      : {}),
    ...(gridColumn ? { gridColumn } : {}),
    ...(gridRow ? { gridRow } : {}),
    borderRadius: 14,
    border: `1px solid ${active ? `${accent}99` : colors.border}`,
    background: active
      ? isDark
        ? `linear-gradient(160deg, ${accentSoft} 0%, rgba(24,24,28,0.98) 70%)`
        : `linear-gradient(160deg, ${accentSoft} 0%, #ffffff 75%)`
      : isDark
        ? "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(0,0,0,0.14) 100%)"
        : "linear-gradient(180deg, #ffffff 0%, #f6f6f8 100%)",
    boxShadow: active ? `0 10px 24px ${accentGlow}` : colors.shadowSm,
    transition: "border-color 0.22s ease, background 0.22s ease, box-shadow 0.22s ease",
    overflow: "hidden" as const,
    minHeight: shellHeight,
    height: hasEmbeddedExpand ? shellHeight : undefined,
    width: "100%"
  }

  const padding = size === "lg" ? "16px 14px" : "14px"

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...shellStyle,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: hasEmbeddedExpand ? "flex-start" : "center",
        padding,
        boxSizing: "border-box",
        cursor: "pointer",
        textAlign: "left"
      }}>
      <div
        style={{
          width: "100%",
          flex: hasEmbeddedExpand ? 1 : undefined,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: hasEmbeddedExpand ? "center" : undefined
        }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", width: "100%" }}>
          <div
            style={{
              width: size === "lg" ? 40 : 34,
              height: size === "lg" ? 40 : 34,
              borderRadius: 10,
              background: active ? accent : colors.tabBg,
              color: active ? "#fff" : colors.subtext,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: active ? `0 4px 12px ${accentGlow}` : "none",
              transition: "all 0.2s ease",
              flexShrink: 0
            }}>
            {icon}
          </div>
          {active && (
            <div
              style={{
                width: 20,
                height: 20,
                borderRadius: "50%",
                background: accent,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0
              }}>
              <Icons.Check size={11} color="#fff" strokeWidth={3} />
            </div>
          )}
        </div>
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: size === "lg" ? 15 : 13, fontWeight: 700, color: colors.text, lineHeight: 1.25 }}>
            {label}
          </div>
          {description && (
            <div style={{ fontSize: 11, color: colors.muted, marginTop: 4, lineHeight: 1.4 }}>{description}</div>
          )}
        </div>
      </div>

      {hasEmbeddedExpand && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            width: "100%",
            height: expanded ? expandHeight : 0,
            overflow: "hidden",
            flexShrink: 0,
            pointerEvents: expanded ? "auto" : "none",
            transition: `height ${EXPAND_DURATION} ${EXPAND_EASE}`
          }}>
          <div
            style={{
              height: expandHeight,
              display: "flex",
              alignItems: "center",
              boxSizing: "border-box",
              paddingTop: 16,
              borderTop: `1px solid ${colors.border}`,
              transform: expanded ? "translateY(0)" : "translateY(100%)",
              opacity: expanded ? 1 : 0,
              transition: `transform ${EXPAND_DURATION} ${EXPAND_EASE}, opacity 0.22s ease`
            }}>
            {embeddedExpand}
          </div>
        </div>
      )}
    </button>
  )
}
