import type { ThemeColors } from "~/lib/theme"
import { Icons } from "./Icons"

type TabId = "stats" | "filters" | "bookmarks"

const TABS: { id: TabId; label: string; icon: keyof typeof Icons }[] = [
  { id: "stats", label: "Stats", icon: "Chart" },
  { id: "filters", label: "Blocks", icon: "Shield" },
  { id: "bookmarks", label: "Bookmarks", icon: "Bookmark" }
]

export function TabBar({
  active,
  onChange,
  colors,
  isDark
}: {
  active: TabId
  onChange: (tab: TabId) => void
  colors: ThemeColors
  isDark: boolean
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: 4,
        padding: 4,
        margin: "0 16px",
        background: colors.tabBg,
        borderRadius: 14,
        border: `1px solid ${colors.border}`,
        flexShrink: 0
      }}>
      {TABS.map((tab) => {
        const isActive = active === tab.id
        const Icon = Icons[tab.icon]
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              padding: "10px 8px",
              border: "none",
              borderRadius: 10,
              background: isActive ? colors.tabActive : "transparent",
              color: isActive ? colors.text : colors.subtext,
              fontWeight: isActive ? 700 : 600,
              fontSize: 12,
              cursor: "pointer",
              boxShadow: isActive ? (isDark ? "0 1px 0 rgba(255,255,255,0.06)" : "0 2px 8px rgba(0,0,0,0.06)") : "none",
              transition: "all 0.18s ease"
            }}>
            <Icon size={15} />
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
