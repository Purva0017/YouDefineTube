# API Routes (Messaging Protocol)

YouDefineTube has **no HTTP API**. Communication uses the Chrome Extension Messaging API and shared storage.

---

## Message Type Constants

```typescript
export const MESSAGES = {
  TIME_TRACKING_REPORT: "YDT_TIME_TRACKING_REPORT",
  DAILY_LIMIT_REACHED: "YDT_DAILY_LIMIT_REACHED",
  REQUEST_EXTENSION: "YDT_REQUEST_EXTENSION",
  CLOSE_ALL_TABS: "YDT_CLOSE_ALL_TABS",
  CLOSE_CURRENT_TAB: "YDT_CLOSE_CURRENT_TAB",
  GET_CURRENT_TIME: "YDT_GET_CURRENT_TIME",    // NEW
  SEEK_TO_TIME: "YDT_SEEK_TO_TIME"              // NEW
}
```

---

## Background-Routed Messages

Handled by `MessageHandler` in the service worker.

### 1. `YDT_TIME_TRACKING_REPORT`

**Direction:** Content → Background

| Field | Type |
|-------|------|
| `payload.pageType` | `YoutubePageType` |
| `payload.videoId` | `string \| null` |
| `payload.isVideoPlaying` | `boolean` |
| `payload.isDocumentVisible` | `boolean` |
| `payload.isWindowFocused` | `boolean` |

**Response:** `{ ok: true }`

---

### 2. `YDT_DAILY_LIMIT_REACHED`

**Direction:** Background → Content (broadcast to all YouTube tabs)

**Payload:** `{ limitMinutes: number, extensionsUsed: number }`

---

### 3. `YDT_REQUEST_EXTENSION`

**Direction:** Content → Background

**Response (success):** `{ ok: true, extensionsUsed: number }`

**Response (failure):** `{ ok: false, error: "No extensions left" }`

---

### 4. `YDT_CLOSE_ALL_TABS`

**Direction:** Content → Background

Closes all tabs matching YouTube URLs.

**Response:** `{ ok: true }`

---

### 5. `YDT_CLOSE_CURRENT_TAB`

**Direction:** Content → Background

**Response:** `{ ok: true }`

Also used by friction screen "Nevermind" and focus blocker overlays.

---

## Content-Script-Only Messages (NEW)

Handled directly in `contents/youtube.ts` — **not** routed through `MessageHandler`.

### 6. `YDT_GET_CURRENT_TIME`

**Direction:** Popup → Content (via `chrome.tabs.sendMessage`)

**Sender:** `BookmarksView` — polls every 1 second when on a YouTube video tab.

**Request:**
```typescript
{ type: "YDT_GET_CURRENT_TIME" }
```

**Response:**
```typescript
{ time: number | null }  // video.currentTime in seconds, or null
```

**Implementation:**
```typescript
const video = document.querySelector("video")
sendResponse({ time: video ? video.currentTime : null })
```

---

### 7. `YDT_SEEK_TO_TIME`

**Direction:** Popup → Content (via `chrome.tabs.sendMessage`)

**Sender:** `BookmarksView` — when user clicks a saved bookmark timestamp.

**Request:**
```typescript
{
  type: "YDT_SEEK_TO_TIME",
  payload: { time: number }  // seconds
}
```

**Side effects:**
- Sets `video.currentTime = payload.time`
- Calls `video.play()` (errors swallowed)

**No response** returned.

---

## Message Flow Diagram (Updated)

```
┌─────────────┐     TIME_TRACKING_REPORT      ┌──────────────┐
│ TimeReporter│ ─────────────────────────────►│ MessageHandler│
└─────────────┘                               │      │        │
                                              │      ▼        │
┌─────────────┐     REQUEST_EXTENSION         │ TimeTracking  │
│ OverlayMgr  │ ─────────────────────────────►│   Service     │
└─────────────┘                               └──────────────┘
                                                      │
                              DAILY_LIMIT_REACHED     │
                                                      ▼
┌─────────────┐                               ┌──────────────┐
│ OverlayMgr  │ ◄─────────────────────────────│  broadcast   │
└─────────────┘                               └──────────────┘

┌─────────────┐   GET_CURRENT_TIME / SEEK     ┌──────────────┐
│ BookmarksView│ ────────────────────────────►│ youtube.ts   │
│  (popup)    │ ◄────────────────────────────│  listener    │
└─────────────┘                               └──────────────┘
         (bypasses background entirely)
```

---

## Storage API (Declarative Data Layer)

### Key: `settings`

See [database-schema.md](./database-schema.md) for full schema (38 fields).

### Key: `bookmarks` (NEW)

```typescript
Record<string, Bookmark[]>  // keyed by YouTube video ID

interface Bookmark {
  id: string
  timestamp: number      // seconds into video
  note: string
  createdAt: number      // Unix ms
  videoTitle: string
}
```

**Written by:** `BookmarksView` via `useStorage("bookmarks", {})`

**Read by:** `BookmarksView` only

---

## Chrome API Usage for Bookmarks

| API | Permission | Usage |
|-----|------------|-------|
| `chrome.tabs.query({ active: true, currentWindow: true })` | `activeTab` | Detect current YouTube tab in popup |
| `chrome.tabs.sendMessage(tabId, message)` | host_permissions | Send GET_CURRENT_TIME / SEEK_TO_TIME |

**Note:** `activeTab` was added to manifest in the UI overhaul commit.

---

## External URLs (unchanged)

| URL | Purpose |
|-----|---------|
| `https://forms.gle/Nb5e5Cbuvuz9ukkDA` | Bug report |
| `https://forms.gle/uexgYsXNMYVr8Fs48` | Feature request |
| Razorpay / PayPal URLs | Donations |
| `mailto:purvaap17@gmail.com` | Support |

---

## TypeScript Message Union

```typescript
export type Message =
  | TimeTrackingReportMessage
  | DailyLimitReachedMessage
  | ExtensionRequestMessage
  | CloseTabsMessage
  | CloseCurrentTabMessage
  | GetCurrentTimeMessage
  | SeekToTimeMessage
```

`GetCurrentTimeMessage` and `SeekToTimeMessage` are typed but only handled in the content script listener, not in `MessageHandler`.
