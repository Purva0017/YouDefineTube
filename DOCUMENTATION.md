# YouDefineTube Architecture & Execution Flow

Welcome to the internal workings of **YouDefineTube**. This guide explains how the code is organized and how data flows through the extension.

---

## 🏗️ High-Level Architecture

YouDefineTube is built on the **Plasmo Framework** using React. It follows a classic three-part extension architecture:

### 1. The Dashboard (UI) — [popup.tsx](file:///d:/IPD%20Project/26-10-25/plasmo/you-define-tube/popup.tsx)
*   **Role**: The control center where users toggle distractions and see their usage stats.
*   **Tech**: React + Tailwind-style CSS-in-JS.
*   **Action**: When you click a switch, it writes a value to `@plasmohq/storage`.

### 2. The Background Worker (Brain) — [background.ts](file:///d:/IPD%20Project/26-10-25/plasmo/you-define-tube/background.ts)
*   **Role**: A persistent script that runs in the background. It doesn't have a UI.
*   **Responsibilities**:
    *   **Time Calculation**: Receives "heartbeats" from active YouTube tabs and updates the daily usage counters.
    *   **Limits**: Checks if the user has exceeded their `dailyLimitMinutes`.
    *   **Alarms**: Sets a Chrome Alarm (`midnight-reset`) to clear usage stats every night at 12:00 AM.
    *   **Notifications**: Triggers the system-level Chrome notification when a limit is reached.

### 3. The Content Script (Executioner) — [contents/youtube.ts](file:///d:/IPD%20Project/26-10-25/plasmo/you-define-tube/contents/youtube.ts)
*   **Role**: The script that actually lives inside the YouTube webpage.
*   **Responsibilities**:
    *   **Element Hiding**: Injects CSS rules to `display: none` things like Shorts, Comments, and Sidebar Suggestions.
    *   **DOM Monitoring**: Uses a `MutationObserver` to watch for newly loaded content (like search results) and hides them on-the-fly.
    *   **Usage Tracking**: Monitors the `<video>` element and page visibility, sending a "heartbeat" to the Background worker every 15 seconds.

---

## 🔄 Execution Flows

### A. The "Hide Feature" Flow
1.  **User Action**: Toggle "Hide Shorts" in the Popup.
2.  **Storage**: The `popup.tsx` saves `{ hideShorts: true }` to storage.
3.  **Sync**: The `youtube.ts` content script is "watching" storage. It immediately triggers `updateStyle()`.
4.  **Injection**: New CSS rules are generated and injected into the `<head>` of the YouTube page. Shorts disappear instantly without a page refresh.

### B. The "Daily Limit" Flow
1.  **Monitoring**: Every 15s, `youtube.ts` tells `background.ts`: *"The user is currently watching a video."*
2.  **Calculation**: Background adds 15s to the `totalYoutubeMs` counter in storage.
3.  **Check**: Background compares `totalYoutubeMs` against `dailyLimitMinutes`.
4.  **Alert**: If usage > limit, Background sends a message: `DAILY_LIMIT_REACHED`.
5.  **UI Feedback**: 
    *   **Browser**: A system notification appears.
    *   **Page**: `youtube.ts` receives the message and injects a "Daily Limit Reached" overlay on top of the YouTube video.

### C. The "Midnight Reset" Flow
1.  **Scheduling**: When the extension starts, `background.ts` calculates when the next midnight is and sets a `chrome.alarms` timer.
2.  **Trigger**: At 12:00 AM, the alarm fires.
3.  **Reset**: Background clears the `todayUsage` storage and creates a fresh entry for the new date.

---

## 📂 Key Files to Explore First

1.  **[lib/settings.ts](file:///d:/IPD%20Project/26-10-25/plasmo/you-define-tube/lib/settings.ts)**: The "Source of Truth" for what settings exist and their default values. Start here to see the data structure.
2.  **[background.ts](file:///d:/IPD%20Project/26-10-25/plasmo/you-define-tube/background.ts)**: Read `maybeTriggerDailyLimitAlert()` to see how the limit logic works.
3.  **[contents/youtube.ts](file:///d:/IPD%20Project/26-10-25/plasmo/you-define-tube/contents/youtube.ts)**: Read `buildCss()` to see the surgical selectors used to block YouTube elements.
