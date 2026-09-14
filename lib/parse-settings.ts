import { defaultSettings, type FocusSchedule, type Settings } from "./settings"
import { focusScheduleSchema, settingsSchema } from "./settings.schema"

/** Merge stored settings with defaults; invalid keys are dropped safely. */
export function parseSettings(raw: unknown): Settings {
  if (!raw || typeof raw !== "object") {
    return { ...defaultSettings }
  }

  const partial = settingsSchema.partial().safeParse(raw)
  const merged: Settings = {
    ...defaultSettings,
    ...(partial.success ? partial.data : {})
  }

  if (Array.isArray((raw as Settings).focusSchedules)) {
    merged.focusSchedules = (raw as Settings).focusSchedules
      .map((s) => focusScheduleSchema.safeParse(s))
      .filter((r): r is { success: true; data: FocusSchedule } => r.success)
      .map((r) => r.data)

    if (merged.focusSchedules.length === 0) {
      merged.focusSchedules = defaultSettings.focusSchedules
    }
  }

  return merged
}
