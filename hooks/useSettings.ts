import { useStorage } from "@plasmohq/storage/hook"
import { type Settings, defaultSettings } from "~/lib/settings"

export function useSettings() {
  const [settings, setSettings] = useStorage<Settings>("settings", defaultSettings)

  // // simply flips the boolean value of the passed key in settings object
  const toggleSetting = (key: keyof Settings) => {
    setSettings({ ...(settings || defaultSettings), [key]: !settings?.[key] }) // settings?. becuase if settings is undefined, settings?.[key] returns undefined and !undefined gives true & if settings was undefined, defaultSettings will be used and defaultSettings has default values of most booleans as false so !undefined giving true would be equivalent to !false
  }

  return {
    settings,
    setSettings,
    toggleSetting
  }
}
