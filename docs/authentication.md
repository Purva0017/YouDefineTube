# Authentication

## Overview

YouDefineTube has **no authentication system**. It is a single-user, local-only browser extension that operates entirely within the user's browser without any server-side identity management.

---

## Why No Authentication

| Factor | Explanation |
|--------|-------------|
| **Architecture** | Client-only extension with no backend server |
| **Data model** | All data stored in browser local storage, scoped to the browser profile |
| **User model** | One user per browser profile — the OS/browser handles identity |
| **Privacy design** | Explicitly local-first; no data transmitted to external servers |
| **Scope** | Extension modifies YouTube UI and tracks time locally |

---

## Security Model

Instead of authentication, YouDefineTube relies on the browser's built-in security boundaries:

### Extension Isolation

```
┌─────────────────────────────────────────────────┐
│              Browser Profile                     │
│  ┌───────────────────────────────────────────┐  │
│  │         YouDefineTube Extension            │  │
│  │  ┌─────────┐ ┌──────────┐ ┌────────────┐ │  │
│  │  │ Popup   │ │Background│ │  Content   │ │  │
│  │  │         │ │ Worker   │ │  Script    │ │  │
│  │  └────┬────┘ └────┬─────┘ └─────┬──────┘ │  │
│  │       └──────────┬┘              │        │  │
│  │                  ▼               │        │  │
│  │         chrome.storage.local     │        │  │
│  │         chrome.storage.session   │        │  │
│  └───────────────────────────────────────────┘  │
│                                                  │
│  Other extensions CANNOT access this storage     │
│  Other websites CANNOT access this storage       │
└─────────────────────────────────────────────────┘
```

### Permission Boundaries

| Permission | Scope | Security Implication |
|------------|-------|---------------------|
| `storage` | Extension's own storage only | Data isolated per extension ID |
| `alarms` | Extension's own alarms | Cannot affect other extensions |
| `notifications` | Extension's own notifications | Cannot spoof other extensions |
| `host_permissions: youtube.com` | Content script injection on YouTube only | Cannot access other websites |

### Content Script Isolation

- Content scripts share the DOM with the host page (YouTube) but run in an isolated JavaScript world
- YouTube JavaScript cannot access extension variables or storage
- Extension cannot access YouTube's cookies or authenticated session directly

---

## YouTube Authentication

YouDefineTube does **not** interact with YouTube's authentication system:

| Aspect | Status |
|--------|--------|
| YouTube login | Not managed by extension |
| YouTube cookies | Not read or modified |
| YouTube API keys | Not used |
| Google OAuth | Not implemented |
| YouTube account data | Not accessed |

The extension operates on whatever YouTube session the user already has in their browser. It does not know or care whether the user is logged in.

---

## Data Access Control

### Who Can Read Extension Data

| Actor | Can Access? | Mechanism |
|-------|-------------|-----------|
| Extension popup | Yes | `useStorage` hook |
| Extension background | Yes | `@plasmohq/storage` |
| Extension content script | Yes | `@plasmohq/storage` |
| YouTube website JS | No | Isolated execution context |
| Other extensions | No | Separate storage namespace |
| External websites | No | No network transmission |
| Extension developer | No | No telemetry or remote access |

### Who Can Write Extension Data

| Actor | Can Write? | Keys |
|-------|------------|------|
| Popup UI | Yes | `settings`, `timeTrackingToday` (partial) |
| Background worker | Yes | `timeTrackingHistory`, `timeTrackingToday`, `timeTrackingLiveSessions` |
| Content script | No direct writes | Reads via storage watch only |
| External actors | No | — |

---

## Extension Enable/Disable as Access Control

The closest thing to an authorization gate is `settings.isExtensionEnabled`:

```typescript
isExtensionEnabled: boolean  // default: true
```

When `false`:
- All distraction blocking CSS is cleared
- Overlays are removed
- Navigation redirects stop
- Search refinements stop
- Popup shows "Extension is Off" screen

**Note:** Time tracking continues regardless of this flag. The background worker does not check `isExtensionEnabled` before processing time reports.

---

## Multi-Profile Behavior

Each browser profile maintains independent extension data:

| Browser Profile | Extension Data |
|----------------|---------------|
| Profile A | Settings A, Usage A |
| Profile B | Settings B, Usage B |
| Incognito (if enabled) | Separate storage (if extension allowed in incognito) |

There is no cross-profile sync unless the browser's sync feature replicates `chrome.storage.sync` (the extension uses `chrome.storage.local`, which is **not synced**).

---

## Threat Model

### In Scope

| Threat | Mitigation |
|--------|-----------|
| YouTube DOM changes breaking selectors | CSS-based hiding; no security impact |
| Malicious YouTube page trying to read extension data | Isolated JS context prevents access |
| User disabling extension | `isExtensionEnabled` gate |
| Storage corruption | Defaults merged on read |

### Out of Scope

| Threat | Reason |
|--------|--------|
| Multi-user access control | Single-user local extension |
| API authentication | No API exists |
| Data encryption at rest | Browser storage is OS-profile-protected |
| Remote access | No remote connectivity |
| CSRF/XSS against extension | No web server |
| Session hijacking | No sessions |

---

## Future Authentication Considerations

If the extension were to add cloud sync or multi-device support, these would be needed:

1. **User identity** — OAuth or email/password via a backend
2. **API authentication** — JWT or API keys for sync endpoints
3. **Data encryption** — Encrypt usage data before cloud storage
4. **Consent flow** — Privacy policy update for data transmission

None of these exist in the current codebase.

---

## Compliance Notes

| Regulation | Applicability |
|------------|---------------|
| **GDPR** | Minimal — no personal data collected or transmitted |
| **CCPA** | Minimal — no data sold or shared |
| **Firefox data collection** | Declared as `"none"` in manifest `data_collection_permissions` |
| **Chrome Web Store policies** | Permissions limited to stated functionality |

From `package.json`:
```json
"data_collection_permissions": {
  "required": ["none"]
}
```

From `description.txt`:
> "YouDefineTube does not collect, store, or transmit any personal data. All settings and usage data stay in your browser's local storage."
