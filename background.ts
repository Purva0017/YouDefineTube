import { SettingsService } from "~/core/background/SettingsService"
import { TimeTrackingService } from "~/core/background/TimeTrackingService"
import { MessageHandler } from "~/core/background/MessageHandler"
import { AlarmHandler } from "~/core/background/AlarmHandler"
import { MESSAGES } from "~/lib/messaging"

// CRITICAL: Register all Chrome event listeners synchronously at the top level
// so they are captured even when the service worker is woken by an event.
// Messages arriving before init completes are queued and replayed afterward.

const settingsService = SettingsService.getInstance()
const timeTrackingService = TimeTrackingService.getInstance()
const messageHandler = MessageHandler.getInstance()
const alarmHandler = AlarmHandler.getInstance()

// Queue for messages that arrive before initialization completes
let earlyMessages: Array<{
  message: any
  sender: chrome.runtime.MessageSender
  sendResponse: (response?: any) => void
}> = []
let isInitialized = false

// Register the message listener synchronously so no messages are ever dropped
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (isInitialized) {
    messageHandler.handleIncoming(message, sender, sendResponse)
  } else {
    earlyMessages.push({ message, sender, sendResponse })
  }
  return true // keep channel open for async sendResponse
})

// Register alarm listener synchronously
chrome.alarms.onAlarm.addListener((alarm) => {
  alarmHandler.handleAlarm(alarm)
})

// Register tab/window listeners synchronously
chrome.tabs.onRemoved.addListener((tabId) => {
  void timeTrackingService.enqueue(async () => {
    await timeTrackingService.handleTabRemoved(tabId)
  })
})

chrome.tabs.onActivated.addListener((activeInfo) => {
  void timeTrackingService.enqueue(async () => {
    await timeTrackingService.handleTabActivated(activeInfo.tabId)
  })
})

if (chrome.windows?.onFocusChanged) {
  chrome.windows.onFocusChanged.addListener((windowId) => {
    void timeTrackingService.enqueue(async () => {
      await timeTrackingService.handleWindowFocusChanged(windowId)
    })
  })
}

const initializeBackground = async () => {
  // Initialize services (reads from storage)
  await settingsService.initialize()
  await timeTrackingService.initialize()

  // Mark as initialized and replay any queued messages
  isInitialized = true
  for (const { message, sender, sendResponse } of earlyMessages) {
    messageHandler.handleIncoming(message, sender, sendResponse)
  }
  earlyMessages = []

  // Toolbar icon — open/toggle inline panel on YouTube, or open YouTube
  chrome.action.onClicked.addListener(async (tab) => {
    // If the active tab is already YouTube, toggle inline panel immediately
    if (tab.id && tab.url && /https:\/\/(www\.|m\.)?youtube\.com/i.test(tab.url)) {
      chrome.tabs.sendMessage(tab.id, { type: MESSAGES.TOGGLE_INLINE_PANEL }).catch(() => {})
      return
    }

    const ytTabs = await chrome.tabs.query({
      url: ["https://www.youtube.com/*", "https://m.youtube.com/*"]
    })
    if (ytTabs.length > 0 && ytTabs[0].id) {
      await chrome.tabs.update(ytTabs[0].id, { active: true })
      if (ytTabs[0].windowId) {
        await chrome.windows.update(ytTabs[0].windowId, { focused: true })
      }
      chrome.tabs.sendMessage(ytTabs[0].id, { type: MESSAGES.TOGGLE_INLINE_PANEL }).catch(() => {})
      return
    }
    await chrome.tabs.create({ url: "https://www.youtube.com" })
  })
}

// Bootstrap
initializeBackground().catch((err) => {
  console.error("Background initialization failed:", err)
})
