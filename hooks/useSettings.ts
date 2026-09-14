import { useStorage } from "@plasmohq/storage/hook"
import { type Settings, defaultSettings, parseSettings } from "~/lib/settings"

export function useSettings() {
  const [rawSettings, setRawSettings] = useStorage<Settings>("settings", defaultSettings)
  const settings = parseSettings(rawSettings)

  const setSettings = (next: Settings | Partial<Settings>) => {
    setRawSettings(parseSettings({ ...settings, ...next }))
  }

  const toggleSetting = (key: keyof Settings) => {
    setSettings({ [key]: !settings[key] })
  }

  return {
    settings,
    setSettings,
    toggleSetting
  }
}
