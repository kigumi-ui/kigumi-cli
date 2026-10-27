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
- ALWAYS apply the Theme CSS text through `themeEdits()`: only what the user changed in the text, never the whole text read back. The export writes derived values (palettes, surfaces and text from neutral, the shadow colour merged with its opacity); reading them all back would freeze them as values. Applying it is an edit, not a replacement: it does not call `resetAll`, so a Theme Agent conversation goes on (ADR 0012)
- ALWAYS store custom CSS unscoped, as the export writes it, and scope it only in `StudioPreview` with `scopeCustomCSS()`, so no rule reaches Studio's own UI. How the scoping keeps the `overrides` precedence (ADR 0009) and what it does with root selectors and at-rules is documented in `lib/custom-css.ts`

## Architecture

```
KigumiStudio (page)
  StudioProvider (context: ~43 CSS properties, light/dark modes)
    StudioLayout
      StudioHeader (back link, logo, site theme, knowledge base)
      StudioSidebar ("Styles": preset, mode, generate, Customize theme CSS; one Accordion, an EditorSection AccordionItem per property group)
      StudioPreview (live component showcase with applied theme)
      Theme Agent panel (only with the access cookie; ThemeAgentSidebar loads on first open)
```

Both side panels have the same headline (`studio-panel-header`, Styles with a palette, Theme Agent with a robot) and a `PanelToggle` tab on their inner edge, mirrored: the panel's icon while collapsed, an x while open. It is the only way to show or hide a panel. The shared panel styles live in `StudioLayout.css`.

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
| `lib/css-parser.ts` | Parse `:root {}` and `.wa-dark {}` blocks; `parseComponentOverrides()` splits the rest into shadow components and custom CSS, kept as written |
| `lib/custom-css.ts` | Custom CSS: `validateCustomCSS()` (structure check before Apply), `scopeCustomCSS()` (the preview's scoping), `splitStylesheet()` (rules with the comments before them), `storedCustomCSS()` (reads what an earlier Studio saved with the preview scope) |
| `lib/theme-css.ts` | The Theme CSS text: `themeFiles()` (a project's `theme.css` and `overrides.css`), `themeText()` (both under headers), `themeEdits()` (what Apply changes: only the edits from the text shown to the text applied, locked values kept), `themeDownloads()` (the two files, each saying so when empty), `withImportedValues()` (values stored as Studio stores them; the context's `importValues`) |
| `components/toolbar/ThemeCSSDialog.tsx` | The "Customize theme CSS" toolbar dialog: the whole custom theme in one text field, `theme.css` then `overrides.css`, to read, edit and paste over; a split button downloads both files (default) or one (`themeDownloads()`). "Lock custom CSS" under the field locks the custom CSS against the Theme Agent (with the access cookie) |
| `lib/css-generator.ts` | `modifiedProperties()` (the values the export writes, derived ones included) and `generateThemeCSS()` (a project's `theme.css`, never custom CSS) |
| `lib/preview-style.ts` | `buildPreviewStyle()`: the custom properties the preview sets, derived palettes included. `getStyleObject()` and the contrast check both read it |
| `lib/preset-loader.ts` | Load preset CSS files via `import.meta.glob` |
| `lib/locks.ts` | Locked values (`LockedValues`): CSS variables per mode plus the shadow component list and the custom CSS (one lock each); a mode-independent property locks in both modes. Stored apart from the theme (`kigumi-studio-locks`), so reset and presets leave them; never exported. `describeLocks()` is how the Theme Agent reads them |
| `components/editor/LockSwitch.tsx` | The "Lock value" switch under each value and under the shadow component list, and "Lock custom CSS" in the Customize theme CSS dialog; a value set per mode locks in the edited mode and the label names it. Only with the Theme Agent's access cookie |
| `theme-agent/use-value-lock.ts` | `useValueLock()` / `useShadowComponentsLock()` / `useCustomCSSLock()`: one row's lock in the edited mode, read once per row and handed to its control (disabled while locked) and its `LockSwitch`. Locked custom CSS cannot be disabled in the shared text field: `themeEdits()` keeps it and says so |
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
| `theme-agent/proposal.ts` | Proposal shape and `validateProposal()`: Studio properties, Studio's font and shadow lists, values the sidebar offers, custom CSS through `validateAgentCSS()`. A proposal's `customCSS` is the complete custom CSS, never a patch. `splitLocked()` splits a proposal into what the browser applies and what it holds; browser and task both use it. Shared with the task |
| `theme-agent/agent-css.ts` | `validateAgentCSS()`: the checked subset of custom CSS an answer may carry (ADR 0009): parses, no at-rule beyond `@media`, `@supports`, `@container` and `@keyframes` (a plain-identifier name, only `from`/`to`/percentage blocks, checked like rules), every rule that starts an animation inside `@media (prefers-reduced-motion: no-preference)`, no nested rules, no `url()` or other resource, nothing script-like or escaped, at most `MAX_AGENT_CSS_LENGTH` characters, every colour from a `var(--wa-*)` value, and no vendor-prefixed value. Rules a proposal carries over unchanged from the custom CSS its message carried are the user's: not checked, not counted. Shared with the task |
| `theme-agent/css-diff.ts` | `lineDiff()`: the line diff a held custom CSS change shows |
| `theme-agent/contrast.ts` | `checkContrast()`: WCAG 2.1 AA pairs in both modes, read from `paintedStyle()`, the colours `buildPreviewStyle()` paints for a custom theme; resolves hex, `rgb()`, `oklch()` and `var()`. Shared with the task |
| `theme-agent/conversation.ts` | The conversation module: snapshot, validate-then-apply except locked values and values changed during the run, held changes (with the contrast pairs each would fix) and apply per value or all, contrast check of the applied theme, undo of one answer's own values, `end()`, after which nothing of that conversation reaches the theme, and `save()`, plain data that `createThemeAgentConversation(saved)` restores after a reload. No React, no network, no model |
| `theme-agent/stored-conversation.ts` | The tab's conversation in `sessionStorage` (ADR 0014): chat id, messages, the conversation module's `save()` and the cut-off answers under one key, the transport's session state (`onSessionChange`) under another. What a load cannot read starts a fresh conversation; `clearConversation()` when one ends |
| `theme-agent/message.ts` | `ThemeAgentMessage`: a chat message with its status steps and `propose_theme` calls, for the chat and the stored conversation |
| `theme-agent/describe-held-change.ts` | The sidebar name of a value (`valueLabel()`) and of a held change |
| `theme-agent/use-theme-agent-studio.ts` | Thin adapter onto `StudioContext`: read the custom theme and its locked values, apply a theme; hands on Studio's `setLocked` |
| `components/PanelToggle.tsx` | The tab that shows and hides a side panel, shared by Styles and the Theme Agent |
| `components/theme-agent/ThemeAgentSidebar.tsx` | The Theme Agent panel, lazy-loaded only when the cookie is present: its headline with "New chat", and the conversation's lifecycle ("New chat", a replaced theme, ADR 0012). Mounts one `ThemeAgentChat` per conversation, handing on an optional `transport` (the interaction story's canned one) |
| `components/theme-agent/ThemeAgentChat.tsx` | One conversation: its chat id, `useChat` run, conversation module, messages and composer; `end()` and `focus()` for the panel. Restores the conversation the tab saved and resumes an answer a reload interrupted (ADR 0014). A message and its action sit in its card; what Studio did with an answer (callouts, Applied with Undo, refusals) sits below the card. A `transport` handed to the panel replaces trigger.dev's (`ThemeAgentTransport`), for the interaction story. An answer cut off by the output limit before a proposal is reported as refused, never left blank |
| `theme-agent/session-client.ts` | The browser's calls to `/api/theme-agent`: a session token (`start`, `refresh`) and `close` |
| `components/theme-agent/LockedChanges.tsx` | `UnlockAndApply`, the answer's action inside its card: one button for one held value, one per value plus one for all with more; "Unlock and apply" for a locked value, "Apply" for one changed during the run. Held custom CSS shows its diff (`Details`) above the buttons, with a `CopyButton` for the proposed custom CSS alone. `LockedChangesCallouts`, Studio's report below the card: success callouts for what was applied, neutral ones for what stays locked and what the user changed during the run, each naming the contrast pairs it would fix |
| `../../api/_lib/theme-agent-session.ts` | Access gate + request handling (`start`, `refresh`, `close`), tested with real `Request`s |
| `../../api/_lib/local-api.ts` | `localApiMiddleware()`: serves the Function from the Vite dev server for `pnpm dev:agent` (`vite.config.ts` adds it only when `THEME_AGENT_LOCAL=1`); never deployed |
| `../../../scripts/dev-theme-agent.mjs` | `pnpm dev:agent`: checks the keys (`planLocalAgent()`), then starts `trigger dev` and Vite, or Vite alone with `--deployed` |
| `../../trigger/theme-agent.ts` | The `chat.agent` task: limits, model, snapshot schema, status step |
| `../../trigger/theme-agent-turn.ts` | One answer: prompt, the `propose_theme` tool, reject-and-retry loop, contrast correction rounds; `THEME_AGENT_MODEL` |
| `../../eval/theme-agent-scenarios.ts` | The prompt eval's scenarios (snapshot, messages) and their judges, which read accepted proposals and locks, never reply text |
| `../../eval/theme-agent.eval.ts` | `pnpm eval:theme-agent`: the scenarios against the real model (`vitest.eval.config.ts`); never in CI |

Guard rails:

- The chat window uses `@/components/ui` wrappers only: no raw `wa-*` tags, no AI SDK UI components, no third-party chat UI. The AI SDK is used for `useChat` only.
- Never render model output as HTML. `wa-markdown` injects marked's output unsanitised.
- The model changes the theme only through the `propose_theme` tool, never through its reply text. The task validates every call with `validateProposal()` and sends the errors back for another attempt (at most 3 per answer). The browser validates again in the conversation module and never applies a proposal it refuses.
- An answer may carry custom CSS, for what no value or shadow component can express, and the explanation says why no value could. The validator accepts only the checked subset in `agent-css.ts` (ADR 0009); custom CSS the user writes by hand is not restricted. Loosening that subset loosens what model output can do to the page. The prompt asks for a Kigumi wrapper class or `wa-*` tag for the host and `::part()` for the inside, and for the complete custom CSS each time: Studio replaces it whole, and Undo restores it with the answer's values. The custom CSS is one locked value and one held change, for both modes, under the same rules as any other (ADR 0010, ADR 0011).
- Every accepted proposal is checked for contrast on the theme as the answer's proposals leave it: normal, quiet and link text on the raised, default and lowered surfaces at 4.5:1, the form control border on its background at 3:1, and the brand fill the preview paints (`--wa-color-brand-fill-loud`, derived from `--wa-color-brand`) under `--wa-color-brand-on-loud` at 4.5:1. Studio derives the brand fill from palette step 40, not Web Awesome's step 50, and keeps the on-colour white: at step 40 white passes for every brand, so the pair fails only if that derivation changes. The violations go back to the model for at most 2 correction rounds (`correctableViolations()`), except the brand fill pair: it is set by the brand colour, which is the user's, so it is reported, never corrected unless the user's message asks for that fix (a locked brand is then held like any locked value); a correction names only its fixes, so the browser applies an answer's accepted proposals in order. The browser checks the applied theme again, hand edits made during the run included, and lists what still fails in an accessibility warning, also under an answer that changed nothing; that warning, not the task's feedback, is what the theme on screen has. A colour the check cannot resolve counts as failing.
- A pair whose every value is locked (`lockedSources()`) is one the Theme Agent may not fix: the warning names the locked values (for the brand fill pair, a locked brand), the task lists the pair in `lockedContrast` so the model proposes the fix anyway (except the brand fill pair, which is never corrected unasked), and Studio holds it as a held change that names the pair it fixes. That a held change exists rests on the model proposing it. A pair the answer's held locked values fix takes no correction round.
- Colours in a proposal are `#rrggbb`: the sidebar's picker, the brand palette and the shadow colour only work with that.
- Locked values are protected in `conversation.ts`, never by the prompt (ADR 0007, ADR 0010). The user locks them in the sidebar, per mode; nothing is locked by default. An answer's proposal for a locked value is held, never applied, and only "Unlock and apply" under the answer applies it and unlocks it. A value changed since the answer is not applied and stays locked. Sending the next message keeps every change still held: only the latest answer offers to apply them.
- An answer never overwrites a value the user changed while it was being written, locked or not (ADR 0011): `conversation.ts` compares the current theme, when the answer arrives, with the snapshot the message carried and holds what differs; a value changed and set back is not held. Such a change is applied with "Apply", which unlocks nothing, and Undo locks nothing for it. The snapshot's `previous.edited` tells the agent.
- The prompt lists the locked values and tells the model to leave them out unless the latest message asks to change one, and then to propose it anyway, so Studio holds it and offers "Unlock and apply". A prompt that forbids proposing them leaves nothing to hold and no button to press. The task checks contrast on the proposal without them, and nothing depends on the model obeying.
- The agent hears what the browser did, since it cannot see it: the `propose_theme` result lists the proposal's locked values (`describeLocks()` of what `splitLocked()` holds), and every snapshot's `previous` says how Studio took the last answer (applied, nothing applied, refused with its errors, undone) and which locked values it held. `previous` is absent when the last answer proposed nothing (`answerFinished()`), so an older answer's outcome is never reported as the last one's. The prompt says that only the latest answer offers "Unlock and apply", so a change an earlier answer held is proposed again, not pointed at. The prompt turns both into instructions not to claim a change that did not land.
- Locks are the user's own: a reset, a section reset and loading a preset leave them, and the export never contains them. Only the Theme Agent reads them.
- Undo reverts one answer's own values, held changes it applied included, and leaves every value the user or a later answer changed since. What its "Unlock and apply" unlocked is locked again, except a value changed since, which stays unlocked.
- The message field stays writable while an answer runs, so the next message can be prepared; only sending waits for the answer.
- A conversation ends with "New chat" and whenever the whole custom theme is replaced (a preset, Default, an import: `onThemeReplaced`), so no held change or Undo refers to a theme no longer on screen. Ending calls `conversation.end()` (a late answer from its run is never applied), stops a running answer, mounts a fresh chat with a new chat id, and closes the trigger.dev session through the `close` intent: the run gets the `trigger: "close"` record and exits, then the session is closed, in that order because a closed session refuses appends. A conversation that never sent a message has nothing to end. The draft message survives, and locks stay (ADR 0010, ADR 0012).
- A reload keeps the conversation (ADR 0014). Each tab saves it in `sessionStorage` as it changes, except the answer being streamed, which a reload resumes from the session: the messages, the conversation module's `save()` (answers with their `before` theme, held changes, Undo, `sentTheme`) and the cut-off answers, plus the transport's session state. After a reload the chat restores all of it, hands the session state to `useTriggerChatTransport` (`sessions`) and resumes an interrupted answer (`useChat` `resume`), which is then applied or held as without the reload. Leaving the page closes nothing: a closed tab leaves its session open with no run, the run having ended after `turnTimeout` (1h); a message after that in an open tab starts a new run on the same session. Not covered: a theme another tab replaced (Undo still leaves every value changed since) and a duplicated tab, which shares the conversation.
- Every message carries a snapshot of the custom theme as the sidebar has it (`sendMessage` `metadata`, the task's `clientDataSchema`). The task builds its prompt from the snapshot, never from earlier turns, so hand edits between messages are seen.
- `ANTHROPIC_API_KEY` lives in trigger.dev, in its Production environment, for the task; the prompt eval reads a maintainer's own key from the environment or a gitignored `.env`, never from a committed file. `TRIGGER_SECRET_KEY` and `THEME_AGENT_ACCESS_KEY` live in Vercel (Production and Preview) and, for local runs, in a maintainer's gitignored `docs/.env.local`. Nothing secret is imported by `src/`.
- `TRIGGER_SECRET_KEY` is the trigger.dev **Production** environment's secret key (`tr_prod_…`) in Vercel Production **and** Preview. The task is deployed to prod only. A preview or dev key fails with "No matching branch env": the SDK sends `VERCEL_GIT_COMMIT_REF` as the trigger.dev branch, and no branch of that name is deployed. Locally that variable is unset, which is why `pnpm dev:agent` can use a `tr_dev_` key. A personal access token (`tr_pat_…`) fails with "Invalid API key". Vercel only applies a changed variable to new deployments.

### Enabling it in a browser

In devtools, on kigumi.style or a preview deployment, set the cookie to the value of `THEME_AGENT_ACCESS_KEY` (each domain needs its own; the branch alias `kigumi-docs-git-<branch>-kigumi-ui.vercel.app` keeps one domain across a branch's deployments):

```js
document.cookie =
  'kigumi-theme-agent=<access key>; path=/; max-age=31536000; secure; samesite=strict';
```

Then reload Studio. Any value shows the button; only the right one starts a run.

### Trying it locally

Three levels, cheapest first. None needs a push, a Vercel preview or a deploy.

| Level | Command | What answers | Use it for |
| --- | --- | --- | --- |
| 1. UI without a model | `pnpm storybook` | Canned answers in `ThemeAgentSidebar.stories.tsx`, through Studio's real conversation module | Layout, actions, held changes, Undo |
| 2. Studio against the deployed task | `pnpm dev:agent --deployed` | The task in trigger.dev Production | Page and sidebar changes that need real answers but no task change |
| 3. Everything local | `pnpm dev:agent` | The task on this machine (`trigger dev`), in trigger.dev's dev environment | Any change under `docs/trigger/`, to the prompt, or to what the task validates |

The sidebar stories carry the `maintainer` tag: `pnpm storybook` lists them, and `.storybook/main.ts` leaves them out of the sidebar of every build (the published Storybook and Chromatic's).

`pnpm dev:agent` (from `docs/`) serves Studio on the localhost URL Vite prints (port 5173 unless taken) with `/api/theme-agent` handled by the Vite dev server itself, running `docs/api/theme-agent.ts` unchanged; no Vercel CLI is involved. At level 3 it also runs `trigger dev`, prints which trigger.dev environment it talks to, and stops both processes on Ctrl+C or when either exits. A change to the prompt in `docs/trigger/theme-agent-turn.ts` takes effect in the next answer: `trigger dev` rebuilds the task on save.

One-time setup, in `docs/.env.local` of the main checkout (gitignored, like `docs/.env`; never commit either). A git worktree reads the main checkout's files first and its own over them, so do not copy the keys into worktrees: every copy is one more file an agent without a secret-read guard can open.

```bash
THEME_AGENT_ACCESS_KEY=<any value>        # local only; the cookie below must match
TRIGGER_SECRET_KEY=tr_dev_...             # level 3: trigger.dev dashboard, project, API keys, Development
ANTHROPIC_API_KEY=sk-ant-...              # level 3: or in docs/.env, where the eval reads it
TRIGGER_PROD_SECRET_KEY=tr_prod_...       # level 2 only: the key Vercel holds as TRIGGER_SECRET_KEY
```

- `pnpm exec trigger login` once per machine. `trigger dev` runs under that login, in your own dev environment, so the `tr_dev_` key must come from the same account.
- `trigger dev` hands its environment to the local task. The script gives it the shell's environment and `ANTHROPIC_API_KEY`, never the keys only Vite needs (`TRIGGER_SECRET_KEY`, `TRIGGER_PROD_SECRET_KEY`, `THEME_AGENT_ACCESS_KEY`). `trigger dev` also reads the env files in its own directory itself, so a worktree's own `docs/.env.local` reaches the task whole.
- Level 3 refuses a `tr_prod_` key and level 2 a `tr_dev_` one, so the local task and Production are never mixed up. Level 2 runs on Production's Anthropic spend, like kigumi.style.
- A missing or wrong key, and at level 3 a trigger.dev CLI without a login, stops the script before anything starts, naming each problem.

Then set the cookie on `localhost` in devtools and reload Studio (no `secure` needed on `http://localhost`):

```js
document.cookie =
  'kigumi-theme-agent=<THEME_AGENT_ACCESS_KEY>; path=/; max-age=31536000; samesite=strict';
```

### Deploying the task

The task deploys by hand; nothing in CI deploys it. A PR's task and prompt changes are tried locally first (level 3, then `pnpm eval:theme-agent`), and Production is deployed once the PR is merged: deploying from a branch changes the Theme Agent on kigumi.style and on every preview before the change is reviewed. Redeploy after every merged change under `docs/trigger/` or to `docs/trigger.config.ts`, and with every change to `theme-agent/proposal.ts`, `agent-css.ts` or `custom-theme.ts`: a page that validates proposals more strictly than the deployed task refuses what that task accepted, and the agent then believes it changed the theme.

Run the prompt eval first, and deploy only when every scenario passes. The unit tests pin the prompt's wording against a mock model, which returns whatever the test scripts; only the eval shows what the real model does with the prompt. A prompt bug that only changes what the model chooses to propose passes every unit test.

```bash
cd docs
pnpm eval:theme-agent         # the real model on fixed scenarios; needs ANTHROPIC_API_KEY
pnpm exec trigger login        # once per machine
pnpm exec trigger whoami       # confirm the account
pnpm deploy:task              # trigger deploy --prod; full output in trigger-deploy.log
```

The eval (`docs/eval/`) runs `themeAgentTurn()` with `THEME_AGENT_MODEL`, the model the task uses, on each scenario in `theme-agent-scenarios.ts`, and judges the answer in code from its accepted proposals, `splitLocked()` and the contrast check, never from the reply text. It prints PASS or FAIL per scenario with the reason, and the reply only for reading. `ANTHROPIC_API_KEY` comes from the environment, else `docs/.env`, else the repository's `.env` (both gitignored); without it the eval fails, it never passes. It costs API tokens, so CI never runs it; `pnpm test` runs only the judges' unit tests. A new prompt bug found on a preview becomes a scenario there.

The project ref is in `docs/trigger.config.ts`. The Vercel Function ships with the normal docs deployment. Cost ceilings: the Anthropic monthly spend limit (Console), `maxOutputTokens` per step and at most `MAX_STEPS` (7) steps per answer, and `concurrency: { total: 1 }` in the task, and trigger.dev's free credit, which stops runs once spent.

## Testing

```bash
cd docs && pnpm test   # Studio lib tests, the Theme Agent conversation module, access gate, agent turn (mock model), eval judges
cd docs && pnpm storybook:test   # interaction lane, the Theme Agent sidebar included
```

The sidebar's layout and actions are tested in a browser, where Web Awesome runs, not in jsdom: `src/stories/ThemeAgentSidebar.stories.tsx` renders it inside a real `StudioProvider`, seeds locks in storage, and hands it a canned transport that streams an answer's text and its accepted `propose_theme` call, so Studio's own conversation module decides what is applied and held. It is in the interaction lane, listed in `pnpm storybook`, and left out of the published Storybook's sidebar (the `maintainer` tag). A new answer layout or action gets a story there.
