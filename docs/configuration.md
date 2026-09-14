# Configuration

All configuration sources for YouDefineTube.

---

## Manifest Configuration (`package.json`)

### Permissions

```json
"permissions": [
  "notifications",
  "alarms",
  "storage",
  "activeTab"
]
```

| Permission | Purpose | Added |
|------------|---------|-------|
| `notifications` | Daily limit alerts | Original |
| `alarms` | Midnight reset | Original |
| `storage` | Settings, usage, bookmarks | Original |
| `activeTab` | Query active tab for bookmarks | **UI overhaul** |

### Host Permissions

```json
"host_permissions": [
  "https://www.youtube.com/*",
  "https://m.youtube.com/*"
]
```

---

## Dependencies

### Production

| Package | Version | Usage |
|---------|---------|-------|
| `plasmo` | 0.90.5 | Extension framework |
| `react` | 18.2.0 | Popup UI |
| `react-dom` | 18.2.0 | Popup rendering |
| `@plasmohq/storage` | ^1.15.0 | Cross-context storage |
| `zod` | ^4.4.3 | **Added but not used in code yet** |

---

## Settings Schema (`lib/settings.ts`)

### New Settings (UI Overhaul)

| Setting | Type | Default | Category |
|---------|------|---------|----------|
| `gridSearchMode` | `boolean` | `false` | Search |
| `audioVolumeBoost` | `number` | `100` | Audio |
| `audioVocalBoost` | `boolean` | `false` | Audio |
| `enableFocusBlocker` | `boolean` | `false` | Focus |
| `focusSchedules` | `FocusSchedule[]` | Bedtime default | Focus |
| `enableFrictionScreen` | `boolean` | `false` | Focus |
| `activeTab` | `"stats"\|"filters"\|"bookmarks"` | `"stats"` | UI |
| `isAudioCategoryOpen` | `boolean` | `true` | UI |
| `isFocusCategoryOpen` | `boolean` | `true` | UI |

### Changed Settings

| Setting | Before | After |
|---------|--------|-------|
| `theme` | `"light" \| "dark" \| "system"` | `"light" \| "dark"` (default: `"dark"`) |

### Removed

| Setting | Notes |
|---------|-------|
| `theme: "system"` | No longer supported; OS preference not read |

---

## Timers (`lib/constants.ts`)

Unchanged:

| Constant | Value | Used By |
|----------|-------|---------|
| `HEARTBEAT` | 15000 ms | `TimeReporter` |
| `TICK` | 600 ms | `TimeReporter` video listener check |
| `RETRY_PAUSE` | 200 ms | `NavigationManager` |
| `MAX_PAUSE_ATTEMPTS` | 30 | `NavigationManager` |

### Additional Hardcoded Timers

| Value | Location | Purpose |
|-------|----------|---------|
| 1000 ms | `contents/youtube.ts` | Navigation + focus/friction polling |
| 1000 ms | `BookmarksView.tsx` | Video time polling |
| 2000 ms | `OverlayManager` goal badge | Countdown before tab close |

---

## Popup UI Configuration

| Property | Value |
|----------|-------|
| Width | 390px |
| Height | 590px |
| Primary color | `#cc0000` |
| Font | `'Inter', system-ui, sans-serif` |
| Main tabs | Stats, Blocks, Bookmarks |
| Volume range | 100–300% (step 10) |
| Max extensions/day | 2 × 5 minutes |

---

## Audio Configuration

| Parameter | Value | Source |
|-----------|-------|--------|
| Highpass frequency | 150 Hz | `AudioManager` hardcoded |
| Highpass Q | 1.0 | `AudioManager` hardcoded |
| Peaking frequency | 2000 Hz | `AudioManager` hardcoded |
| Peaking gain | +6 dB | `AudioManager` hardcoded |
| Peaking Q | 1.0 | `AudioManager` hardcoded |
| Max volume boost | 300% | `MainDashboard` slider max |

---

## Focus Schedule Defaults

```typescript
{
  id: "bedtime",
  name: "Bedtime Blocker",
  enabled: true,
  startTime: "23:00",
  endTime: "07:00",
  days: [0, 1, 2, 3, 4, 5, 6]  // Every day
}
```

Day indices: `0=Sunday, 1=Monday, ..., 6=Saturday`

---

## Bookmarks Storage

| Key | Type | Default |
|-----|------|---------|
| `"bookmarks"` | `Record<string, Bookmark[]>` | `{}` |

Not yet added to `STORAGE_KEYS` in `lib/constants.ts`.

---

## Content Script Config

Unchanged:

```typescript
export const config: PlasmoCSConfig = {
  matches: ["https://www.youtube.com/*", "https://m.youtube.com/*"],
  run_at: "document_start",
  all_frames: false
}
```

---

## Configuration Not Present

| Config | Status |
|--------|--------|
| `chrome.commands` (keyboard shortcuts) | Not configured |
| `options_page` | Not present |
| `.env` files | Not used |
| `zod` schemas | Dependency added, no validation implemented |
| Feature flags | Not implemented |
