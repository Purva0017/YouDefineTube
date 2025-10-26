import { useEffect } from "react"
import { useStorage } from "@plasmohq/storage/hook"

type Settings = {
  hideShorts: boolean
  hideEndScreen: boolean
  hideComments: boolean
  hideLiveChat: boolean
}

const defaults: Settings = {
  hideShorts: true,
  hideEndScreen: true,
  hideComments: false,
  hideLiveChat: false
}

function IndexPopup() {
  const [settings, setSettings] = useStorage<Settings>("settings", defaults)

  useEffect(() => {
    if (!settings) setSettings(defaults)
  }, [])

  const onToggle = (key: keyof Settings) => {
    setSettings({ ...(settings || defaults), [key]: !settings?.[key] })
  }

  return (
    <div style={{ padding: 16, width: 320 }}>
      <h3>YouDefineTube</h3>

      <label style={{ display: "flex", gap: 8, alignItems: "center", margin: "8px 0" }}>
        <input
          type="checkbox"
          checked={!!settings?.hideShorts}
          onChange={() => onToggle("hideShorts")}
        />
        Hide Shorts
      </label>

      <label style={{ display: "flex", gap: 8, alignItems: "center", margin: "8px 0" }}>
        <input
          type="checkbox"
          checked={!!settings?.hideEndScreen}
          onChange={() => onToggle("hideEndScreen")}
        />
        Hide End Screen
      </label>

      <label style={{ display: "flex", gap: 8, alignItems: "center", margin: "8px 0" }}>
        <input
          type="checkbox"
          checked={!!settings?.hideComments}
          onChange={() => onToggle("hideComments")}
        />
        Hide Comments
      </label>

      <label style={{ display: "flex", gap: 8, alignItems: "center", margin: "8px 0" }}>
        <input
          type="checkbox"
          checked={!!settings?.hideLiveChat}
          onChange={() => onToggle("hideLiveChat")}
        />
        Hide Live Chat
      </label>

      <div style={{ marginTop: 12, fontSize: 12, opacity: 0.7 }}>
        Changes apply instantly on the active YouTube tab.
      </div>
    </div>
  )
}

export default IndexPopup
