import { Storage } from "@plasmohq/storage"
import { defaultSettings, type Settings } from "~/lib/settings"
import { STORAGE_KEYS } from "~/lib/constants"

export class SettingsService {
  private static instance: SettingsService
  private storage = new Storage()
  private cache: Settings = { ...defaultSettings }
  private listeners: Array<(next: Settings, prev: Settings) => void> = []

  private constructor() {}

  public static getInstance(): SettingsService {
    if (!SettingsService.instance) {
      SettingsService.instance = new SettingsService()
    }
    return SettingsService.instance
  }

  public async initialize(): Promise<void> {
    await this.load()
    this.watch()
  }

  public get settings(): Settings {
    return this.cache
  }

  private async load(): Promise<void> {
    const stored = await this.storage.get<Partial<Settings>>(STORAGE_KEYS.SETTINGS)
    this.cache = {
      ...defaultSettings,
      ...(stored || {})
    }
  }

  private watch(): void {
    this.storage.watch({
      [STORAGE_KEYS.SETTINGS]: (chg) => {
        const prev = { ...defaultSettings, ...((chg?.oldValue as Partial<Settings>) || {}) }
        const next = { ...defaultSettings, ...((chg?.newValue as Partial<Settings>) || {}) }
        this.cache = next
        this.listeners.forEach(l => l(next, prev))
      }
    })
  }

  public onSettingsChange(listener: (next: Settings, prev: Settings) => void): void {
    this.listeners.push(listener)
  }

  public async updateSettings(next: Partial<Settings>): Promise<void> {
    await this.storage.set(STORAGE_KEYS.SETTINGS, {
      ...this.cache,
      ...next
    })
  }
}
