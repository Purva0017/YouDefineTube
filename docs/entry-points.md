# Entry Points

Application entry points and bootstrap sequences. Updated for modular popup.

---

## Entry Point Overview

| Entry Point | File | Context |
|-------------|------|---------|
| Popup UI | `popup.tsx` + `components/` | Extension popup |
| Service Worker | `background.ts` | Background |
| Content Script | `contents/youtube.ts` | YouTube pages |

---

## 1. Popup Entry Point

### Default Export

```typescript
export default IndexPopup  // popup.tsx
```

### Component Tree

```
IndexPopup
├── <style> global CSS (tooltips, sliders, category headers)
├── <div> container (390×590)
│   ├── Header (theme, power, branding/back)
│   ├── Content area
│   │   ├── support → SupportView
│   │   ├── donate → DonateView
│   │   └── main
│   │       ├── disabled → PowerOffView
│   │       └── enabled
│   │           ├── Tab bar (Stats | Blocks | Bookmarks)
│   │           └── Tab content
│   │               ├── stats → TimerCard + DailyLimitCard
│   │               ├── filters → MainDashboard
│   │               └── bookmarks → BookmarksView
│   └── Footer (main view only)
```

### Hooks Used

```typescript
const { settings, setSettings } = useSettings()    // hooks/useSettings.ts
const [todayUsage] = useStorage(...)               // time tracking read-only
const { isDark, colors } = useTheme()             // hooks/useTheme.ts
const [activeView, setActiveView] = useState(...)  // main | support | donate
```

### Key Difference from Previous Version

- **Before:** Single 1,238-line file with inline components
- **After:** ~294-line orchestrator delegating to `components/` and `hooks/`
- **Tab state persisted** in `settings.activeTab`
- **Timer hidden** when extension off (only PowerOffView shown)

---

## 2. Service Worker Entry Point

Unchanged. See prior documentation.

```
initializeBackground()
  → SettingsService.initialize()
  → TimeTrackingService.initialize()
  → MessageHandler.initialize()
  → AlarmHandler.initialize()
  → chrome.tabs.onRemoved listener
```

---

## 3. Content Script Entry Point

### Manager Instances (updated)

```typescript
const distractionManager = new DistractionManager()
const timeReporter = new TimeReporter()
const overlayManager = new OverlayManager()
const navigationManager = new NavigationManager()
const searchRefiner = new SearchRefiner()
const audioManager = new AudioManager()          // NEW
```

### Bootstrap (updated)

```
initializeContentScript()
  ├── loadSettings()
  │     ├── distractionManager.apply()
  │     ├── audioManager.apply()               // NEW
  │     ├── overlayManager.updateHomepageMessage()
  │     └── checkFocusAndFriction()            // NEW
  ├── watchStorage()
  └── DOMContentLoaded → initUi()
        ├── audioManager.init()                // NEW
        ├── timeReporter.initialize()
        ├── searchRefiner.observe()
        ├── checkFocusAndFriction()            // NEW
        ├── yt-navigate-finish listener (+ checkFocusAndFriction)
        ├── chrome.runtime.onMessage listener
        │     ├── DAILY_LIMIT_REACHED
        │     ├── GET_CURRENT_TIME             // NEW
        │     └── SEEK_TO_TIME                 // NEW
        └── setInterval(1s): navigation + checkFocusAndFriction
```

### New Helper Functions in `youtube.ts`

| Function | Purpose |
|----------|---------|
| `checkFocusAndFriction()` | Evaluate focus schedule + friction screen state |
| `showGoalOverlay(goal)` | Show friction goal badge after prompt |

---

## Plasmo Configuration

Unchanged:

```typescript
export const config: PlasmoCSConfig = {
  matches: ["https://www.youtube.com/*", "https://m.youtube.com/*"],
  run_at: "document_start",
  all_frames: false
}
```
