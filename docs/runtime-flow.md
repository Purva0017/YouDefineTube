# Runtime Flow

End-to-end runtime behavior for all major features. Updated for modular UI, audio, focus, friction, and bookmarks.

---

## Flow 1: Popup Tab Navigation

```
User opens popup
    │
    ▼
popup.tsx reads settings.activeTab (default: "stats")
    │
    ├── "stats" → TimerCard + DailyLimitCard + extensions band
    ├── "filters" → MainDashboard (all blocking/audio/focus settings)
    └── "bookmarks" → BookmarksView (timestamp notes)

User clicks tab button
    │
    ▼
setMainTab("filters") → setSettings({ activeTab: "filters" })
    │
    ▼
Tab persists across popup close/reopen (stored in settings)
```

**When extension is off:** Only `PowerOffView` shown — no tabs, no timer card.

---

## Flow 2: Toggle a Distraction Setting

Unchanged core path:

```
User toggles in MainDashboard (Blocks tab)
    → toggleSetting("hideShorts")
    → useStorage writes settings
    → storage.watch in content script
    → DistractionManager.apply(settings)
    → CSS injected
```

**New:** `gridSearchMode` toggle injects grid layout CSS on search pages.

---

## Flow 3: Audio Volume Boost

```
User moves volume slider to 200% in MainDashboard
    │
    ▼
setSettings({ audioVolumeBoost: 200 })
    │
    ▼
storage.watch → contents/youtube.ts
    → audioManager.apply(settings)
    │
    ▼
AudioManager:
    ├── hasActiveBoost = true (200 > 100)
    ├── getAudioContext() — create if needed
    ├── For each <video>:
    │     ├── hookVideo() — createMediaElementSource + gainNode
    │     └── updateVideoNodes() — gainNode.gain = 2.0
    └── resumeContext() on user gesture
```

**Vocal boost ON adds:**
```
video → highpass(150Hz) → peaking(2kHz,+6dB) → gain → destination
```

**New video elements:** Hooked automatically on `play` event (capture listener).

---

## Flow 4: Focus Schedule Block

```
Precondition: enableFocusBlocker=true, schedule enabled, current time in window

Every 1 second + on navigation + on settings change:
    checkFocusAndFriction()
    │
    ▼
isFocusScheduleActive(settings) in lib/focus-blocker.ts
    ├── Check today's day in schedule.days
    ├── Compare current minutes vs startTime/endTime
    └── Handle midnight span (23:00-07:00)
    │
    ▼
If active:
    ├── overlayManager.showFocusBlockerAlert(name, start, end)
    │     ├── Pause video
    │     ├── Full-screen overlay with quote
    │     └── Close tab / Close all buttons
    ├── removeFrictionPrompt() — focus takes priority
    └── removeFrictionGoalOverlay()
```

**When schedule ends:** `removeFocusBlockerAlert()` on next poll.

---

## Flow 5: Friction Screen ("Are You Sure?")

```
Precondition: enableFrictionScreen=true, no active focus schedule

checkFocusAndFriction()
    │
    ▼
sessionStorage check:
    ├── ydt_friction_goal_dismissed === "true" → skip
    ├── ydt_friction_prompted !== "true" → showFrictionPrompt()
    └── ydt_friction_prompted === "true" → showFrictionGoalOverlay(goal)
```

### Prompt Flow

```
showFrictionPrompt()
    ├── User enters goal → "Define Goal"
    │     ├── sessionStorage: ydt_friction_prompted=true, ydt_friction_goal=goal
    │     ├── removeFrictionPrompt()
    │     └── showFrictionGoalOverlay(goal)
    │
    └── User clicks "Nevermind"
          └── CLOSE_CURRENT_TAB message → tab closes
```

### Goal Badge Flow

```
showFrictionGoalOverlay(goal)
    ├── Floating badge bottom-right with goal text
    ├── "Done" → 2s countdown → CLOSE_CURRENT_TAB
    └── "×" → dismiss, set ydt_friction_goal_dismissed=true
```

---

## Flow 6: Save Video Bookmark

```
Precondition: User on YouTube /watch page, popup open to Bookmarks tab

BookmarksView mount:
    ├── chrome.tabs.query({ active: true, currentWindow: true })
    ├── Parse videoId from tab URL
    └── Start polling GET_CURRENT_TIME every 1s

User types note + clicks Save:
    ├── Read currentTime from poll response
    ├── Create Bookmark { id, timestamp, note, createdAt, videoTitle }
    ├── Append to allBookmarks[videoId]
    └── useStorage write to "bookmarks" key
```

---

## Flow 7: Seek to Bookmark Timestamp

```
User clicks bookmark timestamp in BookmarksView
    │
    ▼
chrome.tabs.sendMessage(tabId, {
  type: "YDT_SEEK_TO_TIME",
  payload: { time: bookmark.timestamp }
})
    │
    ▼
Content script listener:
    ├── video.currentTime = payload.time
    └── video.play()
```

**Note:** Requires active YouTube tab with content script loaded.

---

## Flow 8: Time Tracking Heartbeat

Unchanged from prior version. See previous documentation.

**Still runs when extension is off** — `TimeReporter` does not check `isExtensionEnabled`.

---

## Flow 9: Daily Limit Reached

Unchanged. Background triggers notification + overlay broadcast.

Focus blocker and friction overlays are **separate** from daily limit overlay — all can theoretically stack (focus takes visual priority via z-index).

---

## Flow 10: Midnight Reset

Unchanged. Alarm → `checkDateChange()` → fresh `DailyUsage`.

---

## Flow 11: Extension Disabled

```
User clicks power button in Header
    → toggleSetting("isExtensionEnabled")
    │
    ▼
Content script:
    ├── DistractionManager clears CSS
    ├── AudioManager stops boosting (gain = 1.0)
    ├── Overlays removed
    └── Navigation redirects stop
    │
    ▼
Popup shows PowerOffView only (no stats/tabs)
```

Time tracking continues in background.

---

## Flow 12: Focus Schedule CRUD (Popup)

```
User in Blocks tab → Focus & Mindfulness section
    │
    ├── Toggle enableFocusBlocker
    ├── Expand schedule → edit name, start/end time, days
    ├── Toggle individual schedule enabled/disabled
    ├── Add new schedule → append to focusSchedules[]
    └── Delete schedule → filter from focusSchedules[]

All changes → setSettings() → storage.watch → checkFocusAndFriction()
```

---

## Timing Constants

| Constant | Value | Used For |
|----------|-------|----------|
| `TIMERS.HEARTBEAT` | 15000 ms | Time report interval |
| `TIMERS.TICK` | 600 ms | Video listener check |
| Navigation/focus poll | 1000 ms | Redirects + focus/friction check |
| Bookmark time poll | 1000 ms | Current video position in popup |
| Goal badge countdown | 2000 ms | Before tab close on "Done" |
| Shorts revert TTL | 600000 ms | Session storage marker |
