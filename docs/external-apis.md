# External APIs

External integrations, browser APIs, and third-party dependencies. Updated for Web Audio and bookmarks.

---

## New: Web Audio API

Used by `AudioManager` for volume boost and vocal enhancement.

| API | Purpose |
|-----|---------|
| `AudioContext` / `webkitAudioContext` | Create audio processing context |
| `createMediaElementSource(video)` | Tap into video element's audio stream |
| `createGain()` | Volume amplification node |
| `createBiquadFilter()` | Highpass (150Hz) and peaking (2kHz) EQ |
| `audioCtx.resume()` | Resume suspended context after user gesture |

**No permission required** — runs in content script context on YouTube page.

**Limitation:** `createMediaElementSource` can only be called once per video element. If another extension or script already hooked it, `AudioManager` catches the error gracefully.

---

## New: Chrome Tabs API (Bookmarks)

| API | Permission | Usage |
|-----|------------|-------|
| `chrome.tabs.query({ active: true, currentWindow: true })` | `activeTab` | Find current YouTube tab in popup |
| `chrome.tabs.sendMessage(tabId, message)` | host_permissions | GET_CURRENT_TIME, SEEK_TO_TIME |

`activeTab` permission added in UI overhaul — grants temporary access to the active tab when user invokes the extension.

---

## Chrome Extension APIs (Unchanged)

| API | Used By |
|-----|---------|
| `chrome.storage.local` | All contexts via `@plasmohq/storage` |
| `chrome.storage.session` | `TimeTrackingService` live sessions |
| `chrome.runtime.sendMessage` | TimeReporter, OverlayManager |
| `chrome.runtime.onMessage` | MessageHandler, content script |
| `chrome.tabs.sendMessage` | TimeTrackingService broadcast, BookmarksView |
| `chrome.tabs.remove` | MessageHandler |
| `chrome.tabs.onRemoved` | background.ts |
| `chrome.alarms` | Midnight reset |
| `chrome.notifications` | Daily limit alert |

---

## DOM APIs (Content Script)

| API | Used By | Purpose |
|-----|---------|---------|
| `document.querySelector("video")` | TimeReporter, OverlayManager, BookmarksView handler | Video element access |
| `sessionStorage` | Friction screen, NavigationManager | Per-tab ephemeral state |
| `MutationObserver` | SearchRefiner | Watch for new search shelves |
| `navigator.clipboard.writeText` | BookmarksView | Copy timestamp URL |

---

## npm Dependencies

| Package | Version | Status |
|---------|---------|--------|
| `plasmo` | 0.90.5 | Active — build framework |
| `react` / `react-dom` | 18.2.0 | Active — popup UI |
| `@plasmohq/storage` | ^1.15.0 | Active — storage abstraction |
| `zod` | ^4.4.3 | **Installed but unused** — no imports in codebase |

---

## External HTTP URLs (Unchanged)

| URL | Purpose |
|-----|---------|
| Google Forms (bug report, feature request) | Support links in popup |
| Razorpay / PayPal | Donation links |
| `mailto:purvaap17@gmail.com` | Support email |

No programmatic HTTP requests in core extension logic.

---

## APIs NOT Used

| API | Notes |
|-----|-------|
| YouTube Data API | No server-side video access |
| `chrome.commands` | Keyboard shortcut not implemented |
| `chrome.identity` | No OAuth |
| `fetch()` / XHR | No network requests |
| `IndexedDB` | Uses chrome.storage |
| `zod` parse/validate | Dependency present, no usage |

---

## Network Activity Profile

```
Core functionality:     ZERO network requests
User clicks donate:     Browser opens external URL (user-initiated)
User clicks support:    Browser opens Google Form (user-initiated)
Extension update:       Browser store handles (not extension code)
Web Audio processing:   100% local, no network
```

---

## Firefox Compatibility

| Feature | Chrome | Firefox | Notes |
|---------|--------|---------|-------|
| Web Audio API | Yes | Yes | `webkitAudioContext` fallback included |
| `activeTab` | Yes | Yes | |
| `chrome.storage.session` | Yes | May fallback to local | Handled in TimeTrackingService |
| MV3 service worker | Yes | Yes (FF 109+) | |
