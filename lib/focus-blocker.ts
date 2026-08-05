import type { Settings, FocusSchedule } from "./settings"

export function isFocusScheduleActive(settings: Settings): { active: boolean; schedule?: FocusSchedule } {
  if (!settings.isExtensionEnabled || !settings.enableFocusBlocker || !settings.focusSchedules) {
    return { active: false }
  }

  const now = new Date()
  const todayDayOfWeek = now.getDay() // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const yesterdayDayOfWeek = (todayDayOfWeek + 6) % 7
  const currentMinutes = now.getHours() * 60 + now.getMinutes()

  for (const schedule of settings.focusSchedules) {
    if (!schedule.enabled || !schedule.startTime || !schedule.endTime) continue

    const [startH, startM] = schedule.startTime.split(":").map(Number)
    const [endH, endM] = schedule.endTime.split(":").map(Number)
    const startMinutes = startH * 60 + startM
    const endMinutes = endH * 60 + endM

    // 1. Check if schedule is active today
    if (schedule.days.includes(todayDayOfWeek)) {
      if (startMinutes < endMinutes) {
        if (currentMinutes >= startMinutes && currentMinutes < endMinutes) {
          return { active: true, schedule }
        }
      } else if (startMinutes > endMinutes) {
        // spans midnight (e.g. 23:00 to 07:00)
        if (currentMinutes >= startMinutes || currentMinutes < endMinutes) {
          return { active: true, schedule }
        }
      } else {
        // startMinutes === endMinutes means 24 hours block
        return { active: true, schedule }
      }
    }

    // 2. Check if schedule was active yesterday (spans midnight and we are in the early morning part)
    if (schedule.days.includes(yesterdayDayOfWeek)) {
      if (startMinutes > endMinutes) {
        if (currentMinutes < endMinutes) {
          return { active: true, schedule }
        }
      }
    }
  }

  return { active: false }
}
