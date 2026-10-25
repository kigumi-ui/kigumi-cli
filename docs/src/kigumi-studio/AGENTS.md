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
| `lib/preview-style.ts` | `buildPreviewStyle()`: the custom properties the preview sets, derived palettes included. `getStyleObject()` and the contrast check both read it |
| `lib/preset-loader.ts` | Load preset CSS files via `import.meta.glob` |
| `lib/locks.ts` | Locked values: lock keys per value, section and in total, stored apart from the theme (`kigumi-studio-locks`), so reset and presets leave them; never exported |
| `components/editor/LockSwitch.tsx` | The lock switch under each value, beside each section's Reset and above the sections; only with the Theme Agent's access cookie |
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
| `theme-agent/constants.ts` | Cookie name, task id, endpoint, tool name, status steps; shared by browser, function and task |
| `theme-agent/custom-theme.ts` | The custom theme and the snapshot every message carries (theme and locked values; types + Zod schema); shared with the task |
| `theme-agent/proposal.ts` | Proposal shape and `validateProposal()`: Studio properties, Studio's font and shadow lists, values the sidebar offers. `withoutLocked()` is what the browser will apply of a proposal. Shared with the task |
| `theme-agent/contrast.ts` | `checkContrast()`: WCAG 2.1 AA pairs in both modes, read from `buildPreviewStyle()`; resolves hex, `rgb()`, `oklch()` and `var()`. Shared with the task |
| `theme-agent/conversation.ts` | The conversation module: snapshot, validate-then-apply except locked values, held changes and unlock and apply, contrast check of the applied theme, undo of one answer's own values. No React, no network, no model |
| `theme-agent/describe-held-change.ts` | The sidebar name of a held change |
| `theme-agent/use-theme-agent-studio.ts` | Thin adapter onto `StudioContext`: read the custom theme and its locked values, apply a theme, unlock values |
| `components/theme-agent/ThemeAgentSidebar.tsx` | The chat, lazy-loaded only when the cookie is present |
| `components/theme-agent/LockedChanges.tsx` | Under an answer: the locked values it did not change, and unlock and apply |
| `../../api/_lib/theme-agent-session.ts` | Access gate + request handling, tested with real `Request`s |
| `../../trigger/theme-agent.ts` | The `chat.agent` task: limits, model, snapshot schema, status step |
| `../../trigger/theme-agent-turn.ts` | One answer: prompt, the `propose_theme` tool, reject-and-retry loop, contrast correction rounds |

Guard rails:

- The chat window uses `@/components/ui` wrappers only: no raw `wa-*` tags, no AI SDK UI components, no third-party chat UI. The AI SDK is used for `useChat` only.
- Never render model output as HTML. `wa-markdown` injects marked's output unsanitised.
- The model changes the theme only through the `propose_theme` tool, never through its reply text. The task validates every call with `validateProposal()` and sends the errors back for another attempt (at most 3 per answer). The browser validates again in the conversation module and never applies a proposal it refuses. `validateProposal()` refuses custom CSS until the `overrides` layer and its validator from ADR 0009 land.
- Every accepted proposal is checked for contrast on the theme as the answer's proposals leave it: normal, quiet and link text on the raised, default and lowered surfaces at 4.5:1, the form control border on its background at 3:1, and the brand fill the preview paints (`--wa-color-brand-fill-loud`, derived from `--wa-color-brand`) under `--wa-color-brand-on-loud` at 4.5:1. The violations go back to the model for at most 2 correction rounds, except the brand fill pair: the only fix is another brand hue, and the brand colour is the user's, so it is reported, never corrected; a correction names only its fixes, so the browser applies an answer's accepted proposals in order. The browser checks the applied theme again, hand edits made during the run included, and lists what still fails in an accessibility warning; that warning, not the task's feedback, is what the theme on screen has. A colour the check cannot resolve counts as failing.
- Colours in a proposal are `#rrggbb`: the sidebar's picker, the brand palette and the shadow colour only work with that.
- Locked values are protected in `conversation.ts`, never by the prompt (ADR 0007, ADR 0010). The user locks them in the sidebar; nothing is locked by default. An answer's proposal for a locked value is held, never applied, and only "Unlock and apply" under the answer applies it and unlocks it. The prompt lists the locked values so the model leaves them alone and can say so, and the task checks contrast on the proposal without them, but nothing depends on the model obeying.
- Locks are the user's own: a reset, a section reset and loading a preset leave them, and the export never contains them. Only the Theme Agent reads them.
- Undo reverts one answer's own values, held changes it applied included, and leaves every value the user or a later answer changed since.
- Every message carries a snapshot of the custom theme as the sidebar has it (`sendMessage` `metadata`, the task's `clientDataSchema`). The task builds its prompt from the snapshot, never from earlier turns, so hand edits between messages are seen.
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

The project ref is in `docs/trigger.config.ts`. The Vercel Function ships with the normal docs deployment. Cost ceilings: the Anthropic monthly spend limit (Console), `maxOutputTokens` per step and at most `MAX_STEPS` (7) steps per answer, and `concurrency: { total: 1 }` in the task, and trigger.dev's free credit, which stops runs once spent.

## Testing

```bash
cd docs && pnpm test   # Studio lib tests, the Theme Agent conversation module, access gate and agent turn (mock model)
```
