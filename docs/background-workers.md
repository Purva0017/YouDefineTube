# Background Workers

Service worker architecture. Largely unchanged — bookmark messages bypass the background.

---

## Service Worker Bootstrap

Unchanged. See prior documentation for full initialization sequence.

```
initializeBackground()
  → SettingsService.initialize()
  → TimeTrackingService.initialize()
  → MessageHandler.initialize()    // 5 message types only
  → AlarmHandler.initialize()
  → chrome.tabs.onRemoved listener
```

---

## Messages NOT Handled by Background

These are handled directly in the content script (`contents/youtube.ts`):

| Message | Reason |
|---------|--------|
| `GET_CURRENT_TIME` | Needs direct DOM access to `<video>` |
| `SEEK_TO_TIME` | Needs direct DOM access to `<video>` |

Popup sends these via `chrome.tabs.sendMessage` directly to the content script, bypassing the service worker entirely.

---

## Background Message Routing (Unchanged)

| Message | Handler |
|---------|---------|
| `TIME_TRACKING_REPORT` | `TimeTrackingService.handleReport()` |
| `REQUEST_EXTENSION` | `TimeTrackingService.requestExtension()` |
| `CLOSE_ALL_TABS` | `chrome.tabs.remove()` all YouTube tabs |
| `CLOSE_CURRENT_TAB` | `chrome.tabs.remove(sender.tab.id)` |
| Unknown | `{ ok: false, error }` |

`CLOSE_CURRENT_TAB` is also triggered by:
- Daily limit overlay
- Focus blocker overlay
- Friction "Nevermind" button
- Friction goal "Done" button (after countdown)

---

## New Features That Don't Use Background

| Feature | Runs In | Why |
|---------|---------|-----|
| Audio boost | Content (`AudioManager`) | Web Audio API needs video element |
| Focus schedules | Content (`checkFocusAndFriction`) | Evaluated client-side every 1s |
| Friction screen | Content (`OverlayManager`) | DOM overlays + sessionStorage |
| Bookmarks | Popup + Content | Tab messages for video time |
| Grid search mode | Content (`DistractionManager`) | CSS injection |

The background worker's role has **not expanded** — it still only handles time tracking, limits, and tab closing.

---

## Storage Operations (Unchanged)

Background writes: `timeTrackingHistory`, `timeTrackingToday`, `timeTrackingLiveSessions`

Background reads: `settings` (via SettingsService cache)

Background does **not** read or write `bookmarks`.

---

## Resource Usage

| Resource | Impact of New Features |
|----------|----------------------|
| CPU | No change — audio/focus run in content script |
| Memory | No change — background caches same size |
| Storage | Bookmarks add ~100 bytes per saved note (popup only) |
| Network | Still zero |
