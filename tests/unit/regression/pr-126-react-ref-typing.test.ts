/**
 * Protects: PR #126 / F-072
 * Bug: Generated React templates used `useRef<HTMLElement & { method?: ... }>`
 *      with a plain `ref={refObject}` prop. Web Awesome's JSX types declare
 *      `ref` as `T | ((e: T) => void)` (callback signature) and React 19's
 *      stricter ref typing surfaced the mismatch as TS2322 across every
 *      template that exposed an imperative method. Templates compiled before
 *      19 but failed type-check on every consumer using React 19.
 * Fix: 0bd3e2a69 (#126) — generator emits `useRef<WaXxx | null>(null)` plus a
 *      `useCallback` setter; the setter signature `(el: WaXxx | null) => void`
 *      satisfies WA's JSX ref slot. The Pro shim was enriched with method
 *      signatures from COMPONENT_METADATA so Pro components type-check too.
 *
 * Verification target: the generated templates checked into the repo
 * (templates/react/<Component>/<Component>.tsx). Reverting the generator
 * alone wouldn't break the suite; what ships to user projects is the output.
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../../../');

interface TemplateCheck {
  component: string;
  className: string;
  importPath: string;
}

const TEMPLATES: TemplateCheck[] = [
  {
    component: 'Button',
    className: 'WaButton',
    importPath: '@awesome.me/webawesome/dist/components/button/button.js',
  },
  {
    component: 'Input',
    className: 'WaInput',
    importPath: '@awesome.me/webawesome/dist/components/input/input.js',
  },
  {
    component: 'Switch',
    className: 'WaSwitch',
    importPath: '@awesome.me/webawesome/dist/components/switch/switch.js',
  },
];

describe('F-072: React templates use callback-ref + Wa<Component> typing', () => {
  it.each(TEMPLATES)(
    '$component.tsx imports type $className and uses callback-ref pattern',
    ({ component, className, importPath }) => {
      const file = path.join(
        REPO_ROOT,
        'templates/react',
        component,
        `${component}.tsx`
      );
      const source = fs.readFileSync(file, 'utf8');

      // Type-only import of the WA element class.
      expect(source).toContain(`import type ${className}`);
      expect(source).toContain(importPath);
      // Callback-ref pattern: useRef<Wa* | null>(null) + useCallback setter.
      expect(source).toMatch(new RegExp(`useRef<${className}\\s*\\|\\s*null>`));
      expect(source).toContain('useCallback');
      // Pre-fix templates used `ref={refObject}` directly. The fix wires the
      // ref through a `setXxxRef` callback. This regex pins both halves.
      expect(source).toMatch(/ref=\{set\w+Ref\}/);
    }
  );
});
