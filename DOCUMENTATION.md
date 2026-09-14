# YouDefineTube Architecture & Execution Flow

Welcome to the internal workings of **YouDefineTube**. This guide explains how the code is organized and how data flows through the extension.

---

## 🏗️ High-Level Architecture

YouDefineTube is built on the **Plasmo Framework** using React. It follows a classic three-part extension architecture:

### 1. The Dashboard (UI) — [popup.tsx](file:///d:/IPD%20Project/26-10-25/plasmo/you-define-tube/popup.tsx)
*   **Role**: The control center where users toggle distractions and see their usage stats.
*   **Tech**: React + Tailwind-style CSS-in-JS.
*   **Action**: When you click a switch, it writes a value to `@plasmohq/storage`.

### 2. The Background Worker (Brain) — [background.ts](file:///home/purva-patel/Purva/YouDefineTube/background.ts)
*   **Role**: A persistent script that runs in the background. It doesn't have a UI.
*   **Responsibilities**:
    *   **Time Calculation**: Receives "heartbeats" from active YouTube tabs and aggregates daily usage across Watch, Browse, and Search.
    *   **Alarms**: Sets a Chrome Alarm (`midnight-reset`) to archive and reset usage stats every night at 12:00 AM.

### 3. The Content Script (Executioner) — [contents/youtube.ts](file:///home/purva-patel/Purva/YouDefineTube/contents/youtube.ts)
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

### B. The "Time Tracking & Stats" Flow
1.  **Monitoring**: Every 15s, `TimeReporter.ts` inside `youtube.ts` tells `background.ts`: whether the user is actively watching a video, browsing, or searching.
2.  **Calculation**: Background allocates elapsed time to `totalYoutubeMs`, `watchVideoMs`, `browseMs`, and `searchMs`.
3.  **UI Feedback**: In the extension popup under the **Stats** tab, `TimerCard` visualizes the active time spent today along with a proportional breakdown of Watch, Browse, and Search activities.

### C. The "Midnight Reset" Flow
1.  **Scheduling**: When the extension starts, `background.ts` calculates when the next midnight is and sets a `chrome.alarms` timer.
2.  **Trigger**: At 12:00 AM, the alarm fires.
3.  **Reset**: Background clears the `todayUsage` storage and creates a fresh entry for the new date.

---

## 📂 Key Files to Explore First

1.  **[lib/settings.ts](file:///home/purva-patel/Purva/YouDefineTube/lib/settings.ts)**: The "Source of Truth" for what settings exist and their default values. Start here to see the data structure.
2.  **[core/background/TimeTrackingService.ts](file:///home/purva-patel/Purva/YouDefineTube/core/background/TimeTrackingService.ts)**: Read how tab heartbeats are collected, categorized, and persisted.
3.  **[contents/youtube.ts](file:///home/purva-patel/Purva/YouDefineTube/contents/youtube.ts)**: Read how content scripts inject focus modifications into the YouTube DOM.
