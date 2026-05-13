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
