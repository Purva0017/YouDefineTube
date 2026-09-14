# State Management

State storage, synchronization, and reactive updates. Updated for modular popup and new features.

---

## State Categories

| Layer | Mechanism | Scope |
|-------|-----------|-------|
| **Persistent** | `@plasmohq/storage` → `chrome.storage.local` | Cross-context |
| **Session** | `chrome.storage.session` | Per-browser-session |
| **Tab session** | `sessionStorage` | Per YouTube tab |
| **Background cache** | Singleton service caches | Service worker lifetime |
| **Content module** | `let settings` in `youtube.ts` | Per content script |
| **Popup UI** | React `useState` | Popup mount lifetime |
| **Popup persistent UI** | Stored in `settings` | Survives popup close |

---

## New Persistent State

### `settings` — Expanded Fields

UI state now persisted in settings (not local React state):

| Field | Purpose |
|-------|---------|
| `activeTab` | Last popup tab (stats/filters/bookmarks) |
| `isGeneralCategoryOpen` | Blocks section expanded |
| `isSearchCategoryOpen` | Search section expanded |
| `isAudioCategoryOpen` | Audio section expanded |
| `isFocusCategoryOpen` | Focus section expanded |
| `focusSchedules` | Array of schedule configs |
| `audioVolumeBoost` | Volume slider value |
| `audioVocalBoost` | Vocal boost toggle |

### `bookmarks` — New Storage Key

```typescript
// Written by BookmarksView
const [allBookmarks, setAllBookmarks] = useStorage<Record<string, Bookmark[]>>("bookmarks", {})
```

Not yet in `STORAGE_KEYS` constant.

---

## Popup State Architecture (Refactored)

### Before (Monolith)

```
popup.tsx
├── useStorage(settings) + useStorage(todayUsage)
├── useState × 8 (activeView, inputs, section opens, theme)
└── All render logic inline
```

### After (Modular)

```
popup.tsx
├── useSettings() → settings, setSettings, toggleSetting
├── useStorage(todayUsage) → read-only usage
├── useTheme() → isDark, colors
├── useState(activeView) → main | support | donate only
└── Delegates to components/

components/views/MainDashboard
├── useSettings() → reads/writes settings
└── useState(expandedScheduleId) → local UI only

components/views/BookmarksView
├── useStorage("bookmarks") → bookmark data
├── useState(activeTab, currentTime, noteText, searchQuery) → local UI
└── chrome.tabs.query + sendMessage → live video state
```

### Theme Change

**Before:** `system` | `light` | `dark` with `matchMedia` listener

**After:** `light` | `dark` only, toggled in Header:

```typescript
const next = current === "dark" ? "light" : "dark"
setSettings({ theme: next })
```

No OS preference detection.

---

## Content Script State

### Module-Level Settings Cache

```typescript
let settings: Settings = { ...defaultSettings }
```

Updated via `storage.watch`. Passed to managers on each change.

### AudioManager State

```typescript
private audioCtx: AudioContext | null
private sourceMap: WeakMap<HTMLVideoElement, NodeSet>
private settings: Settings | null
```

`WeakMap` auto-cleans when video elements are garbage collected.

### OverlayManager State (Expanded)

```typescript
private dailyLimitAlertEl: HTMLDivElement | null
private homepageMessageEl: HTMLDivElement | null
private focusBlockerEl: HTMLDivElement | null        // NEW
private frictionPromptEl: HTMLDivElement | null      // NEW
private frictionGoalEl: HTMLDivElement | null        // NEW
```

---

## State Synchronization Examples

### Example 1: Enable Vocal Boost

```
1. User toggles in MainDashboard
2. toggleSetting("audioVocalBoost")
3. storage.watch → content script
4. audioManager.apply(settings)
5. All hooked videos rebuild audio graph with EQ chain
```

### Example 2: Focus Schedule Becomes Active

```
1. Clock reaches schedule start time
2. 1s poll: checkFocusAndFriction()
3. isFocusScheduleActive() returns { active: true, schedule }
4. showFocusBlockerAlert() — no storage write needed
5. User changes schedule in popup → immediate re-evaluation via watch
```

### Example 3: Save Bookmark

```
1. BookmarksView polls GET_CURRENT_TIME → currentTime state updated
2. User saves → setAllBookmarks({ ...allBookmarks, [videoId]: [...] })
3. Only popup reads bookmarks — content script unaware
```

---

## State When Extension Off

| State | Behavior |
|-------|----------|
| Settings | Still writable (power toggle) |
| Time tracking | **Still accumulates** |
| Distractions | CSS cleared |
| Audio boost | Disabled (gain reset to 1.0) |
| Overlays | All removed |
| Popup UI | PowerOffView only |
| Bookmarks | Not accessible (no tabs shown) |

---

## Consistency Notes

| Guarantee | Mechanism |
|-----------|-----------|
| Settings defaults | Merge with `defaultSettings` on every read |
| Write serialization | `enqueue()` in TimeTrackingService |
| Focus overlay priority | `checkFocusAndFriction()` logic order |
| Bookmark isolation | Separate storage key, popup-only access |

| Issue | Details |
|-------|---------|
| Time tracking when off | Not gated by `isExtensionEnabled` |
| SearchRefiner stale closure | Observer may use old settings |
| `activeTab` in settings | Mixing UI state with feature config |
