# YouDefineTube 📺

A premium browser extension designed to help you regain control over your YouTube experience. **YouDefineTube** combines sleek, distraction-blocking features with professional time-tracking to combat binge-watching and improve focus.

![Extension Preview](https://github.com/Purva0017/YouDefineTube/blob/main/screen.png)

## ✨ Key Features

- **🎯 Distraction Blocker**: Toggle individual components of the YouTube UI:
  - Hide Shorts (Homepage & Sidebar)
  - Remove End Screen video suggestions
  - Disable Comments and Live Chat
  - Hide Homepage Recommendations
- **⏳ Smart Daily Limits**:
  - Set specific daily time goals.
  - **Friction-based alerts**: A persistent overlay prevents further browsing once limits are reached.
  - "Give me 5 more minutes" option (limited to twice per day).
- **📊 Usage Analytics**:
  - **Segmented Progress Bar**: Visualizes time spent **Watching**, **Browsing**, and **Searching**.
  - Accuracy maintained across restarts and multiple tabs.

## 🧠 Technical Challenges & Solutions

*This section is what recruiters actually read to judge your skill level.*

### Challenge: Accurate Time Tracking Across Tabs
**Problem**: Traditional timers stop when a tab is hidden, but users often keep YouTube running in the background or have 10 tabs open at once.
**Solution**: I implemented a "Heartbeat" system using `Plasmo Storage` and `Background Service Workers`. It syncs a global state every second, ensuring that if you have 5 YouTube tabs open, your daily limit only counts 1 second per second, not 5.

### Challenge: Modern UI in a Restricted Environment
**Problem**: Browser extension popups have strict sizing and styling limitations.
**Solution**: I utilized a card-based design with **Vanilla CSS** and **React** to ensure a high-end "iOS-style" feel while keeping the bundle size small for fast loading.

## 🛠️ Tech Stack

- **Core**: [Plasmo Framework](https://docs.plasmo.com) (MV3)
- **Frontend**: React, TypeScript, Tailwind/Vanilla CSS
- **State**: Plasmo Storage (Cross-tab synchronization)

## 🚀 Installation (Internal/Evaluation)

1. Clone the repo: `git clone <repo-url>`
2. Install: `pnpm install`
3. Dev Mode: `pnpm dev`
4. Load the `build/chrome-mv3-dev` folder into Chrome via `chrome://extensions`.

## 📜 License & Copyright

**Proprietary – All Rights Reserved**

Copyright (c) 2026 Purva Patel.

This source code is shared **exclusively for evaluation and recruitment purposes**. No part of this project may be copied, redistributed, or used for commercial purposes without explicit written permission from the author.