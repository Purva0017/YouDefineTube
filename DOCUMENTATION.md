# YouDefineTube Documentation

**YouDefineTube** is a premium YouTube productivity extension designed to combat binge-watching and minimize distractions through intentional UI control and robust time tracking.

---

## 🚀 Core Features

### 1. Distraction Blocker
The extension provides granular control over distraction-prone YouTube components:
- **Hide Shorts**: Completely removes Shorts shelves from the homepage, sidebar entries, and even redirects direct Shorts URLs to a paused video view to break the scrolling cycle.
- **Hide Recommendations**: Replaces the homepage grid with a high-focus message, encouraging users to search for specific intent rather than passive consumption.
- **UI Filtering**: Hides End Screen suggestions, Comments, Live Chat, and Sidebar related videos.

### 2. Strategic Time Tracking
Uses a sophisticated "Heartbeat" system to categorize usage:
- **Watching**: Time spent with a video active and playing in the foreground.
- **Browsing**: Time spent on homepage, subscriptions, or channel pages.
- **Searching**: Time spent specifically on search result pages.
- **Visibility Aware**: Only tracks time when the tab is visible and the window is in focus.

### 3. Daily Limit Workflow
- **Customizable Goals**: Users set a daily time limit (e.g., 45 minutes).
- **Persistent Alerts**: Once the limit is reached, a high-friction overlay is injected into all YouTube tabs, blocking interaction.
- **Friction Extensions**: Users can request a "5-minute extension" exactly twice per day—providing a buffer to finish a specific video without enabling an indefinite binge.

---

## 🏗️ Architecture

### 1. Content Script (`contents/youtube.ts`)
The primary engine for UI manipulation and data gathering.
- **Style Injection**: Dynamically builds and injects CSS rules based on user settings.
- **Mutation Observer**: Monitors the YouTube SPA (Single Page Application) for navigation and UI updates (e.g., keeping recommendations hidden after a scroll).
- **Time Reporting**: Sends a "Heartbeat" payload to the background script every 15 seconds.

### 2. Background Service Worker (`background.ts`)
The orchestrator for state and enforcement.
- **Persistence**: Manages `historyCache` using `@plasmohq/storage`.
- **Alarms**: Uses `chrome.alarms` to schedule a **Midnight Reset** (00:00).
- **Messaging**: Receives heartbeats from content scripts and broadcasts "Limit Reached" events to all active tabs.

### 3. Settings & Storage (`lib/settings.ts`, `lib/time-tracking.ts`)
- **Settings**: Persistent configuration (e.g., `hideShorts`, `darkTheme`).
- **DailyUsage**: A structured record of the day's total minutes in each category.

---

## 🔄 Lifecycle: The Midnight Reset
To ensure accurate day-to-day tracking, the extension performs a hard reset at **00:00 (Midnight)** local time.
1. An alarm fires in the background.
2. The system checks the current date against the stored "Today" record.
3. If they mismatch, a fresh `DailyUsage` object is created and the "Today" display is cleared.
4. Total history remains preserved in the `historyCache` record.

---

## 🌓 Theming
Developed with a "Premium-First" aesthetic:
- **Automatic**: Respects system preference (Dark/Light).
- **Manual Toggle**: A polished Sun/Moon toggle in the popup header allows for instant overrides.
- **Glassmorphism**: Uses subtle shadows and harmonious color palettes for a high-end feel.

---

## 🛠️ Development & Build

### Prerequisites
- Node.js (v20+)
- pnpm (recommended)

### Commands
```bash
# Start development server
pnpm dev

# Build for Chrome Web Store
pnpm build

# Create a zip package for submission
pnpm package
```

### Manifest
The extension is built on **Manifest V3** and requires:
- `storage`: For persistence.
- `notifications`: For limit alerts.
- `alarms`: For the midnight reset.
- `host_permissions`: Narrowed specifically to `youtube.com` for security.
