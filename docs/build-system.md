# Build System

Build tooling and packaging. Updated for `zod` dependency.

---

## Toolchain

| Tool | Version | Role |
|------|---------|------|
| Plasmo | 0.90.5 | Extension framework |
| TypeScript | 5.3.3 | Type checking |
| pnpm | 8.x+ | Package manager |
| Node.js | 18.x+ | Runtime |
| Prettier | 3.2.4 | Formatting |

---

## Scripts

```json
{
  "dev": "plasmo dev",
  "build": "plasmo build",
  "package": "plasmo package"
}
```

---

## Production Dependencies

```json
{
  "@plasmohq/storage": "^1.15.0",
  "plasmo": "0.90.5",
  "react": "18.2.0",
  "react-dom": "18.2.0",
  "zod": "^4.4.3"
}
```

`zod` is listed but **not imported** in any source file. Likely added for planned settings validation.

---

## Plasmo File Discovery (Updated)

| Source | Generated Entry |
|--------|----------------|
| `popup.tsx` | Popup action |
| `background.ts` | Service worker |
| `contents/youtube.ts` | Content script |
| `components/**/*.tsx` | Bundled into popup (imported by popup.tsx) |
| `hooks/**/*.ts` | Bundled into popup |
| `assets/*` | Static assets |

Plasmo does not auto-discover `components/` — they are imported by `popup.tsx` and bundled together.

---

## TypeScript Paths

```json
{
  "paths": { "~*": ["./*"] },
  "baseUrl": "."
}
```

All imports use `~/` prefix:

```typescript
import { AudioManager } from "~/core/contents/AudioManager"
import { useSettings } from "~/hooks/useSettings"
import { MainDashboard } from "~/components/views/MainDashboard"
```

---

## Dev vs Production Manifest

| Field | Dev (`chrome-mv3-dev`) | Prod (`chrome-mv3-prod`) |
|-------|------------------------|--------------------------|
| Name | `DEV \| YouDefineTube...` | `YouDefineTube...` |
| CSP localhost | Yes | No |
| HMR proxy | Yes | No |
| Permissions | Includes `activeTab` | Includes `activeTab` |

---

## CI/CD

Unchanged. `.github/workflows/submit.yml` — manual trigger, builds and publishes `chrome-mv3-prod.zip`.

---

## Build Troubleshooting

| Issue | Solution |
|-------|----------|
| New component not found | Ensure it's imported (directly or transitively) from `popup.tsx` |
| Hook import errors | Check `~/hooks/` path alias |
| AudioManager fails in dev | Web Audio requires user gesture to resume context |
| `zod` types not resolving | Run `pnpm install` — it's a direct dependency |
