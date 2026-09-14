# Important Services

Background services and content-side managers that implement core business logic.

---

## Service Architecture Overview

| Category | Location | Pattern | Count |
|----------|----------|---------|-------|
| **Background Services** | `core/background/` | Singleton | 4 |
| **Content Managers** | `core/contents/` | Instance per tab | 6 |

---

## Background Services

### SettingsService

Unchanged. Settings cache + watch + change listeners.

**Consumers:** `TimeTrackingService` (limit changes)

---

### TimeTrackingService

Unchanged. Heartbeat aggregation, limits, extensions, midnight reset, write queue.

---

### MessageHandler

Handles 5 message types. Bookmark messages (`GET_CURRENT_TIME`, `SEEK_TO_TIME`) are **not** routed here — they are handled in the content script directly.

---

### AlarmHandler

Unchanged. Midnight reset only.

---

## Content Managers

### 1. DistractionManager

**Updated** with grid search mode and improved sidebar hiding.

| Feature | Mechanism |
|---------|-----------|
| Element hiding | `display: none !important` via CSS selectors |
| Grid search | CSS grid on `ytd-search` result containers |
| Sidebar centering | Hides `#secondary`, centers `#primary` on watch pages |

---

### 2. AudioManager (NEW)

**Responsibility:** Real-time audio enhancement on YouTube `<video>` elements.

| Setting | Effect |
|---------|--------|
| `audioVolumeBoost` 100 | Normal volume (gain = 1.0) |
| `audioVolumeBoost` 200 | 2× volume |
| `audioVolumeBoost` 300 | 3× volume (max) |
| `audioVocalBoost` true | Adds highpass + peaking EQ chain before gain |

**Activation conditions:**
```typescript
settings.isExtensionEnabled &&
  (audioVolumeBoost > 100 || audioVocalBoost)
```

**Called from:**
- `loadSettings()` → `audioManager.apply(settings)`
- `watchStorage()` settings change → `audioManager.apply(settings)`
- `initUi()` → `audioManager.init()`

---

### 3. OverlayManager (EXPANDED)

**Responsibility:** All user-facing overlays on YouTube pages.

| Overlay | Priority | Blocks Video |
|---------|----------|-------------|
| Focus blocker | Highest | Yes (pauses) |
| Friction prompt | Medium | Yes (pauses) |
| Daily limit | Medium | Yes (pauses) |
| Goal badge | Low (corner) | No |
| Homepage message | Low (inline) | No |

**Overlay priority in `checkFocusAndFriction()`:**
1. If focus schedule active → show focus blocker, remove friction overlays
2. Else if friction enabled → show prompt/badge
3. Else → remove all friction/focus overlays

---

### 4. TimeReporter

Unchanged. 15-second heartbeats, page state snapshots.

**Does not check `isExtensionEnabled`** — tracks time even when extension is off.

---

### 5. NavigationManager

Unchanged. URL redirects, Shorts handling.

---

### 6. SearchRefiner

Unchanged. DOM shelf tagging for CSS hiding.

**Known issue:** MutationObserver uses stale settings closure.

---

## Content Script Orchestration

### `checkFocusAndFriction()` — `contents/youtube.ts`

New central coordinator for overlay priority:

```
Every 1 second + on navigation + on settings change:
    │
    ├── isFocusScheduleActive(settings)
    │     active → showFocusBlockerAlert, remove friction
    │     inactive → removeFocusBlockerAlert
    │
    └── enableFrictionScreen && !focus active
          ├── session: not prompted → showFrictionPrompt
          ├── session: prompted → showFrictionGoalOverlay
          └── session: dismissed → no overlay
```

### Initialization Order (updated)

```
1. loadSettings()
   ├── distractionManager.apply()
   ├── audioManager.apply()
   ├── overlayManager.updateHomepageMessage()
   └── checkFocusAndFriction()

2. watchStorage()

3. DOMContentLoaded → initUi()
   ├── audioManager.init()
   ├── timeReporter.initialize()
   ├── searchRefiner.observe()
   ├── overlayManager.updateHomepageMessage()
   ├── checkFocusAndFriction()
   ├── yt-navigate-finish listener
   ├── chrome.runtime.onMessage listener (limit + bookmarks)
   └── 1s interval (navigation + focus/friction)
```

---

## Popup Services (React Layer)

### Settings Management

`useSettings()` hook is the single write path for popup settings:

```typescript
toggleSetting("hideShorts")  // flip boolean
setSettings({ audioVolumeBoost: 200 })  // partial update
```

All writes go to `@plasmohq/storage` → propagates to content script via watch.

### Bookmark Service (BookmarksView)

Operates independently of background:

| Operation | Mechanism |
|-----------|-----------|
| Detect video | `chrome.tabs.query` + URL parsing |
| Get playback time | `chrome.tabs.sendMessage(GET_CURRENT_TIME)` |
| Save bookmark | `useStorage("bookmarks")` write |
| Seek to timestamp | `chrome.tabs.sendMessage(SEEK_TO_TIME)` |
| Search bookmarks | Client-side filter on flat bookmark array |

---

## Service Configuration Dependencies

| Service/Manager | Settings Keys Used |
|----------------|-------------------|
| `DistractionManager` | All `hide*`, `gridSearchMode`, `isExtensionEnabled` |
| `AudioManager` | `audioVolumeBoost`, `audioVocalBoost`, `isExtensionEnabled` |
| `OverlayManager` | `enableDailyLimitAlert`, `dailyLimitMinutes`, `hideHomepageRecommendations`, `enableFrictionScreen`, `isExtensionEnabled` |
| `checkFocusAndFriction` | `enableFocusBlocker`, `focusSchedules`, `enableFrictionScreen`, `isExtensionEnabled` |
| `NavigationManager` | `hideShorts`, `hideHomepageRecommendations`, `redirectToSubscriptions`, `isExtensionEnabled` |
| `SearchRefiner` | `hidePeopleAlso*`, `hideExploreMore`, etc., `isExtensionEnabled` |
| `TimeReporter` | *(none — always reports)* |
| `TimeTrackingService` | `enableDailyLimitAlert`, `dailyLimitMinutes` |

---

## Service Interaction Matrix (Updated)

| From ↓ / To → | Background | Content Managers | Popup |
|---------------|:-:|:-:|:-:|
| Popup | via storage | via storage + tab messages | — |
| Background | internal | via storage + broadcast | via storage |
| Content | via messages | direct calls | via storage watch |

**New path:** Popup → Content via `chrome.tabs.sendMessage` (bookmarks only).
