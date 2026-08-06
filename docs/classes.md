# Important Classes

Reference for all classes and major React components in the codebase.

---

## Background Service Classes (Singletons)

### `SettingsService` — `core/background/SettingsService.ts`

Unchanged. Caches `settings`, watches storage, notifies listeners.

### `TimeTrackingService` — `core/background/TimeTrackingService.ts`

Unchanged core logic. Time aggregation, daily limits, extensions, midnight reset.

### `MessageHandler` — `core/background/MessageHandler.ts`

Routes 5 message types. **Does not handle** `GET_CURRENT_TIME` or `SEEK_TO_TIME`.

### `AlarmHandler` — `core/background/AlarmHandler.ts`

Handles `midnight-reset` alarm only.

---

## Content Manager Classes

### `DistractionManager` — `core/contents/DistractionManager.ts`

**Updated.** Injects CSS based on settings.

| Setting | CSS Effect |
|---------|-----------|
| `hideShorts` | Hide all `SELECTORS.SHORTS` |
| `hideVideoSidebarRecommendations` | Hide suggestions + **center player layout** |
| `gridSearchMode` | **NEW** — CSS grid on search results page |
| Other hide flags | Same as before |

Grid search mode applies ~100 lines of CSS for column layout, thumbnail sizing, and metadata reordering on `/results` pages.

---

### `AudioManager` — `core/contents/AudioManager.ts` (NEW)

**Purpose:** Boost YouTube video audio via Web Audio API.

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| `audioCtx` | `AudioContext \| null` | Shared audio context |
| `sourceMap` | `WeakMap<HTMLVideoElement, NodeSet>` | Per-video audio graph nodes |
| `settings` | `Settings \| null` | Current settings reference |

#### NodeSet Structure

```typescript
{
  source: MediaElementAudioSourceNode
  gainNode: GainNode
  highpassFilter: BiquadFilterNode   // 150Hz highpass
  peakingFilter: BiquadFilterNode    // 2kHz +6dB peaking
}
```

#### Public Methods

| Method | Description |
|--------|-------------|
| `init()` | Hook all existing `<video>` elements on page |
| `apply(settings)` | Update settings, hook/update all videos |

#### Audio Graph

**Vocal boost OFF:**
```
video → gainNode → destination
```

**Vocal boost ON:**
```
video → highpassFilter(150Hz) → peakingFilter(2kHz,+6dB) → gainNode → destination
```

**Gain:** `audioVolumeBoost / 100` (e.g. 200% → gain of 2.0)

#### Lifecycle

- Hooks videos on `play` event (capture phase)
- Resumes suspended `AudioContext` on click/keydown
- Gracefully catches errors if video already hooked by another script

---

### `OverlayManager` — `core/contents/OverlayManager.ts` (EXPANDED)

Manages five overlay types:

| Overlay | Method | Trigger |
|---------|--------|---------|
| Daily limit | `showDailyLimitAlert()` | Limit reached |
| Homepage message | `updateHomepageMessage()` | Homepage recs hidden |
| Focus blocker | `showFocusBlockerAlert()` | **NEW** — active focus schedule |
| Friction prompt | `showFrictionPrompt()` | **NEW** — first visit with friction on |
| Goal badge | `showFrictionGoalOverlay()` | **NEW** — after friction prompt submitted |

#### Focus Blocker Overlay (NEW)

- Full-screen gradient overlay with schedule name and time window
- Random motivational quote (bedtime vs focus variants)
- "Close this tab" / "Close all YouTube tabs" buttons
- Bedtime detection via regex on schedule name

#### Friction Prompt (NEW)

- Full-screen "Are you sure?" with goal input field
- Submit → stores goal in sessionStorage, shows goal badge
- "Nevermind" → closes tab via `CLOSE_CURRENT_TAB`

#### Goal Badge (NEW)

- Fixed bottom-right floating badge showing user's stated goal
- "Done" button → 2-second countdown → closes tab
- Dismiss (×) → hides badge, sets `ydt_friction_goal_dismissed`

---

### `TimeReporter` — `core/contents/TimeReporter.ts`

Unchanged. **Known bug:** `removeEventListener` uses new arrow functions — listeners leak on navigation.

---

### `NavigationManager` — `core/contents/NavigationManager.ts`

Unchanged. Home redirect, Shorts→watch redirect, pause flags.

---

### `SearchRefiner` — `core/contents/SearchRefiner.ts`

Unchanged. **Known bug:** MutationObserver captures stale `settings` from closure.

---

## Library Functions (Not Classes)

### `isFocusScheduleActive()` — `lib/focus-blocker.ts` (NEW)

```typescript
function isFocusScheduleActive(settings: Settings): {
  active: boolean
  schedule?: FocusSchedule
}
```

Pure function. Evaluates all enabled schedules against current day/time.

**Handles:**
- Same-day windows (09:00–17:00)
- Midnight-spanning windows (23:00–07:00)
- Yesterday's schedule spilling into early morning
- 24-hour blocks (start === end)

---

## React Components

### Popup Orchestrator

#### `IndexPopup` — `popup.tsx` (default export)

Thin shell. Renders Header, tab content, Footer. ~294 lines (down from ~1,238).

---

### `components/popup/`

| Component | Props | Purpose |
|-----------|-------|---------|
| `Header` | `activeView`, `colors`, `isDark` | Branding, theme toggle, power button |
| `Footer` | `setActiveView`, `colors` | Donate / feature / support links |

---

### `components/ui/`

| Component | Purpose |
|-----------|---------|
| `TimerCard` | Today's usage with segmented progress bar |
| `DailyLimitCard` | Limit config with hour/minute steppers |
| `CustomToggle` | Reusable on/off switch (small/medium) |
| `Icons` | SVG icon library (Shorts, Grid, Mic, Volume, Moon, Info, etc.) |

---

### `components/views/`

| Component | Purpose |
|-----------|---------|
| `MainDashboard` | Blocks tab — all settings categories with CRUD for focus schedules |
| `BookmarksView` | Bookmarks tab — save/seek/search timestamp notes |
| `PowerOffView` | Extension disabled state with re-enable button |
| `SupportView` | Troubleshooting + bug report |
| `DonateView` | Razorpay + PayPal |

#### `BookmarksView` Key Behaviors

- Queries `chrome.tabs.query({ active: true, currentWindow: true })`
- Polls `GET_CURRENT_TIME` every 1s when on a video page
- Saves bookmarks to `useStorage("bookmarks")`
- Sends `SEEK_TO_TIME` to jump to timestamp
- Global search across all saved bookmarks
- Copy timestamp URL to clipboard

#### `MainDashboard` Key Behaviors

- Four collapsible categories (state persisted in settings)
- Focus schedule list with inline edit (name, times, days, enable/disable)
- Add/delete schedules
- Audio volume slider (100–300%, step 10)
- Tooltips on audio and focus settings

---

## Custom Hooks

### `useSettings()` — `hooks/useSettings.ts`

```typescript
{
  settings: Settings
  setSettings: (partial) => void
  toggleSetting: (key: keyof Settings) => void
}
```

### `useTheme()` — `hooks/useTheme.ts`

```typescript
{
  isDark: boolean       // settings.theme === "dark"
  colors: ThemeColors  // bg, cardBg, text, subtext, border, inputBg, etc.
}
```

**Note:** No longer reads `prefers-color-scheme`. Theme is explicit light/dark only.

---

## Type Definitions

| Type | File |
|------|------|
| `Settings` | `lib/settings.ts` |
| `FocusSchedule` | `lib/settings.ts` |
| `DailyUsage` | `lib/time-tracking.ts` |
| `TimeTrackingSnapshot` | `lib/time-tracking.ts` |
| `Bookmark` | `components/views/BookmarksView.tsx` |
| `Message` (union) | `lib/messaging.ts` |
