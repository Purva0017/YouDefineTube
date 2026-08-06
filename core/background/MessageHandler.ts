import { MESSAGES, type Message } from "~/lib/messaging"
import { TimeTrackingService } from "./TimeTrackingService"

export class MessageHandler {
  private static instance: MessageHandler
  private timeTrackingService = TimeTrackingService.getInstance()

  private constructor() {}

  public static getInstance(): MessageHandler {
    if (!MessageHandler.instance) {
      MessageHandler.instance = new MessageHandler()
    }
    return MessageHandler.instance
  }

  public initialize(): void {
    chrome.runtime.onMessage.addListener((message: Message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse)
      return true
    })
  }

  private handleMessage(message: Message, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void): void {
    switch (message.type) {
      case MESSAGES.TIME_TRACKING_REPORT:
        if (sender.tab?.id) {
          void this.timeTrackingService.enqueue(async () => {
            await this.timeTrackingService.handleReport(sender.tab!.id!, message.payload)
            sendResponse({ ok: true })
          })
        }
        break

      case MESSAGES.REQUEST_EXTENSION:
        void this.timeTrackingService.enqueue(async () => {
          const result = await this.timeTrackingService.requestExtension()
          sendResponse(result)
        })
        break

      case MESSAGES.CLOSE_ALL_TABS:
        void (async () => {
          const tabs = await chrome.tabs.query({
            url: ["https://www.youtube.com/*", "https://m.youtube.com/*"]
          })
          const tabIds = tabs.map((t) => t.id).filter((id): id is number => typeof id === "number")
          if (tabIds.length > 0) {
            await chrome.tabs.remove(tabIds)
          }
          sendResponse({ ok: true })
        })()
        break

      case MESSAGES.CLOSE_CURRENT_TAB:
        if (sender.tab?.id) {
          void chrome.tabs.remove(sender.tab.id)
        }
        sendResponse({ ok: true })
        break

      default:
        sendResponse({ ok: false, error: "Unknown message type" })
    }
  }
}
