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
        background: colors.tabBg,
        borderRadius: 10,
        border: `1px solid ${colors.border}`
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
              padding: "10px 6px",
              border: "none",
              borderRadius: 8,
              background: isActive ? colors.tabActive : "transparent",
              color: isActive ? colors.text : colors.muted,
              fontWeight: isActive ? 600 : 500,
              fontSize: 14,
              cursor: "pointer",
              boxShadow: isActive ? colors.shadowSm : "none",
              transition: "all 0.2s ease"
            }}>
            <Icon size={16} />
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
