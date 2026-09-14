# YouDefineTube — Manual Test Plan

Use this checklist to verify the extension end-to-end on **Chrome** (primary) and optionally **Firefox**.  
Build/load the extension from `pnpm dev` or `pnpm build` before testing.

**How to use this document**

1. Load the unpacked extension from `build/chrome-mv3-dev` (dev) or `build/chrome-mv3-prod` (production build).
2. Open [https://www.youtube.com](https://www.youtube.com).
3. Click the **YouDefineTube** button in the YouTube header (top-right) to open the panel.
4. Work through each row in order (or by section).
5. Fill in the **Result** column with notes: `Pass`, `Fail`, screenshots, bugs, browser version, etc.

**Suggested annotation format in Result column**

```
Pass — worked as expected (Chrome 131)
Fail — redirect did not fire; still on home feed
Blocked — could not test (no live stream available)
```

---

## 0. Prerequisites & setup

| ID | Category | Test case | Steps | Expected result | Result |
|----|----------|-----------|-------|-----------------|--------|
| 0.1 | Setup | Extension loads | Install/load unpacked extension; check `chrome://extensions` | Extension appears with no errors; enabled | |
| 0.2 | Setup | YouTube content script | Open youtube.com; open DevTools → no repeated extension errors in console | No critical errors on page load | |
| 0.3 | Setup | Header button visible | On youtube.com, look at top-right masthead | YouDefineTube icon/button is visible | |
| 0.4 | Setup | Panel opens | Click header button | Panel opens anchored near button; does not break YouTube layout | |
| 0.5 | Setup | Panel closes | Click outside panel or close (×) if shown | Panel closes; YouTube remains usable | |
| 0.6 | Setup | Toolbar icon | Click extension icon in browser toolbar (no popup) | Focuses existing YouTube tab or opens youtube.com | |

---

## 1. Panel shell & navigation

| ID | Category | Test case | Steps | Expected result | Result |
|----|----------|-----------|-------|-----------------|--------|
| 1.1 | UI | Default tab on fresh install | Open panel with extension enabled | Lands on last-used tab or **Stats** by default | |
| 1.2 | UI | Tab switching | Click Stats → Blocks → Bookmarks | Each tab loads correct content; active tab is visually highlighted | |
| 1.3 | UI | Tab persistence | Switch to Blocks; close panel; reopen | Still on **Blocks** tab | |
| 1.4 | UI | Scroll isolation | Open Blocks (long content); scroll to bottom; keep scrolling | Panel scroll stops at end; **YouTube page behind does not scroll** | |
| 1.5 | UI | Footer — Support | Click **Support** in footer | Donate/support view opens (verify which view your build routes to) | |
| 1.6 | UI | Footer — Feature Request | Click **Feature Request** | Google Form opens in new tab | |
| 1.7 | UI | Footer — Report Issue | Click **Report Issue** | Support/troubleshooting view opens | |
| 1.8 | UI | Back navigation | From Support/Donate view, click **Back** | Returns to main panel view | |
| 1.9 | UI | Theme toggle | Toggle light ↔ dark in header | Panel colors update; readable in both modes | |
| 1.10 | UI | Theme persistence | Set light mode; close panel; reopen | Light mode persists | |

---

## 2. Extension power state

| ID | Category | Test case | Steps | Expected result | Result |
|----|----------|-----------|-------|-----------------|--------|
| 2.1 | Power | Turn extension off | Header → set **Off** | Power-off view shown; stats/blocks/bookmarks hidden | |
| 2.2 | Power | Off state on YouTube | With extension off, browse YouTube | Distraction blocks, friction, focus blocker, audio boost **not** applied | |
| 2.3 | Power | Turn extension on | Click **Turn on YouDefineTube** or toggle **On** | Main UI returns; features apply again | |
| 2.4 | Power | On/off persistence | Toggle off; refresh YouTube; reopen panel | Still off until turned back on | |

---

## 3. Stats tab — time tracking & daily limit

| ID | Category | Test case | Steps | Expected result | Result |
|----|----------|-----------|-------|-----------------|--------|
| 3.1 | Stats | Timer displays | Open Stats tab | "Today on YouTube" shows duration (may be 0 on fresh day) | |
| 3.2 | Stats | Usage ring | Watch a video 2–3 min; reopen Stats | Total time and % ring increase | |
| 3.3 | Stats | Segment breakdown | Watch video, browse home, run a search | Watch / Browse / Search segments update accordingly | |
| 3.4 | Stats | Set daily limit | Set limit to e.g. **0h 5m**; click **Save daily limit** | Limit saves; timer shows "of 5m daily limit" | |
| 3.5 | Stats | Limit alert toggle | Enable **Show alert when limit is reached** | Setting persists after panel close | |
| 3.6 | Stats | Limit reached overlay | Set very low limit; use YouTube until exceeded | Daily limit overlay appears on YouTube (if alert enabled) | |
| 3.7 | Stats | Extension counter | Change daily limit twice in one day | "Limit changes today" shows **2 / 2** after second change | |
| 3.8 | Stats | Limit change resets counter | Save a new limit from Daily Limit card | `extensionsUsed` resets (counter may drop) | |
| 3.9 | Stats | Midnight reset | (Optional, or simulate next day) | Usage resets for new local date | |

---

## 4. Blocks tab — quick presets

| ID | Category | Test case | Steps | Expected result | Result |
|----|----------|-----------|-------|-----------------|--------|
| 4.1 | Presets | Focus preset | Click **Focus** | Multiple block toggles turn on (Shorts, Home, Sidebar, Comments, End Cards, Playables, Friction) | |
| 4.2 | Presets | Clean Feed preset | Click **Clean Feed** | Shorts, Home, Sidebar, End Cards enabled per preset | |
| 4.3 | Presets | Clean Search preset | Click **Clean Search** | All search-cleanup options enabled | |
| 4.4 | Presets | Minimal preset | Click **Minimal** | Block-related settings reset to defaults | |

---

## 5. Blocks tab — distraction shields

Toggle each on **youtube.com**, refresh if needed, and verify the UI/behavior on the page.

| ID | Category | Test case | Steps | Expected result | Result |
|----|----------|-----------|-------|-----------------|--------|
| 5.1 | Blocks | Shorts | Enable **Shorts** | Shorts shelf/tab hidden; visiting `/shorts/...` redirects or pauses per extension logic | |
| 5.2 | Blocks | Home Feed | Enable **Home Feed** | Homepage recommendations hidden or replaced with focus message | |
| 5.3 | Blocks | Redirect in tile | With Home Feed on, use footer toggle **Redirect to Subscriptions** | Visiting `/` redirects to `/feed/subscriptions` | |
| 5.4 | Blocks | Redirect off | Turn off redirect toggle; visit `/` | Stays on home (recommendations still hidden if Home Feed on) | |
| 5.5 | Blocks | Sidebar | Enable **Sidebar** on a watch page | Suggested videos sidebar hidden | |
| 5.6 | Blocks | Comments | Enable **Comments** on watch page | Comment section hidden | |
| 5.7 | Blocks | End Cards | Enable **End Cards**; play video to end | End-screen cards/overlays hidden | |
| 5.8 | Blocks | Playables | Enable **Playables** | Playables sections hidden on home/browse | |
| 5.9 | Blocks | Live Chat | Enable **Live Chat** on a live stream | Live chat panel hidden | |
| 5.10 | Blocks | Toggle off | Disable each block after testing | YouTube UI element returns | |
| 5.11 | Blocks | Extension off overrides | Enable blocks, then turn extension **Off** | All blocks stop applying | |

---

## 6. Blocks tab — search cleanup

Run searches on YouTube with each option enabled.

| ID | Category | Test case | Steps | Expected result | Result |
|----|----------|-----------|-------|-----------------|--------|
| 6.1 | Search | Grid Layout | Enable **Grid Layout**; search any term | Results use compact grid layout | |
| 6.2 | Search | People Watched | Enable; search | "People also watched" shelf hidden | |
| 6.3 | Search | Also Search | Enable; search | "People also search for" hidden | |
| 6.4 | Search | Related | Enable; search | Related searches hidden | |
| 6.5 | Search | New Channels | Enable; search | "Channels new to you" hidden | |
| 6.6 | Search | Explore More | Enable; search | "Explore more" rows hidden | |

---

## 7. Blocks tab — audio boost

| ID | Category | Test case | Steps | Expected result | Result |
|----|----------|-----------|-------|-----------------|--------|
| 7.1 | Audio | Vocal Boost | Enable **Vocal Boost**; play speech-heavy video | Voices sound clearer (subjective) | |
| 7.2 | Audio | Volume Booster | Set slider to **200%**; play video | Audio louder than 100% baseline | |
| 7.3 | Audio | Volume at 100% | Set slider back to **100%** | Normal volume restored | |
| 7.4 | Audio | Off when extension off | Disable extension with boost on | Boost no longer applied | |

---

## 8. Blocks tab — focus & mindfulness

| ID | Category | Test case | Steps | Expected result | Result |
|----|----------|-----------|-------|-----------------|--------|
| 8.1 | Focus | Friction Screen | Enable **Friction Screen**; open new YouTube tab/session | Prompt asks for goal before browsing | |
| 8.2 | Focus | Friction goal | Enter a goal and confirm | Goal badge/overlay shown; session behavior per design | |
| 8.3 | Focus | Friction dismiss | Dismiss/complete friction flow | Overlay removed; can browse | |
| 8.4 | Focus | Schedules enable | Enable **Schedules** | Schedule settings section appears below tiles | |
| 8.5 | Focus | Add schedule | Click **Add schedule**; set name, times, days | New schedule saved in list | |
| 8.6 | Focus | Edit schedule | Expand schedule; change name/times/days | Changes persist | |
| 8.7 | Focus | Schedule toggle | Disable individual schedule via toggle | That schedule no longer blocks | |
| 8.8 | Focus | Active schedule blocks | Set schedule for **current** day/time; refresh YouTube | Focus blocker overlay appears | |
| 8.9 | Focus | Midnight span | Schedule 23:00–07:00; test at 01:00 and 12:00 | Active overnight; inactive midday | |
| 8.10 | Focus | Delete schedule | Delete a schedule | Removed from list | |
| 8.11 | Focus | Focus overrides friction | Active schedule + friction enabled | Focus blocker takes precedence | |

---

## 9. Bookmarks tab

Test on a **watch page** (`/watch?v=...`).

| ID | Category | Test case | Steps | Expected result | Result |
|----|----------|-----------|-------|-----------------|--------|
| 9.1 | Bookmarks | Active video detected | Open panel on watch page → Bookmarks | Shows active video title and current timestamp | |
| 9.2 | Bookmarks | Add bookmark | Enter note; click **Add Bookmark at [time]** | Bookmark appears in list with correct timestamp | |
| 9.3 | Bookmarks | Seek from bookmark | Click timestamp badge on a bookmark | Video seeks to that time | |
| 9.4 | Bookmarks | Copy link | Click copy/share on bookmark | Time-coded URL copied; paste confirms `?t=` or `youtu.be` | |
| 9.5 | Bookmarks | Delete bookmark | Delete a bookmark | Removed from list | |
| 9.6 | Bookmarks | Search bookmarks | Add multiple bookmarks; use search | Filters by note/time | |
| 9.7 | Bookmarks | Empty state | On video with no bookmarks | Friendly empty state shown | |
| 9.8 | Bookmarks | Not on watch page | Open Bookmarks on home or non-video page | "Not Watching" state; global bookmarks list if any exist | |
| 9.9 | Bookmarks | Persistence | Add bookmark; close panel; reopen | Bookmark still saved | |

---

## 10. Support & donate views

| ID | Category | Test case | Steps | Expected result | Result |
|----|----------|-----------|-------|-----------------|--------|
| 10.1 | Support | Troubleshooting list | Open Report Issue / Support view | Steps list readable | |
| 10.2 | Support | Report bug link | Click **Report Bug** | Google Form opens | |
| 10.3 | Support | Email link | Click support email | Mail client or copy target works | |
| 10.4 | Donate | Razorpay | Open Support footer → donate flow; click Razorpay | Payment page opens | |
| 10.5 | Donate | PayPal | Click PayPal | Payment page opens | |
| 10.6 | Donate | QR codes | View QR images | QR codes render correctly | |

---

## 11. Regression & edge cases

| ID | Category | Test case | Steps | Expected result | Result |
|----|----------|-----------|-------|-----------------|--------|
| 11.1 | Regression | SPA navigation | Toggle a block; navigate home → watch → search without full reload | Blocks still apply after `yt-navigate-finish` | |
| 11.2 | Regression | Multiple YouTube tabs | Open 2 YouTube tabs; use extension in one | No crashes; settings sync across tabs | |
| 11.3 | Regression | Settings sync | Change setting in panel; switch tab | YouTube page updates without manual refresh | |
| 11.4 | Edge | Rapid toggle | Rapidly toggle same block 10× | No UI glitches; final state correct | |
| 11.5 | Edge | Panel resize | Resize browser window with panel open | Panel repositions; remains usable | |
| 11.6 | Edge | Escape key | Open panel; press **Esc** | Panel closes | |
| 11.7 | Edge | Mobile YouTube | (Optional) Test on m.youtube.com | Extension behaves or degrades gracefully | |

---

## 12. Automated test cross-check

After manual testing, run automated tests to verify pure logic:

```bash
cd YouDefineTube
pnpm test
```

| Automated suite | What it covers | Manual overlap |
|-----------------|----------------|----------------|
| `tests/lib/utils.test.ts` | Time formatting | Stats display labels |
| `tests/lib/time-tracking.test.ts` | Date keys, midnight | Daily reset logic |
| `tests/lib/focus-blocker.test.ts` | Schedule active windows | Section 8 focus tests |
| `tests/lib/theme.test.ts` | Theme tokens | Section 1 theme toggle |
| `tests/lib/scroll-isolation.test.ts` | Scroll bleed fix | Test 1.4 |
| `tests/components/getYouTubeVideoId.test.ts` | URL parsing | Bookmarks on various URL shapes |

---

## Sign-off

| Tester | Date | Browser(s) | Build (dev/prod) | Version | Notes |
|--------|------|------------|------------------|---------|-------|
| | | | | 1.1.0 | |
