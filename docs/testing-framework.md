# Testing Framework

Testing setup and recommendations. Updated for new modules.

---

## Current State

**No formal testing framework configured.**

| Aspect | Status |
|--------|--------|
| Test runner | Not installed |
| Test files | None (`test.ts` is ad-hoc only) |
| CI test step | None |
| `zod` validation | Dependency added, not implemented |

---

## High-Value Test Targets (New Code)

### `lib/focus-blocker.ts` — Highest Priority

Pure function, no DOM dependency. Easy to unit test.

```typescript
// Suggested test cases for isFocusScheduleActive()
- Same-day window: 09:00-17:00, current 12:00 → active
- Before window: 09:00-17:00, current 08:00 → inactive
- Midnight span: 23:00-07:00, current 01:00 → active
- Midnight span: 23:00-07:00, current 12:00 → inactive
- Wrong day: schedule on Mon, current Sunday → inactive
- Disabled schedule → inactive
- enableFocusBlocker=false → inactive
- isExtensionEnabled=false → inactive
- 24-hour block: start===end → always active
```

### `lib/utils.ts`

```typescript
// formatTimeStr("23:00") → "11:00 PM"
// formatTimeStr("07:00") → "7:00 AM"
// formatDuration(3720000) → "1h 2m"
```

### `getYouTubeVideoId()` in BookmarksView

```typescript
// /watch?v=abc → "abc"
// /shorts/abc → "abc"
// youtu.be/abc → "abc"
// invalid URL → null
```

---

## Components Worth Testing

| Component | Approach | Priority |
|-----------|----------|----------|
| `useSettings` toggleSetting | React Testing Library | Medium |
| `useTheme` colors | RTL + mock storage | Low |
| `MainDashboard` schedule CRUD | RTL integration | Medium |
| `BookmarksView` save/delete | RTL + mock chrome.tabs | Medium |
| `AudioManager` | Mock AudioContext | Hard |
| `OverlayManager` | jsdom DOM tests | Hard |

---

## Known Bugs to Test (Still Present)

| Bug | Test |
|-----|------|
| TimeReporter listener leak | Count event listeners after N navigations |
| SearchRefiner stale settings | Toggle setting, add DOM shelf, verify attribute |
| Time tracking when off | Disable extension, verify no reports sent |

---

## Suggested Test Setup

```bash
pnpm add -D vitest @vitest/coverage-v8 jsdom @testing-library/react
```

```json
// package.json
"scripts": {
  "test": "vitest",
  "test:coverage": "vitest --coverage"
}
```

Start with `lib/focus-blocker.test.ts` and `lib/utils.test.ts` — highest ROI, zero mocking needed.

---

## Manual Testing Checklist (Updated)

### New Features

- [ ] Volume booster: slider 100→300%, audio gets louder on YouTube
- [ ] Vocal boost toggle: speech sounds clearer on tutorial videos
- [ ] Grid search mode: search results display in grid layout
- [ ] Focus schedule: set schedule for current time → blocker overlay appears
- [ ] Focus schedule midnight span: 23:00-07:00 works across midnight
- [ ] Friction prompt: enable → opening YouTube shows "Are you sure?"
- [ ] Friction goal badge: submit goal → badge appears bottom-right
- [ ] Friction "Done": badge countdown → tab closes
- [ ] Bookmarks: save note at timestamp → appears in list
- [ ] Bookmarks: click timestamp → video seeks to position
- [ ] Bookmarks: search across all saved bookmarks
- [ ] Tab persistence: close popup on Blocks tab → reopen → still on Blocks
- [ ] Power off: only PowerOffView shown, no stats/tabs

### Regression

- [ ] All original distraction toggles still work
- [ ] Daily limit + extensions still work
- [ ] Shorts redirect still works
- [ ] Midnight reset still works
