/**
 * A cancelled run leaves a red check on the PR's head commit that no later
 * run replaces when the later run's check has another name. ci.yml cancelled
 * a push's run when "Ready for review" followed seconds later; a matrix job
 * cancelled before its matrix resolved keeps the name
 * "Starter E2E (${{ matrix.framework }})", which no later run reuses (#215).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

const ROOT = join(__dirname, '..', '..');

interface Workflow {
  concurrency?: unknown;
}

function workflow(name: string): Workflow {
  return parse(
    readFileSync(join(ROOT, '.github', 'workflows', name), 'utf8')
  ) as Workflow;
}

/**
 * Whether a run started by a `pull_request` event with `action` cancels the
 * group's running run. Reads `false`, `true` and
 * `${{ github.event.action == '<action>' }}` only; any other shape fails the
 * test rather than being guessed at.
 */
function cancels(value: unknown, action: string): boolean {
  if (typeof value === 'boolean') return value;
  const match =
    typeof value === 'string'
      ? /^\$\{\{\s*github\.event\.action == '([a-z_]+)'\s*\}\}$/.exec(value)
      : null;
  if (!match)
    throw new Error(`unreadable cancel-in-progress: ${String(value)}`);
  return match[1] === action;
}

describe('ci.yml cancels a run only for a newer commit', () => {
  const concurrency = workflow('ci.yml').concurrency as {
    'cancel-in-progress': unknown;
  };

  it('a push cancels the run of the commit it replaces', () => {
    expect(cancels(concurrency['cancel-in-progress'], 'synchronize')).toBe(
      true
    );
  });

  it.each(['ready_for_review', 'labeled', 'opened', 'reopened'])(
    '%s on the same commit queues instead of cancelling',
    (action) => {
      expect(cancels(concurrency['cancel-in-progress'], action)).toBe(false);
    }
  );
});
