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
 * and whether each one's body opens with the guard. A call that passes
 * anything but a named handler (an inline arrow, a bound method) cannot be
 * read, so it counts as unguarded rather than going unseen.
 */
function unguardedHandlers(source: string): {
  registered: number;
  unguarded: string[];
} {
  const calls = [...source.matchAll(/addEventListener\(\s*([^)]*)/g)];
  const names = new Set<string>();
  const unreadable: string[] = [];
  for (const [, args] of calls) {
    const named = /^'[^']+',\s*(\w+)\s*$/.exec(args.trim());
    if (named) names.add(named[1]);
    else unreadable.push(`addEventListener(${args.trim()}`);
  }
  const unguarded = [...names].filter((name) => {
    const definition = new RegExp(
      `const ${name} = \\((?:e|e: Event)\\) => \\{\\s*([^\\n]*)`
    ).exec(source);
    return definition?.[1]?.trim() !== GUARD;
  });
  return { registered: calls.length, unguarded: [...unguarded, ...unreadable] };
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

  it('reports an inline listener it cannot read', () => {
    const source = `el.addEventListener('wa-hide', (e) => onHide?.(e));`;
    expect(unguardedHandlers(source).unguarded).toHaveLength(1);
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
