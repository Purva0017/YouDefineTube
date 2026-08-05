import { useStorage } from "@plasmohq/storage/hook"
import { type Settings, defaultSettings } from "~/lib/settings"

export function useTheme() {
  const [settings] = useStorage<Settings>("settings", defaultSettings)

  const currentTheme = settings?.theme || defaultSettings.theme
  const isDark = currentTheme === "dark"

  const colors = {
    bg: isDark ? "#0f0f0f" : "#ffffff",
    cardBg: isDark ? "#1e1e1e" : "#f9fafb",
    text: isDark ? "#f1f1f1" : "#111827",
    subtext: isDark ? "#aaaaaa" : "#4b5563",
    border: isDark ? "#2a2a2a" : "#f3f4f6",
    inputBg: isDark ? "#2a2a2a" : "#ffffff",
    inputBorder: isDark ? "#3f3f3f" : "#e5e7eb",
    label: isDark ? "#888888" : "#6b7280"
  }

  return { isDark, colors }
}
