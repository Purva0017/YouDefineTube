import { useStorage } from "@plasmohq/storage/hook"
import { type Settings, defaultSettings } from "~/lib/settings"
import { getThemeColors } from "~/lib/theme"

export function useTheme() {
  const [settings] = useStorage<Settings>("settings", defaultSettings)

  const currentTheme = settings?.theme || defaultSettings.theme
  const isDark = currentTheme === "dark"
  const colors = getThemeColors(isDark)

  return { isDark, colors }
}
