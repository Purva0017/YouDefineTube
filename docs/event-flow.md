# Event Flow

Events, listeners, observers, and message passing. Updated for audio, focus, friction, and bookmarks.

---

## New Events (UI Overhaul)

### AudioManager Event Listeners

| Event | Target | Phase | Handler |
|-------|--------|-------|---------|
| `play` | `document` | capture | `checkAndHookVideo(video)` |
| `click` | `document` | capture | `resumeContext()` |
| `keydown` | `document` | capture | `resumeContext()` |

### Focus & Friction Polling

| Trigger | Handler | Frequency |
|---------|---------|-----------|
| `setInterval(1000)` | `checkFocusAndFriction()` | Every 1 second |
| `yt-navigate-finish` | `checkFocusAndFriction()` | On SPA navigation |
| `storage.watch` settings | `checkFocusAndFriction()` | On settings change |
| `DOMContentLoaded` | `checkFocusAndFriction()` | Once on init |

### Bookmark Polling (Popup)

| Trigger | Handler | Frequency |
|---------|---------|-----------|
| `useEffect` interval | `chrome.tabs.sendMessage(GET_CURRENT_TIME)` | Every 1 second |
| Only when | `activeTab.videoId` exists | — |

### Content Script Message Listener (Expanded)

```typescript
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === DAILY_LIMIT_REACHED) { ... }
  else if (message?.type === GET_CURRENT_TIME) {
    sendResponse({ time: video?.currentTime ?? null })
    return true
  }
  else if (message?.type === SEEK_TO_TIME) {
    video.currentTime = message.payload.time
    video.play()
  }
})
```

---

## Overlay Event Priority

When multiple overlays could show, `checkFocusAndFriction()` enforces:

```
1. Focus blocker (highest) — removes friction overlays
2. Friction prompt/badge — only if no focus schedule active
3. Daily limit — independent (from background message + storage watch)
4. Homepage message — independent (inline, not modal)
```

---

## Session Storage Events

| Key Set | Trigger | Effect |
|---------|---------|--------|
| `ydt_friction_prompted=true` | Friction form submit | Skip prompt, show badge |
| `ydt_friction_goal=text` | Friction form submit | Display in badge |
| `ydt_friction_goal_dismissed=true` | Badge × click | Hide friction UI for session |

---

## React Events (Popup)

### MainDashboard

| Event | Handler |
|-------|---------|
| Category header click | `toggleSetting("isXCategoryOpen")` |
| Toggle switch click | `toggleSetting(key)` |
| Volume slider change | `setSettings({ audioVolumeBoost: val })` |
| Schedule expand/collapse | `setExpandedScheduleId` (local state) |
| Schedule field edit | `setSettings({ focusSchedules: next })` |
| Add schedule button | Append new schedule to array |
| Delete schedule button | Filter schedule from array |

### BookmarksView

| Event | Handler |
|-------|---------|
| Save button | Create bookmark, write to storage |
| Timestamp click | `SEEK_TO_TIME` message to tab |
| Delete button | Remove from `allBookmarks[videoId]` |
| Search input | Filter displayed bookmarks |
| Copy URL button | `navigator.clipboard.writeText` |

### Header

| Event | Handler |
|-------|---------|
| Theme button | Toggle `theme` light ↔ dark |
| Power button | `toggleSetting("isExtensionEnabled")` |
| Back button | `setActiveView("main")` |

---

## Unchanged Events

All prior events still active:
- `TimeReporter` heartbeat (15s), visibility, focus, navigation events
- `SearchRefiner` MutationObserver on `document.body`
- `NavigationManager` 1s redirect polling
- Background `chrome.tabs.onRemoved`, `chrome.alarms.onAlarm`
- Storage watch for settings and timeTrackingToday

---

## Known Event Issues

| Issue | Location | Impact |
|-------|----------|--------|
| Video listener leak | `TimeReporter.ensureTrackedVideoListeners` | Duplicate play/pause listeners on navigation |
| Stale settings in observer | `SearchRefiner.observe(settings)` | Search shelves may not update live |
| Focus poll every 1s | `contents/youtube.ts` | CPU usage on idle YouTube tabs |

---

## Event Frequency Summary

| Event | Approximate Frequency |
|-------|----------------------|
| Heartbeat report | Every 15s per YouTube tab |
| Focus/friction check | Every 1s per YouTube tab |
| Bookmark time poll | Every 1s when Bookmarks tab open |
| MutationObserver | High on search pages |
| Audio play hook | Per video play event |
| Storage watch | On every settings/usage write |
| Midnight alarm | Once per day |
