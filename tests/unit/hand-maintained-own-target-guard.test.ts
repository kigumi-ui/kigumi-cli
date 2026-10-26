/**
 * Web Awesome's events bubble, so a wrapper that forwards whatever reaches
 * its element reports a nested component's event as its own: a Dropdown
 * closing inside a Dialog fires the Dialog's onHide (#213). The generated
 * Templates are proven by the function harnesses; the `.jsx` Templates and
 * the docs wrappers are written by hand and run by no harness, so this reads
 * them: every handler they register on their element opens with the guard.
 */

import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

const SOURCES = [
  { dir: 'templates/react', extension: '.jsx' },
  { dir: 'docs/src/components/ui', extension: '.tsx' },
] as const;

const GUARD = 'if (e.target !== e.currentTarget) return;';

function files(dir: string, extension: string): string[] {
  return readdirSync(join(ROOT, dir), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => join(dir, entry.name, `${entry.name}${extension}`))
    .filter((file) => existsSync(join(ROOT, file)));
}

/**
 * The handlers a source registers with `addEventListener('<event>', name)`
 * and whether each one's body opens with the guard.
 */
function unguardedHandlers(source: string): {
  registered: number;
  unguarded: string[];
} {
  const names = new Set(
    [...source.matchAll(/addEventListener\(\s*'[^']+',\s*(\w+)/g)].map(
      (match) => match[1]
    )
  );
  const unguarded = [...names].filter((name) => {
    const definition = new RegExp(
      `const ${name} = \\((?:e|e: Event)\\) => \\{\\s*([^\\n]*)`
    ).exec(source);
    return definition?.[1]?.trim() !== GUARD;
  });
  return { registered: names.size, unguarded };
}

describe('unguardedHandlers', () => {
  it('reports a handler that forwards without the guard', () => {
    const source = `
      const handleHide = (e) => {
        onHide?.(e);
      };
      el.addEventListener('wa-hide', handleHide);`;
    expect(unguardedHandlers(source)).toEqual({
      registered: 1,
      unguarded: ['handleHide'],
    });
  });

  it('accepts a handler that opens with the guard', () => {
    const source = `
      const handleHide = (e: Event) => {
        ${GUARD}
        onHide?.(e as WaHideEvent);
      };
      el.addEventListener('wa-hide', handleHide);`;
    expect(unguardedHandlers(source)).toEqual({
      registered: 1,
      unguarded: [],
    });
  });
});

describe.each(SOURCES)('$dir$extension handlers', ({ dir, extension }) => {
  const sources = files(dir, extension);

  it('finds sources that register handlers', () => {
    const registered = sources.reduce(
      (total, file) =>
        total +
        unguardedHandlers(readFileSync(join(ROOT, file), 'utf8')).registered,
      0
    );
    expect(registered).toBeGreaterThan(0);
  });

  it.each(sources)("%s ignores a descendant's bubbled event", (file) => {
    const { unguarded } = unguardedHandlers(
      readFileSync(join(ROOT, file), 'utf8')
    );
    expect(unguarded).toEqual([]);
  });
});
