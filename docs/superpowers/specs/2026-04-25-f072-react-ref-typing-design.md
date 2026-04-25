# F-072: React 19 Ref-Typing Fix für Free + Pro Templates

**Status:** Draft
**Owner:** Mischa
**Created:** 2026-04-25
**Related backlog:** F-072 in `~/.claude/projects/kigumi-cli-overview.md`
**Blocks:** PR #125 (`feat/template-typecheck-ci`, Phase B)
**Branched from:** `origin/main`

## Background

PR #122 (Phase 1+2 der Template-Typecheck-Coverage Initiative) hat per-Framework `tsconfig.json` und `typecheck-shims/` etabliert, sodass `tsc` und `vue-tsc` gegen `templates/` laufen können. Das hat ohne CI-Wiring eine Bug-Klasse aufgedeckt: 60 React Free-Templates produzieren `TS2322` durch Ref-Typing-Mismatch unter React 19.

PR #125 (Phase B, aktuell open mit rotem CI) wired `pnpm typecheck:templates` als Quality-Checks-Step ein. Der CI-Step bleibt rot bis F-072 mergt.

F-072 ist der letzte offene Phase-3-Bug (F-069/073/074/075/076 sind shipped) und blockiert den Phase-B-Unblock.

## Bug-Beschreibung

**Pattern in jedem React Free-Template:**

```tsx
const avatarRef = useRef<HTMLElement & { /* methods */ }>(null);
// ...
<wa-avatar ref={avatarRef} ...>
```

**Was WAs JSX-Augmentation deklariert** (`@awesome.me/webawesome/dist/custom-elements-jsx.d.ts`):

```ts
type BaseProps<T extends HTMLElement> = {
  // ...
  ref?: T | ((e: T) => void);
  // ...
};

interface CustomElements {
  'wa-avatar': Partial<WaAvatarProps & BaseProps<WaAvatar> & BaseEvents>;
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements extends CustomElements {}
  }
}
```

**Resultierender TS-Error:**

```
TS2322: Type 'RefObject<HTMLElement | null>' is not assignable to
        type 'WaAvatar | ((e: WaAvatar) => void) | undefined'.
```

60 Free-Komponenten triggern diesen Error. Die 15 Pro-Komponenten entkommen heute, weil `typecheck-shims/wa-pro-jsx.d.ts` Pro-Tags als `unknown` typisiert — was den Bug verdeckt aber auch jegliche Pro-Type-Checks unterläuft.

## Root Cause

WA designed `BaseProps<T>.ref` framework-agnostic: akzeptiert `T` direkt oder einen Setter-Callback `(e: T) => void`. React's idiomatisches `RefObject<T>` aus `useRef<T>(null)` matched diese Form nicht — auch nicht mit angepasstem Type-Argument zu `useRef<WaAvatar>(null)`.

React 19 verschärft Ref-Typisierung gegenüber React 18; deshalb surfaced der Bug erst mit der Phase-1-Discovery in PR #122. React 18 hat den Mismatch toleriert.

## Scope

**In scope:**

- Alle 75 React Templates (60 Free + 15 Pro) auf type-safes Callback-Ref-Pattern umstellen.
- Pro-Shim (`typecheck-shims/wa-pro-paths.d.ts` + `wa-pro-jsx.d.ts`) von `unknown`-Stubs auf akkurate Pro-Klassen-Deklarationen härten.
- `scripts/sync-wa-pro-shim.ts` als re-runnable Maintainer-Tool für künftige Pro-API-Drift.
- Generator (`scripts/generate-react-templates.ts`) anpassen.
- Memory- + Backlog-Updates für die Initiative.

**Out of scope:**

- Vue Templates (0 Errors auf origin/main, F-072 ist React-only).
- Angular Templates (0 Errors auf origin/main).
- Pro als persistente Repo-Dependency. Pro wird ausschließlich als temporäres Maintainer-Tool zur Shim-Generierung lokal installiert; Repo bleibt Pro-frei für Contributors.
- CI Workflow Änderungen (Quality-Checks bleibt unverändert; R18/R19 Integration-Test-Matrix existiert bereits).
- Spec-Status-Flip von `2026-04-25-template-typecheck-coverage-design.md` (das ist Phase D's Job nach Merge).

## Architektur

**Touchpoints:**

| Pfad                                        | Operation | Beschreibung                                                    |
| ------------------------------------------- | --------- | --------------------------------------------------------------- |
| `scripts/generate-react-templates.ts`       | MODIFY    | ref-Type-Emission auf `WaXxx` mit Callback-Setter               |
| `scripts/sync-wa-pro-shim.ts`               | NEW       | Re-runnable Pro-Shim-Generator (maintainer-only)                |
| `typecheck-shims/wa-pro-paths.d.ts`         | REWRITE   | Echte Pro-Klassen statt `class _Default extends HTMLElement {}` |
| `typecheck-shims/wa-pro-jsx.d.ts`           | REWRITE   | Echte Pro-JSX-Typen statt `unknown`                             |
| `typecheck-shims/README.md`                 | UPDATE    | Sync-Workflow-Doku                                              |
| `templates/react/<75 components>/X.tsx.hbs` | REGEN     | Via Generator-Re-Run                                            |
| `templates/AGENTS.md`                       | UPDATE    | Templates-First + Sync-Workflow-Hinweis                         |
| `.changeset/<auto>.md`                      | NEW       | Patch-Level Changeset                                           |

**Was nicht angefasst wird:**

- `package.json` Dependencies (Pro bleibt nicht installiert)
- `.github/workflows/*` (kein Pro-Auth-Step nötig im Quality-Checks-Job)
- Root `.npmrc` (bleibt committed mit "no @awesome.me packages")
- Vue + Angular Templates und Generators
- `pnpm-lock.yaml` (nach `pnpm add -D @awesome.me/webawesome-pro` sofort `git checkout package.json pnpm-lock.yaml .npmrc` ausführen)

## Fix-Pattern (per Template)

**Vorher (Avatar.tsx als Beispiel):**

```tsx
import { forwardRef, useRef, useImperativeHandle, useEffect, type HTMLAttributes } from 'react';
import clsx from 'clsx';
import './Avatar.css';

export interface AvatarRef {
  element: HTMLElement | null;
}

export const Avatar = forwardRef<AvatarRef, AvatarProps>(
  ({ children, className, onError, ...props }, ref) => {
    const avatarRef = useRef<HTMLElement & {
    }>(null);

    useImperativeHandle(ref, () => ({
      get element() { return avatarRef.current; },
    }), []);

    useEffect(() => { /* ... */ }, [onError]);

    return (
      <wa-avatar ref={avatarRef} class={clsx('Avatar', className)} ...>
        {children}
      </wa-avatar>
    );
  }
);
```

**Nachher:**

```tsx
import { forwardRef, useRef, useCallback, useImperativeHandle, useEffect, type HTMLAttributes } from 'react';
import clsx from 'clsx';
import type WaAvatar from '@awesome.me/webawesome/dist/components/avatar/avatar.js';
import './Avatar.css';

export interface AvatarRef {
  element: WaAvatar | null;
}

export const Avatar = forwardRef<AvatarRef, AvatarProps>(
  ({ children, className, onError, ...props }, ref) => {
    const avatarRef = useRef<WaAvatar | null>(null);
    const setAvatarRef = useCallback((el: WaAvatar | null) => {
      avatarRef.current = el;
    }, []);

    useImperativeHandle(ref, () => ({
      get element() { return avatarRef.current; },
    }), []);

    useEffect(() => { /* ... */ }, [onError]);

    return (
      <wa-avatar ref={setAvatarRef} class={clsx('Avatar', className)} ...>
        {children}
      </wa-avatar>
    );
  }
);
```

**Warum das typecheck-clean ist:**

1. `useRef<WaAvatar | null>(null)` → `RefObject<WaAvatar | null>`
2. `setAvatarRef: (el: WaAvatar | null) => void` — TypeScript-Kontravarianz: ein Function-Type mit "weiter zugelassenen" Parameter-Typen ist assignable zu einem mit "engerem" Parameter. `(WaAvatar | null) => void` ist assignable zu `(e: WaAvatar) => void`.
3. WAs JSX-ref-Slot akzeptiert `WaAvatar | ((e: WaAvatar) => void)` — der Callback passt.

`useImperativeHandle`'s `current.method()` Lookups bleiben funktional gleich, weil `WaAvatar`-Klasse die Methoden mit korrekten Signaturen hat.

## Generator-Patches

**Datei:** `scripts/generate-react-templates.ts`

| Stelle                                               | Vorher                                                                                             | Nachher                                                                                                                        |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Zeile 248 (template top imports)                     | `import { forwardRef, useRef, useImperativeHandle, useEffect, type HTMLAttributes } from 'react';` | + `, useCallback`<br>+ neue Zeile: `import type Wa${Name} from '@awesome.me/webawesome/dist/components/${kebab}/${kebab}.js';` |
| Zeile 152 (refInterface element)                     | `element: HTMLElement \| null`                                                                     | `element: Wa${Name} \| null`                                                                                                   |
| Zeile 154-166 (refTypeMethods Variable + Verwendung) | wird gebraucht für inline-method-types in `useRef<HTMLElement & {...}>`                            | **gelöscht** — WaXxx liefert die Methoden                                                                                      |
| Zeile 288-289 (useRef-Emission)                      | `useRef<HTMLElement & {${refTypeMethods}}>(null)`                                                  | `useRef<Wa${Name} \| null>(null)`                                                                                              |
| Nach useRef (neu)                                    | —                                                                                                  | `const set${Name}Ref = useCallback((el: Wa${Name} \| null) => { ${name}Ref.current = el; }, []);`                              |
| Zeile 322-323 (JSX ref)                              | `ref={${name}Ref}`                                                                                 | `ref={set${Name}Ref}`                                                                                                          |

**Klassen-Naming-Konvention:** `WaXxx` ist `'Wa' + component.name` (component.name ist bereits PascalCase, z. B. `AnimatedImage` → `WaAnimatedImage`). Funktioniert für alle Free + Pro Komponenten.

**Pfad-Konvention:** `@awesome.me/webawesome/dist/components/${kebab}/${kebab}.js`. Generator hat bereits `componentKey = component.tagName.replace('wa-', '')` (kebab-case). Pro-Komponenten nutzen identisches Pfad-Format — zur Materialize-Zeit Rewrite auf `webawesome-pro/...`, zur Typecheck-Zeit Auflösung gegen Pro-Shim.

## Pro-Shim-Härtung

**Aktuell (origin/main):**

```ts
// wa-pro-paths.d.ts (15× identisch)
declare module '@awesome.me/webawesome/dist/components/chart/chart.js' {
  export default class _Default extends HTMLElement {}
}

// wa-pro-jsx.d.ts
interface WaProIntrinsicElements {
  'wa-chart': unknown;
  // ... 14 weitere
}
```

**Akkurat (sync-generiert):**

```ts
// wa-pro-paths.d.ts (per Pro-Komponente)
declare module '@awesome.me/webawesome/dist/components/chart/chart.js' {
  export default class WaChart extends HTMLElement {
    type: 'bar' | 'line' | 'pie' | /* ... */;
    data: ChartData;
    options: ChartOptions;
    update(): void;
    destroy(): void;
    // ... aus Pros chart.d.ts inlined
  }
  // External deps zu unknown gestubbt
  export type ChartData = unknown;
  export type ChartOptions = unknown;
}

// wa-pro-jsx.d.ts (per Pro-Komponente)
interface WaChartProps {
  type?: string;
  data?: unknown;
  options?: unknown;
  // ...
}

interface WaProIntrinsicElements {
  'wa-chart': Partial<WaChartProps & BaseProps<WaChart> & BaseEvents>;
  // ...
}
```

**Konsequenz:** Pro-Templates nutzen `useRef<WaChart | null>(null)` und der Setter-Callback typecheckt gegen die echte Pro-Klassen-Schnittstelle. Methoden-Lookups in `useImperativeHandle` (z. B. `comboboxRef.current.formStateRestoreCallback(...)`) typechecken gegen die echte Combobox-API.

## Sync-Script: `scripts/sync-wa-pro-shim.ts`

**Vorbedingung:** `@awesome.me/webawesome-pro` lokal in `node_modules/`. Wenn nicht installiert: error mit klarer Anleitung (`pnpm setup:npmrc && pnpm add -D @awesome.me/webawesome-pro && git checkout package.json pnpm-lock.yaml .npmrc`).

**Verhalten:**

1. Pro-Pfad detektieren (`node_modules/@awesome.me/webawesome-pro/dist/`).
2. Pro-Komponenten-Liste hardcoded (15 Tags, identisch zu aktuellem `wa-pro-paths.d.ts`).
3. Pro JSX-d.ts via ts-morph parsen:
   - `custom-elements-jsx.d.ts` → `CustomElements` interface auf Pro-Tags filtern.
   - Props-Interfaces der Pro-Tags (z. B. `WaChartProps`) inlinen.
4. Pro Komponenten-d.ts via ts-morph parsen:
   - Für jeden Pro-Pfad: class declaration extrahieren.
   - Externe imports (Chart.js types, internal helpers) zu `unknown` stubben.
   - In `declare module '<original-Free-Pfad>' { ... }` wrappen.
5. `typecheck-shims/wa-pro-paths.d.ts` schreiben.
6. `typecheck-shims/wa-pro-jsx.d.ts` schreiben.

**Idempotent:** 2× run produziert identischen Output.

**Tooling:** `ts-morph` ist bereits dependency.

## Maintainer-Workflow (in `templates/AGENTS.md` + `typecheck-shims/README.md`)

```bash
# Wann: nach jedem @awesome.me/webawesome (Free) Versions-Bump im Root.
#       Pro folgt Free's Versionierung.

pnpm setup:npmrc                                   # WEBAWESOME_NPM_TOKEN aus .env in ~/.npmrc
pnpm add -D @awesome.me/webawesome-pro             # lokal installieren
git checkout package.json pnpm-lock.yaml .npmrc    # Manifeste sofort revertieren
pnpm tsx scripts/sync-wa-pro-shim.ts               # generiert Shim
git diff typecheck-shims/                          # review
pnpm tsx scripts/generate-react-templates.ts       # falls Method-Signaturen drifteten
pnpm typecheck:templates                           # exit 0 verifizieren
git commit
pnpm remove @awesome.me/webawesome-pro             # cleanup
```

Die `typecheck-shims/README.md` dokumentiert: "Diese Files sind generiert. Editiert nicht von Hand. Re-run `scripts/sync-wa-pro-shim.ts`."

## Acceptance Criteria

| #   | Kriterium                                                  | Verifikation                                                                                   |
| --- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| 1   | `npx tsc -p templates/react/tsconfig.json --noEmit` exit 0 | lokal + CI Phase B (PR #125 nach Re-Run)                                                       |
| 2   | Integration Tests (React 18) bleiben grün                  | CI auf F-072-PR                                                                                |
| 3   | Integration Tests (React 19) bleiben grün                  | CI auf F-072-PR                                                                                |
| 4   | Generator-Output ist byte-identisch reproduzierbar         | `pnpm tsx scripts/generate-react-templates.ts && git diff --exit-code templates/react/` exit 0 |
| 5   | Sync-Script ist idempotent                                 | 2× run produziert identischen Output                                                           |
| 6   | Bestehende Validators bleiben grün                         | `pnpm validate:templates && pnpm validate:registry && pnpm validate:changes`                   |
| 7   | Existing Unit Tests bleiben grün                           | `pnpm test`                                                                                    |
| 8   | Lint bleibt grün (75 Templates × neuer useCallback Import) | `pnpm lint`                                                                                    |
| 9   | Vue & Angular Templates unverändert                        | `git diff templates/vue templates/angular` empty                                               |
| 10  | `package.json` und `pnpm-lock.yaml` unverändert            | `git diff package.json pnpm-lock.yaml` empty                                                   |

## Smoke-Test-Matrix (repräsentative Komponenten)

| Komponente | Tier | Charakteristik                                       | Was getestet wird                                      |
| ---------- | ---- | ---------------------------------------------------- | ------------------------------------------------------ |
| Avatar     | Free | no methods                                           | Basic ref-flow ohne useImperativeHandle Methoden-Proxy |
| Animation  | Free | mehrere Methoden (cancel, finish)                    | Methoden-Lookup gegen WaAnimation Klasse               |
| TreeItem   | Free | Methode mit Parametern (getChildrenItems)            | Parameter-Typ-Matching gegen WaTreeItem                |
| Button     | Free | formStateRestoreCallback (komplexer Param-Typ)       | Komplexe Method-Signatur                               |
| Combobox   | Pro  | mehrere Methoden                                     | Pro-Shim-Klasse mit Methoden                           |
| Chart      | Pro  | no methods, Pro-only props                           | Pro-Shim Props-Inlining                                |
| Toast      | Pro  | Methode mit Pro-only Type-Param (ToastCreateOptions) | Pro-Shim type-only export                              |

Wenn alle 7 typecheck-clean sind, ist mit hoher Wahrscheinlichkeit auch die restlichen 68 Templates clean (gleichförmiger Generator-Output).

## PR-Sequenz innerhalb F-072

Single atomic PR. Commit-Sequenz für Reviewbarkeit:

1. **`feat(typecheck): accurate Pro shim + sync script`** — `typecheck-shims/wa-pro-paths.d.ts`, `typecheck-shims/wa-pro-jsx.d.ts`, `typecheck-shims/README.md`, `scripts/sync-wa-pro-shim.ts`
2. **`feat(generate-react): emit WaXxx ref + useCallback setter (F-072)`** — Generator-Patches in `scripts/generate-react-templates.ts`
3. **`chore(templates/react): regenerate (F-072)`** — 75 Template-Files via Generator-Run
4. **`docs(templates,changeset): F-072 fix notes`** — `templates/AGENTS.md` Update, `.changeset/<auto>.md`

Memory-Files (`~/.claude/projects/...`) sind außerhalb des Repos und werden assistant-side während der Session aktualisiert — nicht im PR enthalten. Dasselbe gilt für `kigumi-cli-overview.md`.

## Breaking-Change-Assessment

`XxxRef.element` ändert sich von `HTMLElement | null` zu `WaXxx | null`. `WaXxx` extends `HTMLElement` transitiv via `WebAwesomeElement` — alle DOM-Methoden bleiben verfügbar. Code wie `ref.current?.element?.click()` funktioniert weiterhin.

Nur Code mit explizitem `: HTMLElement` Annotation (sehr selten) müsste auf den breiteren Typ. Nicht-breaking semantisch: der Typ wird strenger/präziser, nicht inkompatibel.

**Versions-Impact:** Patch-Level (kein major bump nötig).

## Risiken und Mitigations

| Risiko                                                        | Wahrscheinlichkeit | Impact                   | Mitigation                                                                                                                                                                                                                                                                                     |
| ------------------------------------------------------------- | ------------------ | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| WA Free-Klasse fehlt für irgendeine Komponente                | niedrig            | hoch (PR blockt)         | Vorab Verification: für alle 60 Free-Komponenten verifizieren `node_modules/@awesome.me/webawesome/dist/components/<x>/<x>.d.ts` existiert + hat default-export class. Wenn nicht: Fallback zu `useRef<HTMLElement \| null>(null)` für die einzelne Komponente, dokumentieren als known-issue. |
| `useCallback` mit empty deps verursacht Render-Overhead       | niedrig            | niedrig                  | empty deps `[]` → stabile Identität. Kein Render-Overhead.                                                                                                                                                                                                                                     |
| `xRef.current.method()` in useImperativeHandle bricht für Pro | mittel             | mittel                   | Pro-Shim-Klassen haben Methoden inline (durch sync-script). Wenn COMPONENT_METADATA von echter Pro-API drift: typecheck failed laut, fixable per Hand.                                                                                                                                         |
| `pnpm-lock.yaml` Diff durch Pro-Install/Remove leakt          | mittel             | niedrig                  | Nach `pnpm add -D` sofort `git checkout package.json pnpm-lock.yaml .npmrc` ausführen, plus `pnpm remove` cleanup vor Commit. CI Quality-Checks prüft `--frozen-lockfile`. Acceptance Criterion #10.                                                                                           |
| Sync-Script-Bug emittet inkorrekten Shim                      | mittel             | hoch (silent regression) | Acceptance Criterion #1 (typecheck:templates exit 0) ist die Sicherheits-Schicht.                                                                                                                                                                                                              |
| Pro-Token-Auth schlägt lokal fehl                             | niedrig            | mittel                   | `pnpm setup:npmrc` ist battle-tested via existing docs/Storybook flow. Token existiert in `.env`.                                                                                                                                                                                              |

## Memory- + Backlog-Updates

| File                                                                      | Update                                                                                                                                                            |
| ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `~/.claude/projects/.../memory/project-fix-templates-react-ref-typing.md` | Option A → Option A + callback-ref Korrektur. Markieren als shipped mit PR-Nr. Hinweis: WAs `BaseProps<T>.ref` akzeptiert kein `RefObject` — nur `T \| callback`. |
| `~/.claude/projects/.../memory/project-fix-the-templates.md`              | F-072 von "⏳ NOT YET FIXED" → "✅ shipped (PR #X)".                                                                                                              |
| `~/.claude/projects/kigumi-cli-overview.md`                               | F-072-Header: append `\| **DONE (PR#X, 2026-04-25)**`.                                                                                                            |

## Out-of-scope (bewusst nicht in F-072)

- **Runtime-Verhalten Tests in echten Startern.** PR #125 (Phase B) Quality-Checks reicht plus existierende Integration-Tests R18/R19. Starter-Smoke-Test deferred zu Phase Z (separater Initiative).
- **Pro-Shim accuracy gegen aktuelle Pro-API Drift.** Mitigiert durch sync-script + maintainer responsibility. Kein autom. CI-Check für Shim-Drift.
- **Vue + Angular Templates.** F-072 ist React-only. Vue + Angular sind 0 Errors auf origin/main.
- **`typecheck:templates` als pre-commit Hook.** Phase C des Phase-4-Finalization-Plans (separate Initiative).

## Resume-Marker (für Phase B / Phase D)

Nach F-072-Merge auf `origin/main`:

1. PR #125 (`feat/template-typecheck-ci`) — CI-Re-Run triggern. Quality-Checks grün erwartet.
2. PR #125 ready-for-review (falls noch draft) → merge.
3. Phase D Tasks (separate Session): Spec-Status `2026-04-25-template-typecheck-coverage-design.md` von `Draft` → `Implemented`, F-072 Backlog-Flip in `kigumi-cli-overview.md`, finale Memory-Cleanup in `project-fix-the-templates.md`.
