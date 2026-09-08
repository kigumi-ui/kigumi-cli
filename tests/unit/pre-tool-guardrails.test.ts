/**
 * Behavioural tests for the PreToolUse guardrail hook.
 *
 * The hook is shell, so it is driven end to end: each case builds a throwaway
 * git repo (or worktree), pipes a real tool-call payload into the script and
 * asserts the decision. Asserting on the script's source text instead would
 * pass while the logic was broken, which is the failure mode this initiative
 * exists to remove.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const HOOK = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../.claude/hooks/pre-tool-guardrails.sh'
);

function git(cwd: string, ...args: string[]): void {
  execFileSync('git', args, { cwd, stdio: 'pipe' });
}

/** Runs the hook with a payload and returns its stdout (empty means allow). */
function runHook(
  cwd: string,
  payload: unknown,
  env: NodeJS.ProcessEnv = {}
): string {
  return execFileSync('bash', [HOOK], {
    cwd,
    input: JSON.stringify(payload),
    encoding: 'utf8',
    env: { ...process.env, ...env },
  });
}

function decisionOf(output: string): string | null {
  if (output.trim() === '') return null;
  return JSON.parse(output).hookSpecificOutput.permissionDecision;
}

const edit = { tool_name: 'Edit', tool_input: { file_path: 'src/index.ts' } };

let root: string;
let mainRepo: string;
let worktree: string;

beforeAll(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'kigumi-hook-'));
  mainRepo = path.join(root, 'repo');
  worktree = path.join(root, 'repo', 'wt');

  fs.mkdirSync(mainRepo);
  git(mainRepo, 'init', '-b', 'main');
  git(mainRepo, 'config', 'user.email', 'test@example.com');
  git(mainRepo, 'config', 'user.name', 'Test');
  fs.writeFileSync(path.join(mainRepo, 'seed.txt'), 'seed\n');
  git(mainRepo, 'add', '.');
  git(mainRepo, 'commit', '-m', 'seed', '--no-verify');
  git(mainRepo, 'worktree', 'add', worktree, '-b', 'feature');
});

afterAll(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

describe('default-branch guard', () => {
  it('denies Edit on the default branch', () => {
    expect(decisionOf(runHook(mainRepo, edit))).toBe('deny');
  });

  it('names the branch and the way out', () => {
    const reason = JSON.parse(runHook(mainRepo, edit)).hookSpecificOutput
      .permissionDecisionReason;
    expect(reason).toContain('main');
    expect(reason).toContain('git worktree add');
    expect(reason).toContain('KIGUMI_ALLOW_MAIN=1');
  });

  it('denies Write and git commit on the default branch', () => {
    expect(
      decisionOf(
        runHook(mainRepo, {
          tool_name: 'Write',
          tool_input: { file_path: 'a.ts' },
        })
      )
    ).toBe('deny');
    expect(
      decisionOf(
        runHook(mainRepo, {
          tool_name: 'Bash',
          tool_input: { command: 'git commit -m x' },
        })
      )
    ).toBe('deny');
  });

  it('allows the same Edit inside a worktree', () => {
    expect(decisionOf(runHook(worktree, edit))).toBeNull();
  });

  it('honours the KIGUMI_ALLOW_MAIN escape hatch', () => {
    expect(
      decisionOf(runHook(mainRepo, edit, { KIGUMI_ALLOW_MAIN: '1' }))
    ).toBeNull();
  });

  it('leaves read-only work on the default branch alone', () => {
    for (const command of ['git status', 'ls -la', 'cat package.json']) {
      expect(
        decisionOf(
          runHook(mainRepo, { tool_name: 'Bash', tool_input: { command } })
        )
      ).toBeNull();
    }
  });
});

describe('pre-existing guardrails still apply', () => {
  it('still blocks git reset --hard', () => {
    // Checked inside a worktree, so the branch guard cannot be what denies it.
    const out = runHook(worktree, {
      tool_name: 'Bash',
      tool_input: { command: 'git reset --hard HEAD' },
    });
    expect(decisionOf(out)).toBe('deny');
    expect(
      JSON.parse(out).hookSpecificOutput.permissionDecisionReason
    ).toContain('destructive');
  });

  it('still blocks writes to .env', () => {
    const out = runHook(worktree, {
      tool_name: 'Write',
      tool_input: { file_path: '.env' },
    });
    expect(decisionOf(out)).toBe('deny');
    expect(
      JSON.parse(out).hookSpecificOutput.permissionDecisionReason
    ).toContain('.env');
  });

  it('still allows an ordinary command', () => {
    expect(
      decisionOf(
        runHook(worktree, {
          tool_name: 'Bash',
          tool_input: { command: 'pnpm test' },
        })
      )
    ).toBeNull();
  });
});
