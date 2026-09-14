# Folder Structure

The YouDefineTube source code lives in the `YouDefineTube/` directory. This document describes every directory and file in the project as of the modular UI overhaul.

```
YouDefineTube/
├── .github/
│   └── workflows/
│       └── submit.yml              # CI workflow for Chrome Web Store submission
├── assets/                         # Static images bundled into the extension
│   ├── chat.png
│   ├── icon.png
│   ├── paypal-qr.png
│   ├── razorpay-logo.png
│   └── razorpay-qr.png
├── components/                     # React UI components (popup refactor)
│   ├── popup/
│   │   ├── Header.tsx              # Logo, back button, theme toggle, power button
│   │   └── Footer.tsx              # Support / feature request / report nav
│   ├── ui/
│   │   ├── CustomToggle.tsx        # Reusable toggle switch
│   │   ├── DailyLimitCard.tsx      # Daily limit configuration card
│   │   ├── Icons.tsx               # Inline SVG icon components
│   │   └── TimerCard.tsx           # Today's usage stats + progress bar
│   └── views/
│       ├── MainDashboard.tsx       # Blocks tab — all distraction/audio/focus settings
│       ├── BookmarksView.tsx       # Bookmarks tab — save/seek/search timestamps
│       ├── DonateView.tsx          # Razorpay / PayPal donation view
│       ├── PowerOffView.tsx        # Extension disabled screen
│       └── SupportView.tsx         # Troubleshooting + bug report
├── contents/
│   └── youtube.ts                  # Content script entry point
├── core/
│   ├── background/
│   │   ├── AlarmHandler.ts
│   │   ├── MessageHandler.ts
│   │   ├── SettingsService.ts
│   │   └── TimeTrackingService.ts
│   └── contents/
│       ├── AudioManager.ts         # Web Audio API volume/vocal boost
│       ├── DistractionManager.ts
│       ├── NavigationManager.ts
│       ├── OverlayManager.ts       # Daily limit, focus, friction overlays
│       ├── SearchRefiner.ts
│       └── TimeReporter.ts
├── docs/                           # Technical documentation (this folder)
├── hooks/
│   ├── useSettings.ts              # useStorage wrapper + toggleSetting helper
│   └── useTheme.ts                 # Theme colors derived from settings
├── lib/
│   ├── constants.ts                # Storage keys, timers, CSS selectors
│   ├── focus-blocker.ts            # isFocusScheduleActive() schedule logic
│   ├── messaging.ts                # Message type definitions
│   ├── settings.ts                 # Settings type, FocusSchedule, defaults
│   ├── time-tracking.ts            # DailyUsage, date utilities
│   └── utils.ts                    # formatDuration, formatMinutes, formatTimeStr
├── temp/
│   └── .tsx                        # Scratch file (not part of runtime)
├── background.ts                   # Service worker bootstrap
├── popup.tsx                       # Popup entry — thin orchestrator (~294 lines)
├── test.ts                         # Ad-hoc test script
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── .prettierrc.mjs
├── BUILD.md
├── DOCUMENTATION.md
├── LICENSE.md
├── README.md
└── description.txt
```

---

## Directory Details

### `components/`

The popup was refactored from a single 1,200+ line `popup.tsx` into modular React components.

| Path | Purpose |
|------|---------|
| `components/popup/Header.tsx` | Top bar: branding, theme toggle (light/dark), global power button |
| `components/popup/Footer.tsx` | Bottom nav: donate, feature request, support |
| `components/ui/TimerCard.tsx` | Segmented usage progress (watch / browse / search) |
| `components/ui/DailyLimitCard.tsx` | Daily limit hours/minutes inputs + enable toggle |
| `components/ui/CustomToggle.tsx` | Small/medium toggle switch |
| `components/ui/Icons.tsx` | All SVG icons (Shorts, Grid, Mic, Volume, Moon, etc.) |
| `components/views/MainDashboard.tsx` | **Blocks** tab — distractions, search, audio, focus schedules |
| `components/views/BookmarksView.tsx` | **Bookmarks** tab — timestamp notes, seek, global search |
| `components/views/PowerOffView.tsx` | Shown when `isExtensionEnabled === false` |
| `components/views/SupportView.tsx` | Troubleshooting steps + bug report link |
| `components/views/DonateView.tsx` | Razorpay + PayPal donation UI |

### `hooks/`

| File | Exports | Purpose |
|------|---------|---------|
| `useSettings.ts` | `settings`, `setSettings`, `toggleSetting` | Wraps `useStorage<Settings>` |
| `useTheme.ts` | `isDark`, `colors` | Derives theme palette from `settings.theme` |

### `lib/`

| File | Exports | Purpose |
|------|---------|---------|
| `settings.ts` | `Settings`, `FocusSchedule`, `defaultSettings` | Full preference schema (38 fields) |
| `focus-blocker.ts` | `isFocusScheduleActive()` | Evaluates if any focus schedule is active now |
| `utils.ts` | `formatDuration`, `formatMinutes`, `formatTimeStr` | Shared formatting helpers |
| `time-tracking.ts` | `DailyUsage`, date utilities | Time tracking data model |
| `messaging.ts` | `MESSAGES`, message types | 7 message types |
| `constants.ts` | `STORAGE_KEYS`, `TIMERS`, `SELECTORS` | App-wide constants |

### `core/contents/`

| File | Class | New/Changed |
|------|-------|-------------|
| `AudioManager.ts` | `AudioManager` | **New** — Web Audio API hook for video elements |
| `OverlayManager.ts` | `OverlayManager` | **Expanded** — focus blocker, friction prompt, goal badge |
| `DistractionManager.ts` | `DistractionManager` | **Updated** — grid search mode, sidebar layout CSS |
| `TimeReporter.ts` | `TimeReporter` | Unchanged structure |
| `NavigationManager.ts` | `NavigationManager` | Unchanged |
| `SearchRefiner.ts` | `SearchRefiner` | Unchanged |

### Root-Level Source Files

#### `popup.tsx` (~294 lines)

Thin orchestrator. Responsibilities:
- Tab switcher: **Stats** | **Blocks** | **Bookmarks** (`settings.activeTab`)
- Routes to view components
- Global CSS (tooltips, range sliders, category headers)
- Hides stats/bookmarks when extension is off (shows `PowerOffView` only)

#### `background.ts` (32 lines)

Unchanged bootstrap — initializes four background singletons.

---

## Storage Keys (Runtime)

Defined in `lib/constants.ts` plus ad-hoc keys:

| Key | Constant | Written By |
|-----|----------|------------|
| `settings` | `STORAGE_KEYS.SETTINGS` | Popup via `useSettings` |
| `timeTrackingToday` | `STORAGE_KEYS.TIME_TRACKING_TODAY` | Background + popup |
| `timeTrackingHistory` | `STORAGE_KEYS.TIME_TRACKING_HISTORY` | Background |
| `timeTrackingLiveSessions` | `STORAGE_KEYS.LIVE_SESSIONS` | Background (session storage) |
| `bookmarks` | *(no constant yet)* | `BookmarksView` via `useStorage` |

---

## Session Storage Keys (Per Tab)

Used by content script for friction and Shorts navigation:

| Key | Purpose |
|-----|---------|
| `ydt_friction_prompted` | User submitted friction goal this session |
| `ydt_friction_goal` | Stored goal text |
| `ydt_friction_goal_dismissed` | User dismissed goal badge |
| `ydt_from_shorts_v` | Video ID when redirected from Shorts |
| `ydt_from_shorts_ts` | Timestamp of Shorts redirect |

---

## Build Output (not in source control)

```
build/
├── chrome-mv3-dev/        # Development build (hot reload, DEV | prefix)
├── chrome-mv3-prod/       # Production Chrome build
├── chrome-mv3-prod.zip
├── firefox-mv3-prod/
└── firefox-mv3-prod.zip
```

---

## Path Alias

The `~` prefix maps to project root via `tsconfig.json`:

```typescript
import { AudioManager } from "~/core/contents/AudioManager"
import { useSettings } from "~/hooks/useSettings"
```
