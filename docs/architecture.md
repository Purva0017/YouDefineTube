# Overall Architecture

## Purpose

YouDefineTube is a **client-only browser extension** that modifies the YouTube browsing experience. It operates entirely within the user's browser using three isolated execution contexts:

1. **Popup (UI layer)** — Modular React dashboard with three tabs: Stats, Blocks, and Bookmarks.
2. **Background service worker** — Time tracking aggregation, daily limits, alarms, tab coordination.
3. **Content script** — DOM/CSS manipulation, overlays, audio processing, navigation, and activity reporting.

There is no server-side component. All persistence uses browser storage APIs.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Browser Extension (MV3)                          │
├──────────────────┬────────────────────────┬─────────────────────────────┤
│  POPUP           │  BACKGROUND            │  CONTENT SCRIPT              │
│  popup.tsx       │  background.ts         │  contents/youtube.ts         │
│                  │                        │                              │
│  components/     │  SettingsService       │  DistractionManager (CSS)    │
│  hooks/          │  TimeTrackingService   │  AudioManager (Web Audio)      │
│                  │  MessageHandler        │  OverlayManager (modals)     │
│  Tabs:           │  AlarmHandler          │  NavigationManager           │
│   Stats          │                        │  SearchRefiner               │
│   Blocks         │                        │  TimeReporter (heartbeat)    │
│   Bookmarks      │                        │                              │
└────────┬─────────┴───────────┬────────────┴──────────────┬──────────────┘
         │                     │                           │
         └─────────────────────┼───────────────────────────┘
                               │
                     @plasmohq/storage
                     chrome.storage.local / session
                     chrome.tabs.sendMessage (bookmarks)
```

---

## Architectural Style

| Pattern | Application |
|---------|-------------|
| **Singleton services** | Background: `SettingsService`, `TimeTrackingService`, `MessageHandler`, `AlarmHandler` |
| **Manager classes** | Content: six managers, one per concern |
| **Modular React UI** | Popup split into `components/`, `hooks/`, thin `popup.tsx` orchestrator |
| **Shared library layer** | `lib/` — types, constants, focus-blocker logic, utils |
| **Storage as source of truth** | `@plasmohq/storage` syncs popup, background, content |
| **Message passing** | Content ↔ background for time/limit; popup ↔ content for bookmarks |
| **CSS injection** | Distraction blocking via dynamic `<style>` element |
| **Web Audio API** | `AudioManager` hooks `<video>` elements for boost |
| **Pure schedule logic** | `lib/focus-blocker.ts` — testable, no DOM dependency |

---

## Context 1: Popup (`popup.tsx` + `components/`)

### Structure

```
popup.tsx
├── useSettings() / useTheme()
├── Header (theme, power)
├── Main content (by activeView + activeTab)
│   ├── main + enabled → Stats | Blocks | Bookmarks tabs
│   ├── main + disabled → PowerOffView only
│   ├── support → SupportView
│   └── donate → DonateView
└── Footer (main view only)
```

### Tab Model

| Tab | `settings.activeTab` | Component | Content |
|-----|---------------------|-----------|---------|
| Stats | `"stats"` | `TimerCard`, `DailyLimitCard` | Usage + limits |
| Blocks | `"filters"` | `MainDashboard` | All blocking/audio/focus settings |
| Bookmarks | `"bookmarks"` | `BookmarksView` | Video timestamp notes |

The active tab is **persisted in settings** so it survives popup close/reopen.

### Settings Categories (Blocks Tab)

1. **General Distractions** — Shorts, homepage, sidebar, comments, end screen, playables, live chat
2. **Search Refinements** — Grid layout, shelf hiding
3. **Audio Enhancements** — Volume booster slider, vocal boost toggle
4. **Focus & Mindfulness** — Friction screen, focus schedules (CRUD UI)

---

## Context 2: Background Service Worker

Unchanged core responsibilities:
- Aggregate time tracking heartbeats
- Enforce daily limits + extensions
- Midnight reset alarm
- Tab close cleanup

**Note:** New bookmark messages (`GET_CURRENT_TIME`, `SEEK_TO_TIME`) are handled **in the content script**, not routed through `MessageHandler`.

---

## Context 3: Content Script

### Manager Composition

| Manager | Responsibility |
|---------|---------------|
| `DistractionManager` | CSS injection for hiding + grid search layout |
| `AudioManager` | Web Audio graph: gain + optional vocal EQ filters |
| `OverlayManager` | Daily limit, homepage message, focus blocker, friction UI |
| `NavigationManager` | URL redirects, Shorts handling |
| `SearchRefiner` | DOM tagging for search shelf hiding |
| `TimeReporter` | Activity heartbeats to background |

### New Orchestration: `checkFocusAndFriction()`

Called on init, storage watch, navigation, and every 1 second:

```
checkFocusAndFriction()
    │
    ├── isFocusScheduleActive(settings)?
    │     YES → showFocusBlockerAlert() (blocks YouTube entirely)
    │     NO  → removeFocusBlockerAlert()
    │
    └── enableFrictionScreen?
          YES → showFrictionPrompt() or showFrictionGoalOverlay()
          NO  → remove friction overlays
```

**Priority:** Focus schedule **overrides** friction screen when active.

---

## Feature Domains

### 1. Distraction Blocking (CSS)

`DistractionManager.apply(settings)` generates CSS rules. New in this version:
- **Grid search mode** — CSS grid layout for `/results` pages
- **Sidebar layout fix** — Centers primary player when sidebar hidden

### 2. Audio Enhancement (Web Audio)

`AudioManager` creates an audio graph per `<video>`:

```
video → [highpass 150Hz] → [peaking 2kHz +6dB] → gainNode → destination
         (vocal boost only)                          (volume %)
```

- Volume: `audioVolumeBoost` 100–300%
- Vocal boost: optional speech emphasis chain
- Hooks on `play` event capture; resumes `AudioContext` on user gesture

### 3. Focus Schedules

`lib/focus-blocker.ts` evaluates `focusSchedules[]`:
- Day-of-week matching (`days: number[]`, 0=Sunday)
- Time windows including **midnight span** (e.g. 23:00–07:00)
- When active → full-screen `showFocusBlockerAlert()` overlay

Default schedule: "Bedtime Blocker" 23:00–07:00, every day.

### 4. Friction Screen ("Are You Sure?")

When `enableFrictionScreen` is on:
1. **Prompt overlay** — asks user to state their YouTube goal
2. **Goal badge** — floating bottom-right reminder
3. **Done button** — closes tab after 2s countdown
4. State stored in `sessionStorage` per tab

### 5. Video Bookmarks

`BookmarksView` in popup:
- Uses `chrome.tabs.query` + `activeTab` permission to detect current video
- Polls `GET_CURRENT_TIME` every 1s from content script
- Stores `Record<videoId, Bookmark[]>` in `bookmarks` storage key
- `SEEK_TO_TIME` jumps video to saved timestamp

---

## Data Architecture

### Storage Layers

```
chrome.storage.local (@plasmohq/storage)
├── settings              → Settings (38 fields)
├── timeTrackingToday     → DailyUsage
├── timeTrackingHistory   → Record<date, DailyUsage>
└── bookmarks             → Record<videoId, Bookmark[]>

chrome.storage.session
└── timeTrackingLiveSessions → per-tab live tracking

sessionStorage (per YouTube tab)
├── ydt_friction_*        → friction screen state
└── ydt_from_shorts_*     → Shorts redirect markers
```

---

## Communication Architecture

### Storage-based (declarative)

Settings, usage, bookmarks — any context reads/writes; watchers react.

### Message-based (imperative)

| Direction | Messages | Handler |
|-----------|----------|---------|
| Content → Background | `TIME_TRACKING_REPORT`, `REQUEST_EXTENSION`, `CLOSE_*` | `MessageHandler` |
| Background → Content | `DAILY_LIMIT_REACHED` | `contents/youtube.ts` listener |
| Popup → Content | `GET_CURRENT_TIME`, `SEEK_TO_TIME` | `contents/youtube.ts` listener |

Bookmark messages use `chrome.tabs.sendMessage` from popup to active tab — **not** through background.

---

## Design Trade-offs

| Decision | Rationale | Trade-off |
|----------|-----------|-----------|
| Modular popup components | Maintainability after 1,200-line monolith | More files to navigate |
| Web Audio for boost | Real-time processing on video element | Can fail if another script already hooked audio |
| Focus logic in `lib/` | Pure function, testable | Content script still polls every 1s |
| Bookmarks via tab messages | Needs live video element | Only works when popup open on YouTube tab |
| `activeTab` permission | Query current tab for bookmarks | Requires user gesture context |
| `zod` in dependencies | Added but **not yet used** in code | Dead dependency until validation added |
| Theme: light/dark only | Simplified from system/light/dark | No OS theme sync |

---

## Known Issues (Pre-Phase-1-Fix)

| Issue | Status |
|-------|--------|
| `TimeReporter` listener leak (arrow fn in removeEventListener) | **Not fixed** |
| `SearchRefiner` stale settings in MutationObserver closure | **Not fixed** |
| Time tracking when extension off | **Not fixed** |
| Keyboard shortcut (Ctrl+Shift+Y) | **Not implemented** |
| Timer hidden when extension off | **Fixed** in UI refactor |
| `zod` dependency unused | Present in package.json only |
