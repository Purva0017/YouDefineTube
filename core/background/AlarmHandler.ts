import { TimeTrackingService } from "./TimeTrackingService"

export class AlarmHandler {
  private static instance: AlarmHandler
  private timeTrackingService = TimeTrackingService.getInstance()

  private constructor() {}

  public static getInstance(): AlarmHandler {
    if (!AlarmHandler.instance) {
      AlarmHandler.instance = new AlarmHandler()
    }
    return AlarmHandler.instance
  }

  public initialize(): void {
    chrome.alarms.onAlarm.addListener((alarm) => {
      this.handleAlarm(alarm)
    })
  }

  private handleAlarm(alarm: chrome.alarms.Alarm): void {
    if (alarm.name === "midnight-reset") {
      void this.timeTrackingService.enqueue(async () => {
        await this.timeTrackingService.checkDateChange()
        this.timeTrackingService.setupMidnightAlarm()
      })
    }
  }
}
