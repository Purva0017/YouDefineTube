import { SettingsService } from "~/core/background/SettingsService"
import { TimeTrackingService } from "~/core/background/TimeTrackingService"
import { MessageHandler } from "~/core/background/MessageHandler"
import { AlarmHandler } from "~/core/background/AlarmHandler"

const initializeBackground = async () => {
  const settingsService = SettingsService.getInstance()
  const timeTrackingService = TimeTrackingService.getInstance()
  const messageHandler = MessageHandler.getInstance()
  const alarmHandler = AlarmHandler.getInstance()

  // Initialize services
  await settingsService.initialize()
  await timeTrackingService.initialize()
  
  // Initialize handlers
  messageHandler.initialize()
  alarmHandler.initialize()

  // Toolbar icon — no popup; open YouTube so user can use the in-page button
  chrome.action.onClicked.addListener(async () => {
    const ytTabs = await chrome.tabs.query({
      url: ["https://www.youtube.com/*", "https://m.youtube.com/*"]
    })
    if (ytTabs.length > 0 && ytTabs[0].id) {
      await chrome.tabs.update(ytTabs[0].id, { active: true })
      if (ytTabs[0].windowId) {
        await chrome.windows.update(ytTabs[0].windowId, { focused: true })
      }
      return
    }
    await chrome.tabs.create({ url: "https://www.youtube.com" })
  })

  // Register tab removal listener
  chrome.tabs.onRemoved.addListener((tabId) => {
    void timeTrackingService.enqueue(async () => {
      await timeTrackingService.handleTabRemoved(tabId)
    })
  })
}

// Bootstrap
initializeBackground().catch((err) => {
  console.error("Background initialization failed:", err)
})
