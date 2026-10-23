# Kigumi Studio - Agent Guide

Visual theme builder for Web Awesome CSS custom properties.

## Guard Rails - NEVER

- NEVER use `className` on `<wa-*>` elements. Always `class`.
- NEVER use `declare module 'react'`. Always `declare global`.
- NEVER add external state libraries (Redux, Zustand, Jotai).
- NEVER modify the existing `ThemeContext`. Use the separate `StudioContext`.
- NEVER modify files in `src/` (CLI source). Only `docs/src/`.
- NEVER modify existing `docs/src/components/ui/` wrappers.
- NEVER import Kigumi Studio CSS into Landing Page styles.
- NEVER use `!important` in CSS. Use cascade layers.
- NEVER store computed CSS as state. Always derive from source values.
- NEVER use `any` type. Use `unknown` or proper types.
- NEVER render raw `<wa-*>` elements. Always use `@/components/ui` wrappers.

## Guard Rails - ALWAYS

- ALWAYS use existing UI wrappers from `@/components/ui` (Button, Card, Input, Select, ColorPicker, Details, Slider, Switch, Dialog, Dropdown, etc.)
- ALWAYS follow Web Awesome event pattern (`useEffect` + `addEventListener` for `wa-*` events)
- ALWAYS keep CSS in separate `.css` files (no CSS-in-JS)
- ALWAYS use `clsx` for conditional class names
- ALWAYS use TypeScript strict mode
- ALWAYS verify after changes: `pnpm dev` + TypeScript check
- ALWAYS use inline `style` with CSS custom properties for the preview wrapper
- ALWAYS maintain preview isolation: Studio theme must not leak to Landing Page

## Architecture

```
KigumiStudio (page)
  StudioProvider (context: ~43 CSS properties, light/dark modes)
    StudioLayout
      StudioHeader (mode toggles, preset selector, import/export, reset)
      StudioSidebar (scrollable editor sections)
      StudioPreview (live component showcase with applied theme)
```

## State Flow

```
Editor Controls → setProperty(cssVar, value) → StudioContext.values[cssVar][editMode]
  → getStyleObject(previewMode) → style={} on Preview container
  → Web Awesome components inherit CSS custom properties via cascade
```

## Key Files

| File | Purpose |
| --- | --- |
| `contexts/StudioContext.tsx` | State management (~43 properties, light/dark) |
| `lib/property-definitions.ts` | Property metadata (43 definitions) |
| `lib/defaults.ts` | Default values from Web Awesome |
| `lib/css-parser.ts` | Parse `:root {}` and `.wa-dark {}` blocks |
| `lib/css-generator.ts` | Generate CSS output |
| `lib/preset-loader.ts` | Load preset CSS files via `import.meta.glob` |
| `themes/*.css` | Preset theme CSS files |

## Theme Agent

Maintainer-only AI chat that builds a custom theme (spec #181, vocabulary in `GLOSSARY.md`). Invisible and unusable without the access cookie.

```
Browser (useChat + useTriggerChatTransport)
  → POST /api/theme-agent          docs/api/theme-agent.ts (Vercel Function)
      cookie check, then chat.createStartSessionAction / auth.createPublicToken
  ↔ api.trigger.dev sessions       .in (messages) / .out (streamed reply)
      → chat.agent "theme-agent"   docs/trigger/theme-agent.ts (Claude Sonnet)
```

| File | Purpose |
| --- | --- |
| `theme-agent/constants.ts` | Cookie name, task id, endpoint; shared by browser, function and task |
| `components/theme-agent/ThemeAgentSidebar.tsx` | The chat, lazy-loaded only when the cookie is present |
| `../../api/_lib/theme-agent-session.ts` | Access gate + request handling, tested with real `Request`s |
| `../../trigger/theme-agent.ts` | The `chat.agent` task: limits, model, prompt |

Guard rails:

- The chat window uses `@/components/ui` wrappers only: no raw `wa-*` tags, no AI SDK UI components, no third-party chat UI. The AI SDK is used for `useChat` only.
- Never render model output as HTML. `wa-markdown` injects marked's output unsanitised.
- `ANTHROPIC_API_KEY` lives only in trigger.dev, in its Production environment. `TRIGGER_SECRET_KEY` and `THEME_AGENT_ACCESS_KEY` live only in Vercel (Production and Preview). Nothing secret is imported by `src/`.
- `TRIGGER_SECRET_KEY` is the trigger.dev **Production** environment's secret key (`tr_prod_…`) in Vercel Production **and** Preview. The task is deployed to prod only. A preview or dev key fails with "No matching branch env": the SDK sends `VERCEL_GIT_COMMIT_REF` as the trigger.dev branch, and no branch of that name is deployed. A personal access token (`tr_pat_…`) fails with "Invalid API key". Vercel only applies a changed variable to new deployments.

### Enabling it in a browser

In devtools, on kigumi.style or a preview deployment, set the cookie to the value of `THEME_AGENT_ACCESS_KEY` (each domain needs its own; the branch alias `kigumi-docs-git-<branch>-kigumi-ui.vercel.app` keeps one domain across a branch's deployments):

```js
document.cookie =
  'kigumi-theme-agent=<access key>; path=/; max-age=31536000; secure; samesite=strict';
```

Then reload Studio. Any value shows the button; only the right one starts a run.

### Deploying the task

The task deploys by hand; nothing in CI deploys it. Redeploy after every change under `docs/trigger/` or to `docs/trigger.config.ts`:

```bash
cd docs
pnpm exec trigger login        # once per machine
pnpm exec trigger whoami       # confirm the account
pnpm exec trigger deploy --prod
```

The project ref is in `docs/trigger.config.ts`. The Vercel Function ships with the normal docs deployment. Cost ceilings: the Anthropic monthly spend limit (Console), `maxOutputTokens` per answer and `concurrency: { total: 1 }` in the task, and trigger.dev's free credit, which stops runs once spent.

## Testing

```bash
cd docs && pnpm test   # Studio lib tests + the Theme Agent access gate
```
