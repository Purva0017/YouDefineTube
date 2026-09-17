# YouDefineTube - Project Memory & Context

> **Purpose of this document**: This file captures the complete context, architectural breakdown, and discussion history of **YouDefineTube** so that any AI agent or developer can instantly understand the codebase and pick up ongoing work without missing context.

---

## 1. Project Overview

- **Name**: `YouDefineTube: Focus & Limit YouTube`
- **Author**: Purva Patel
- **Repository**: [Purva0017/YouDefineTube](https://github.com/Purva0017/YouDefineTube)
- **Primary Tech Stack**:
  - **Framework**: [Plasmo Framework (v0.90.5)](https://docs.plasmo.com/)
  - **Frontend**: React 18, TypeScript (v5.3.3), Custom CSS-in-JS design system (Light/Dark themes)
  - **Validation & Storage**: Zod (`zod`), `@plasmohq/storage`
  - **Testing**: Vitest (`vitest`), JSDOM (`jsdom`)
  - **Target Browsers**: Chromium-based (Chrome, Edge, Brave) and Firefox (Gecko manifest configured)

### Core Mission
Provide YouTube users with mindful control over their browsing experience:
1. **Eliminate Addictive Distractions**: Hide YouTube Shorts, homepage feed, recommendations sidebar, comments, end screens, live chat, related search cards, and playables.
2. **Time Budgeting & Digital Wellbeing**: Set daily watch limits with notifications, soft/hard blocking overlays, and emergency extensions (+5m).
3. **Focus Schedules & Friction**: Schedule focus/bedtime blocking windows and add intentional friction screens before opening YouTube.
4. **Enhanced Media Experience**: Integrated volume booster (>100%) and vocal frequency equalizer.
5. **Dual UI Access**: Available as a standard browser action popup (`popup.tsx`) AND injected natively into YouTube's top masthead as an inline panel drawer (`HeaderButtonManager.ts` & `InlinePanelManager.tsx`).

---

## 2. Codebase Architecture & Data Flow

The project is cleanly decoupled into three main layers:

```
┌─────────────────────────────────────────────────────────────┐
│                      Popup & Inline UI                      │
│   (ExtensionApp, MainDashboard, TimerCard, DailyLimitCard)  │
└──────────────────────────────┬──────────────────────────────┘
                               │ Reads/Writes (@plasmohq/storage)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                   Background Service Worker                 │
│         (background.ts, TimeTrackingService, Alarms)        │
└──────────────────────────────┬──────────────────────────────┘
                               │ Sends Messages & Watches Storage
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                     Content Scripts                         │
│     (youtube.ts, ContentScriptController, DistractionManager,│
│       DailyLimitOverlay, TimeReporter, InlinePanelManager)  │
└─────────────────────────────────────────────────────────────┘
```

### Key Directories and Files

#### 1. Background Service Worker (`background.ts`, `core/background/`)
- `background.ts`: Entry point initializing `SettingsService`, `TimeTrackingService`, `MessageHandler`, and midnight reset alarms.
- `core/background/TimeTrackingService.ts`:
  - Collects 15-second heartbeats from open YouTube tabs.
  - Distributes usage into three buckets: **Watch** (`watchVideoMs`), **Browse** (`browseMs`), and **Search** (`searchMs`).
  - Evaluates limit triggers via `maybeTriggerDailyLimitAlert()`.
  - Manages extension allowance (`requestExtension()`, granting +5 minutes up to 2 times daily).
  - Triggers desktop Chrome notifications (`chrome.notifications.create`) and broadcasts `MESSAGES.DAILY_LIMIT_REACHED` to content scripts.
- `core/background/MessageHandler.ts`: Listens for extension messages (`REQUEST_EXTENSION`, `CLOSE_CURRENT_TAB`, `CLOSE_ALL_TABS`, etc.).

#### 2. Content Scripts (`contents/`, `core/contents/`)
- `contents/youtube.ts`: Content script entry point executing on `https://www.youtube.com/*` and `https://m.youtube.com/*`.
- `core/contents/ContentScriptController.ts`: Watches `@plasmohq/storage` changes and coordinates all content managers.
- `core/contents/DistractionManager.ts`: Generates and injects surgical CSS rules to hide YouTube elements on the fly.
- `core/contents/TimeReporter.ts`: Checks video playback and URL state every 15s, dispatching heartbeat messages to background.
- `core/contents/overlays/DailyLimitOverlay.ts`: Renders full-screen backdrop modal when limit is exceeded, pauses current video, and offers extension / tab closing actions.
- `core/contents/HeaderButtonManager.ts`: Injects the "YouDefineTube" button into YouTube's top navigation bar (masthead).
- `core/contents/InlinePanelManager.tsx`: Renders the React UI inside a shadow DOM drawer on the YouTube page when the masthead button is clicked.
- `core/contents/NavigationManager.ts`: Automatically handles redirects (e.g., Shorts redirecting to `/feed/subscriptions` or normal watch URLs).

#### 3. Frontend UI (`popup.tsx`, `components/`)
- `popup.tsx`: Mounts `ExtensionApp`.
- `components/ExtensionApp.tsx`: Tabbed navigation (`stats`, `filters`, `bookmarks`) with power-off mode and dark/light theming.
- `components/ui/TimerCard.tsx`: Donut usage circle, current day's spent time, and breakdown bars (Watch/Browse/Search).
- `components/ui/DailyLimitCard.tsx`: Interface to enable/disable daily limit alerts, configure hours/minutes via number steppers, and save changes.

#### 4. Shared State & Utilities (`lib/`)
- `lib/settings.ts`: Source of truth for settings state, defaults, and type definitions.
- `lib/time-tracking.ts`: Time math, date keys, and `DailyUsage` data structures.
- `lib/messaging.ts`: Type-safe message action types (`TIME_TRACKING_REPORT`, `CLOSE_ALL_TABS`, `CLOSE_CURRENT_TAB`, etc.).
- `lib/constants.ts`: Storage keys and YouTube DOM CSS selectors.

---

## 3. Decision History: Removal of Daily Limit Feature

### Core Philosophy Shift
In September 2026, after evaluating the daily limit and blocking overlay UX, the project owner made a definitive product direction decision:
> *"Remove the limiting feature, I want none of it. After deep thought I have decided I don't want to limit the user, I want to make Youtube a better place, add features to it, save people time. Keep the stats which keep track of time but remove the limit feature."*

### Changes Executed
1. **Settings & Types**:
   - Removed `enableDailyLimitAlert` and `dailyLimitMinutes` from `Settings` and `settingsSchema`.
   - Removed `dailyLimitReachedAt` and `extensionsUsed` from `DailyUsage` and `createEmptyDailyUsage`.
   - Removed `getEffectiveDailyLimitMinutes`.
2. **Background Service Worker**:
   - `TimeTrackingService.ts`: Removed `maybeTriggerDailyLimitAlert`, `broadcastDailyLimitAlert`, and `requestExtension`. Kept accurate heartbeat aggregation (Watch, Browse, Search) and midnight resets.
   - `MessageHandler.ts`: Removed `REQUEST_EXTENSION` handler.
3. **Content Scripts & Overlays**:
   - Deleted `DailyLimitOverlay.ts`.
   - `OverlayManager.ts`: Removed `DailyLimitOverlay` references.
   - `ContentScriptController.ts`: Removed `DAILY_LIMIT_REACHED` listener and `TIME_TRACKING_TODAY` storage limit watcher.
4. **UI**:
   - Deleted `DailyLimitCard.tsx`.
   - `ExtensionApp.tsx`: Removed `DailyLimitCard` and the time extension counter card.
   - `TimerCard.tsx`: Reimagined into a clean, modern time-awareness dashboard. Shows total time on YouTube today, a live tracking pill status with glowing live-red dot, a proportional segmented distribution bar (Vivid Rose for Watch, Warm Amber for Browse, and Electric Cyan for Search), 3 metric cards, and mindful focus insights.
   - `WeeklyActivityCard.tsx`: Added 7-day stacked activity chart beneath `TimerCard` in the Stats tab:
     - Shows 7-day stacked bars (Watch/Browse/Search) with auto-proportional scaling.
     - Includes weekly total duration and daily average.
     - Features interactive day selection / hovering with detailed breakdown cards.
   - `MainDashboard.tsx`: Restored to the clean, vertical collapsible list view matching the original design:
     - `▼ GENERAL DISTRACTIONS` (Hide Shorts, Hide Homepage Recommendations with `>` chevron & redirect sub-toggle, Hide Video Sidebar Recommendations, Hide Comments, Hide End Screen, Hide Live Chat, Hide Playables).
     - `▼ SEARCH REFINEMENTS` (Hide 'People also watched', Hide 'People also search for', Hide 'From related searches', Hide 'Channels new to you', Hide 'Explore more').
     - Matched toggle switches: dark charcoal track when off (`#3a3a3c`), vibrant YouTube red track when on (`#cc0000`), with pure white knob.
    - `Bedtime & Focus Mode Accessibility`:
      - Blocker overlay now includes a prominent **"Open Settings / Modify Schedule"** button that opens the inline panel directly over the overlay (using adjusted z-index hierarchy).
      - Blocker overlay also provides a 1-click **"Turn off Bedtime Blocker for now"** action that updates storage and immediately unblocks the screen.
      - Clicking the extension icon in the Chrome browser toolbar (`chrome.action.onClicked`) now dispatches `TOGGLE_INLINE_PANEL` to the active YouTube tab, allowing users to toggle open the popup at any time from the browser bar.
5. **Tests**:
    - Deleted `DailyLimitOverlay.test.ts`.
    - Updated `time-tracking.test.ts` and `parse-settings.test.ts`. All 10 suites (51 tests) pass.

---

## 4. Developer & Testing Instructions

- **Run Dev Server**: `pnpm dev` (runs Parcel via Plasmo)
- **Run Tests**: `pnpm test` (Vitest test suite)
- **Build Extension**: `pnpm build`
- **Package for Stores**: `pnpm package`
