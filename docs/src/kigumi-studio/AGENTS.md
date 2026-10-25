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
      StudioSidebar (scrollable; one Accordion, an EditorSection AccordionItem per property group)
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
| `contexts/StudioContext.tsx` | State management (~43 properties, light/dark). `onThemeReplaced()` tells subscribers when `resetAll` replaces the whole theme (a preset, Default, an import) |
| `lib/property-definitions.ts` | Property metadata (43 definitions) |
| `lib/defaults.ts` | Default values from Web Awesome |
| `lib/css-parser.ts` | Parse `:root {}` and `.wa-dark {}` blocks |
| `lib/css-generator.ts` | Generate CSS output |
| `lib/preview-style.ts` | `buildPreviewStyle()`: the custom properties the preview sets, derived palettes included. `getStyleObject()` and the contrast check both read it |
| `lib/preset-loader.ts` | Load preset CSS files via `import.meta.glob` |
| `lib/locks.ts` | Locked values (`LockedValues`): CSS variables per mode plus the shadow component list; a mode-independent property locks in both modes. Stored apart from the theme (`kigumi-studio-locks`), so reset and presets leave them; never exported. `describeLocks()` is how the Theme Agent reads them |
| `components/editor/LockSwitch.tsx` | The "Lock value" switch under each value and under the shadow component list; a value set per mode locks in the edited mode and the label names it. Only with the Theme Agent's access cookie |
| `theme-agent/use-value-lock.ts` | `useValueLock()` / `useShadowComponentsLock()`: one row's lock in the edited mode, read once per row and handed to its control (disabled while locked) and its `LockSwitch` |
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
| `theme-agent/proposal.ts` | Proposal shape and `validateProposal()`: Studio properties, Studio's font and shadow lists, values the sidebar offers. `splitLocked()` splits a proposal into what the browser applies and what it holds; browser and task both use it. Shared with the task |
| `theme-agent/contrast.ts` | `checkContrast()`: WCAG 2.1 AA pairs in both modes, read from `buildPreviewStyle()`; resolves hex, `rgb()`, `oklch()` and `var()`. Shared with the task |
| `theme-agent/conversation.ts` | The conversation module: snapshot, validate-then-apply except locked values and values changed during the run, held changes (with the contrast pairs each would fix) and apply per value or all, contrast check of the applied theme, undo of one answer's own values, and `end()`, after which nothing of that conversation reaches the theme. No React, no network, no model |
| `theme-agent/describe-held-change.ts` | The sidebar name of a value (`valueLabel()`) and of a held change |
| `theme-agent/use-theme-agent-studio.ts` | Thin adapter onto `StudioContext`: read the custom theme and its locked values, apply a theme; hands on Studio's `setLocked` |
| `components/theme-agent/ThemeAgentSidebar.tsx` | The chat, lazy-loaded only when the cookie is present. The sidebar owns the conversation's lifecycle ("New chat", a replaced theme) and mounts one `ThemeAgentChat` per conversation. A message and its action sit in its card; what Studio did with an answer (callouts, Applied with Undo, refusals) sits below the card |
| `theme-agent/session-client.ts` | The browser's calls to `/api/theme-agent`: a session token (`start`, `refresh`) and `close` |
| `components/theme-agent/LockedChanges.tsx` | `UnlockAndApply`, the answer's action inside its card: one button for one held value, one per value plus one for all with more; "Unlock and apply" for a locked value, "Apply" for one changed during the run. `LockedChangesCallouts`, Studio's report below the card: success callouts for what was applied, neutral ones for what stays locked and what the user changed during the run, each naming the contrast pairs it would fix |
| `../../api/_lib/theme-agent-session.ts` | Access gate + request handling (`start`, `refresh`, `close`), tested with real `Request`s |
| `../../trigger/theme-agent.ts` | The `chat.agent` task: limits, model, snapshot schema, status step |
| `../../trigger/theme-agent-turn.ts` | One answer: prompt, the `propose_theme` tool, reject-and-retry loop, contrast correction rounds |

Guard rails:

- The chat window uses `@/components/ui` wrappers only: no raw `wa-*` tags, no AI SDK UI components, no third-party chat UI. The AI SDK is used for `useChat` only.
- Never render model output as HTML. `wa-markdown` injects marked's output unsanitised.
- The model changes the theme only through the `propose_theme` tool, never through its reply text. The task validates every call with `validateProposal()` and sends the errors back for another attempt (at most 3 per answer). The browser validates again in the conversation module and never applies a proposal it refuses. `validateProposal()` refuses custom CSS until the `overrides` layer and its validator from ADR 0009 land.
- Every accepted proposal is checked for contrast on the theme as the answer's proposals leave it: normal, quiet and link text on the raised, default and lowered surfaces at 4.5:1, the form control border on its background at 3:1, and the brand fill the preview paints (`--wa-color-brand-fill-loud`, derived from `--wa-color-brand`) under `--wa-color-brand-on-loud` at 4.5:1. The violations go back to the model for at most 2 correction rounds, except the brand fill pair: the only fix is another brand hue, and the brand colour is the user's, so it is reported, never corrected unless the user's message asks for that fix (a locked brand is then held like any locked value); a correction names only its fixes, so the browser applies an answer's accepted proposals in order. The browser checks the applied theme again, hand edits made during the run included, and lists what still fails in an accessibility warning, also under an answer that changed nothing; that warning, not the task's feedback, is what the theme on screen has. A colour the check cannot resolve counts as failing.
- A pair whose every value is locked (`lockedSources()`) is one the Theme Agent may not fix: the warning names the locked values (for the brand fill pair, a locked brand), the task lists the pair in `lockedContrast` so the model proposes the fix anyway (except the brand fill pair, which is never corrected unasked), and Studio holds it as a held change that names the pair it fixes. That a held change exists rests on the model proposing it. A pair the answer's held locked values fix takes no correction round.
- Colours in a proposal are `#rrggbb`: the sidebar's picker, the brand palette and the shadow colour only work with that.
- Locked values are protected in `conversation.ts`, never by the prompt (ADR 0007, ADR 0010). The user locks them in the sidebar, per mode; nothing is locked by default. An answer's proposal for a locked value is held, never applied, and only "Unlock and apply" under the answer applies it and unlocks it. A value changed since the answer is not applied and stays locked. Sending the next message keeps every change still held: only the latest answer offers to apply them.
- An answer never overwrites a value the user changed while it was being written, locked or not (ADR 0011): `conversation.ts` compares the current theme, when the answer arrives, with the snapshot the message carried and holds what differs; a value changed and set back is not held. Such a change is applied with "Apply", which unlocks nothing, and Undo locks nothing for it. The snapshot's `previous.edited` tells the agent.
- The prompt lists the locked values and tells the model to leave them out unless the latest message asks to change one, and then to propose it anyway, so Studio holds it and offers "Unlock and apply". A prompt that forbids proposing them leaves nothing to hold and no button to press. The task checks contrast on the proposal without them, and nothing depends on the model obeying.
- The agent hears what the browser did, since it cannot see it: the `propose_theme` result lists the proposal's locked values (`describeLocks()` of what `splitLocked()` holds), and every snapshot's `previous` says how Studio took the last answer (applied, nothing applied, refused with its errors, undone) and which locked values it held. `previous` is absent when the last answer proposed nothing (`answerFinished()`), so an older answer's outcome is never reported as the last one's. The prompt says that only the latest answer offers "Unlock and apply", so a change an earlier answer held is proposed again, not pointed at. The prompt turns both into instructions not to claim a change that did not land.
- Locks are the user's own: a reset, a section reset and loading a preset leave them, and the export never contains them. Only the Theme Agent reads them.
- Undo reverts one answer's own values, held changes it applied included, and leaves every value the user or a later answer changed since. What its "Unlock and apply" unlocked is locked again, except a value changed since, which stays unlocked.
- The message field stays writable while an answer runs, so the next message can be prepared; only sending waits for the answer.
- A conversation ends with "New chat" and whenever the whole custom theme is replaced (a preset, Default, an import: `onThemeReplaced`), so no held change or Undo refers to a theme no longer on screen. Ending calls `conversation.end()` (a late answer from its run is never applied), stops a running answer, mounts a fresh chat with a new chat id, and closes the trigger.dev session through the `close` intent: the run gets the `trigger: "close"` record and exits, then the session is closed, in that order because a closed session refuses appends. A conversation that never sent a message has nothing to end. The draft message survives, and locks stay (ADR 0010).
- A reload starts a fresh conversation (the chat id is per mount); the custom theme is Studio's own and persists. `pagehide` closes the session too, except for a page kept in the back/forward cache. Whatever is not closed, a crashed tab for one, ends when its run has waited `turnTimeout` (1h) for a message.
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

The task deploys by hand; nothing in CI deploys it. Redeploy after every change under `docs/trigger/` or to `docs/trigger.config.ts`, and with every change to `theme-agent/proposal.ts` or `custom-theme.ts`: a page that validates proposals more strictly than the deployed task refuses what that task accepted, and the agent then believes it changed the theme.

```bash
cd docs
pnpm exec trigger login        # once per machine
pnpm exec trigger whoami       # confirm the account
pnpm deploy:task              # trigger deploy --prod; full output in trigger-deploy.log
```

The project ref is in `docs/trigger.config.ts`. The Vercel Function ships with the normal docs deployment. Cost ceilings: the Anthropic monthly spend limit (Console), `maxOutputTokens` per step and at most `MAX_STEPS` (7) steps per answer, and `concurrency: { total: 1 }` in the task, and trigger.dev's free credit, which stops runs once spent.

## Testing

```bash
cd docs && pnpm test   # Studio lib tests, the Theme Agent conversation module, access gate and agent turn (mock model)
```
