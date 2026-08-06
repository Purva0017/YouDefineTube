# YouDefineTube — Technical Documentation

This documentation covers the **YouDefineTube** browser extension codebase. YouDefineTube is a Manifest V3 browser extension built with the [Plasmo Framework](https://docs.plasmo.com/), React, and TypeScript. It helps users reduce YouTube distractions, set daily time limits, track usage, boost audio, manage focus schedules, and save video bookmarks.

All core data is stored locally in the browser. There is no backend server, no database, and no user authentication.

**Last updated:** Reflects commit `8fb43fe` — modular popup UI, audio enhancements, focus schedules, friction screen, and bookmarks.

---

## Documentation Index

| Document | Description |
|----------|-------------|
| [architecture.md](./architecture.md) | High-level system architecture, design patterns, and component responsibilities |
| [folder-structure.md](./folder-structure.md) | Complete directory layout and file purposes |
| [entry-points.md](./entry-points.md) | Application entry points and bootstrap sequences |
| [runtime-flow.md](./runtime-flow.md) | End-to-end runtime flows for all major features |
| [dependency-graph.md](./dependency-graph.md) | Module dependency relationships and import graph |
| [classes.md](./classes.md) | Important classes, singletons, and their methods |
| [services.md](./services.md) | Background services and content-side managers |
| [api-routes.md](./api-routes.md) | Chrome extension messaging protocol (no HTTP API) |
| [database-schema.md](./database-schema.md) | Local storage schema and data models |
| [authentication.md](./authentication.md) | Authentication and authorization (none — local-only extension) |
| [background-workers.md](./background-workers.md) | Service worker, alarms, and background processing |
| [state-management.md](./state-management.md) | State storage, synchronization, and reactive updates |
| [event-flow.md](./event-flow.md) | Events, listeners, observers, and message passing |
| [external-apis.md](./external-apis.md) | External URLs, Chrome APIs, Web Audio API, and third-party integrations |
| [build-system.md](./build-system.md) | Build tooling, CI/CD, and packaging |
| [configuration.md](./configuration.md) | Configuration files, manifest, permissions, and defaults |
| [testing-framework.md](./testing-framework.md) | Testing setup and current test coverage |

---

## Quick Reference

| Property | Value |
|----------|-------|
| **Package name** | `you-define-tube` |
| **Version** | `1.1.0` |
| **Framework** | Plasmo 0.90.5 |
| **UI** | React 18.2.0 (modular components) |
| **Language** | TypeScript 5.3.3 |
| **Package manager** | pnpm |
| **Manifest** | MV3 (Chrome + Firefox) |
| **Target sites** | `https://www.youtube.com/*`, `https://m.youtube.com/*` |

---

## Architecture at a Glance

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         Browser Extension                                 │
├────────────────────┬─────────────────────────┬────────────────────────────┤
│   popup.tsx        │    background.ts         │   contents/youtube.ts      │
│   (React UI)       │   (Service Worker)       │   (Content Script)         │
│                    │                          │                            │
│  components/       │  SettingsService         │  DistractionManager        │
│  hooks/            │  TimeTrackingService     │  TimeReporter              │
│  Stats|Blocks|     │  MessageHandler          │  OverlayManager            │
│  Bookmarks tabs    │  AlarmHandler            │  NavigationManager         │
│                    │                          │  SearchRefiner             │
│                    │                          │  AudioManager              │
└─────────┬──────────┴────────────┬────────────┴─────────────┬──────────────┘
          │                       │                          │
          └───────────────────────┼──────────────────────────┘
                                  │
                        @plasmohq/storage
                        chrome.storage.local / session
```

---

## Feature Summary (Current)

| Area | Features |
|------|----------|
| **Distraction blocking** | Shorts, homepage, sidebar, comments, end screen, playables, live chat, search shelves |
| **Search** | Grid layout mode, shelf hiding by title |
| **Time tracking** | Watch / browse / search buckets, daily limits, 5-min extensions |
| **Audio** | Volume booster (100–300%), vocal boost via Web Audio API |
| **Focus** | Scheduled blockers (e.g. bedtime), friction "Are you sure?" prompt + goal badge |
| **Bookmarks** | Timestamped notes per video, seek-to-timestamp, search across bookmarks |
| **UI** | Tabbed popup (Stats / Blocks / Bookmarks), dark/light theme, power on/off |

---

## Related Project Documentation

- `README.md` — Product overview and installation
- `DOCUMENTATION.md` — Brief internal architecture guide (may be outdated)
- `BUILD.md` — Mozilla reviewer build instructions
- `description.txt` — Chrome Web Store listing text
