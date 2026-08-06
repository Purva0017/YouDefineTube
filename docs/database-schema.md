# Database Schema (Local Storage)

YouDefineTube uses browser storage, not a traditional database. This document describes all persisted data structures.

---

## Storage Architecture

```
chrome.storage.local (@plasmohq/storage)
├── settings
├── timeTrackingToday
├── timeTrackingHistory
└── bookmarks                    ← NEW

chrome.storage.session
└── timeTrackingLiveSessions

sessionStorage (per YouTube tab, not persisted across sessions)
├── ydt_friction_prompted
├── ydt_friction_goal
├── ydt_friction_goal_dismissed
├── ydt_from_shorts_v
└── ydt_from_shorts_ts
```

---

## Table 1: `settings`

**Storage key:** `"settings"`

### Core Distraction Settings

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `hideShorts` | `boolean` | `true` | Hide Shorts everywhere |
| `hideHomepageRecommendations` | `boolean` | `false` | Hide homepage feed |
| `redirectToSubscriptions` | `boolean` | `false` | Redirect `/` to subscriptions |
| `hideVideoSidebarRecommendations` | `boolean` | `false` | Hide "Up next" sidebar |
| `hideComments` | `boolean` | `false` | Hide comments |
| `hideEndScreen` | `boolean` | `true` | Hide end screen suggestions |
| `hideLiveChat` | `boolean` | `false` | Hide live chat |
| `hidePlayables` | `boolean` | `false` | Hide Playables sections |
| `hidePeopleAlsoWatched` | `boolean` | `false` | Hide search shelf |
| `hidePeopleAlsoSearchFor` | `boolean` | `false` | Hide search refinement cards |
| `hideFromRelatedSearches` | `boolean` | `false` | Hide search shelf |
| `hideChannelsNewToYou` | `boolean` | `false` | Hide search shelf |
| `hideExploreMore` | `boolean` | `false` | Hide search shelf |
| `gridSearchMode` | `boolean` | `false` | **NEW** — Grid layout on search results |

### Time Management

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `enableDailyLimitAlert` | `boolean` | `false` | Enable daily limit |
| `dailyLimitMinutes` | `number` | `60` | Daily limit in minutes |

### Audio (NEW)

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `audioVolumeBoost` | `number` | `100` | Volume percentage (100–300) |
| `audioVocalBoost` | `boolean` | `false` | Speech frequency emphasis |

### Focus & Mindfulness (NEW)

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `enableFocusBlocker` | `boolean` | `false` | Enable scheduled blocking |
| `focusSchedules` | `FocusSchedule[]` | See below | Array of schedules |
| `enableFrictionScreen` | `boolean` | `false` | "Are you sure?" prompt |

### FocusSchedule Type

```typescript
interface FocusSchedule {
  id: string           // e.g. "bedtime"
  name: string         // e.g. "Bedtime Blocker"
  enabled: boolean
  startTime: string    // "HH:MM" 24-hour
  endTime: string      // "HH:MM" 24-hour
  days: number[]       // 0=Sun .. 6=Sat
}
```

**Default schedule:**
```json
{
  "id": "bedtime",
  "name": "Bedtime Blocker",
  "enabled": true,
  "startTime": "23:00",
  "endTime": "07:00",
  "days": [0, 1, 2, 3, 4, 5, 6]
}
```

### UI State (Persisted in Settings)

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `theme` | `"light" \| "dark"` | `"dark"` | Popup theme (**system removed**) |
| `isExtensionEnabled` | `boolean` | `true` | Master on/off |
| `activeTab` | `"stats" \| "filters" \| "bookmarks"` | `"stats"` | **NEW** — Last popup tab |
| `isGeneralCategoryOpen` | `boolean` | `true` | Blocks section expanded |
| `isSearchCategoryOpen` | `boolean` | `true` | Search section expanded |
| `isAudioCategoryOpen` | `boolean` | `true` | **NEW** — Audio section expanded |
| `isFocusCategoryOpen` | `boolean` | `true` | **NEW** — Focus section expanded |

---

## Table 2: `bookmarks` (NEW)

**Storage key:** `"bookmarks"` (no `STORAGE_KEYS` constant yet)

**Type:** `Record<string, Bookmark[]>`

```typescript
interface Bookmark {
  id: string           // Unique ID (generated on save)
  timestamp: number    // Video position in seconds
  note: string         // User note text
  createdAt: number    // Unix timestamp (ms)
  videoTitle: string   // Video title at time of save
}
```

**Example:**
```json
{
  "dQw4w9WgXcQ": [
    {
      "id": "bm_abc123",
      "timestamp": 142,
      "note": "Key explanation of the chorus",
      "createdAt": 1722867600000,
      "videoTitle": "Never Gonna Give You Up"
    }
  ]
}
```

**Written by:** `BookmarksView` via `useStorage`

**Retention:** Indefinite (no cleanup)

---

## Table 3: `timeTrackingToday`

Unchanged from prior version. See previous documentation for `DailyUsage` schema.

| Field | Type | Default |
|-------|------|---------|
| `date` | `string` | `YYYY-MM-DD` |
| `totalYoutubeMs` | `number` | `0` |
| `watchVideoMs` | `number` | `0` |
| `browseMs` | `number` | `0` |
| `searchMs` | `number` | `0` |
| `dailyLimitReachedAt` | `number \| null` | `null` |
| `extensionsUsed` | `number` | `0` |
| `updatedAt` | `number` | `Date.now()` |

---

## Table 4: `timeTrackingHistory`

`Record<string, DailyUsage>` — historical daily records. No automatic pruning.

---

## Table 5: `timeTrackingLiveSessions`

`Record<string, LiveSession>` in `chrome.storage.session`.

```typescript
type LiveSession = TimeTrackingSnapshot & { lastTickAt: number }
```

---

## Session Storage (Ephemeral)

| Key | Set By | Cleared When |
|-----|--------|--------------|
| `ydt_friction_prompted` | Friction prompt submit | Tab close |
| `ydt_friction_goal` | Friction prompt submit | Tab close |
| `ydt_friction_goal_dismissed` | Goal badge dismiss | Tab close |
| `ydt_from_shorts_v` | Shorts redirect | Tab close or revert |
| `ydt_from_shorts_ts` | Shorts redirect | Tab close or revert |

---

## Entity Relationship Diagram

```
settings ──────────────────────────────────────────┐
    │                                               │
    ├── activeTab, theme, category open states      │
    ├── focusSchedules[] ──► isFocusScheduleActive()│
    ├── audioVolumeBoost / audioVocalBoost          │
    └── enableFrictionScreen                        │
                                                    │
timeTrackingHistory ──► timeTrackingToday           │
timeTrackingLiveSessions ──► aggregates into above  │
                                                    │
bookmarks[videoId] ──► Bookmark[]  (independent)    │
```

---

## Migration Notes

- **Theme:** `"system"` option removed; existing users with `theme: "system"` will keep the string but `useTheme` treats unknown as dark via `settings?.theme || defaultSettings.theme`
- **New fields:** All new settings merge with `defaultSettings` on read — forward compatible
- **Bookmarks:** New storage key; no migration needed (starts empty)
- **No version field** in any storage document
