#!/usr/bin/env npx tsx
/* eslint-disable no-console */
/**
 * Update Starter Snapshots
 *
 * Bulk-regenerates `tests/fixtures/starter-snapshots/<framework>/` for all four
 * starter clones. Iterates each starter, copies it to a tmp directory (skipping
 * node_modules, .git, and common build-artifact dirs for speed), runs `kigumi
 * add` for the curated component set, then runs the snapshot harness in update
 * mode.
 *
 * The user's local starter clones are never mutated; all work happens in tmp
 * copies that are removed afterwards.
 *
 * Required env vars (one per starter you want to update):
 *   STARTER_REACT_DIR    /path/to/kigumi-react clone
 *   STARTER_VUE_DIR      /path/to/kigumi-vue clone
 *   STARTER_ANGULAR_DIR  /path/to/kigumi-angular clone
 *   STARTER_NEXT_DIR     /path/to/kigumi-next-starter clone
 *
 * Starters without their env var set are skipped with a clear error message.
 *
 * Usage:
 *   pnpm run update:starter-snapshots                 # all configured starters
 *   pnpm run update:starter-snapshots -- --framework react
 *   pnpm run update:starter-snapshots -- --keep-tmp   # skip tmp cleanup
 */

import { execa } from 'execa';
import fs from 'fs-extra';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pc from 'picocolors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const CLI_PATH = path.join(ROOT_DIR, 'dist/index.js');

const COMPONENTS = [
  'button',
  'input',
  'select',
  'dialog',
  'card',
  'badge',
  'switch',
  'textarea',
  'tooltip',
] as const;

interface Starter {
  framework: string;
  clone: string;
}

const STARTER_ENV_VARS = {
  react: 'STARTER_REACT_DIR',
  vue: 'STARTER_VUE_DIR',
  angular: 'STARTER_ANGULAR_DIR',
  next: 'STARTER_NEXT_DIR',
} as const;

type StarterFramework = keyof typeof STARTER_ENV_VARS;

function isStarterFramework(value: string): value is StarterFramework {
  return value in STARTER_ENV_VARS;
}

function resolveStarters(filter?: string): Starter[] {
  const frameworks: StarterFramework[] = filter
    ? isStarterFramework(filter)
      ? [filter]
      : []
    : (Object.keys(STARTER_ENV_VARS) as StarterFramework[]);

  if (filter && frameworks.length === 0) {
    console.error(
      pc.red(
        `unknown framework "${filter}". Known: ${Object.keys(STARTER_ENV_VARS).join(', ')}`
      )
    );
    return [];
  }

  const out: Starter[] = [];
  for (const framework of frameworks) {
    const envVar = STARTER_ENV_VARS[framework];
    const clone = process.env[envVar];
    if (!clone) {
      console.error(
        pc.red(
          `  ${framework}: set ${envVar}=/path/to/kigumi-${framework} clone`
        )
      );
      continue;
    }
    out.push({ framework, clone });
  }
  return out;
}

interface Args {
  framework?: string;
  keepTmp: boolean;
}

function parseArgs(argv: string[]): Args {
  const out: Args = { keepTmp: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--framework' || arg === '-f') {
      out.framework = argv[++i];
    } else if (arg === '--keep-tmp') {
      out.keepTmp = true;
    } else if (arg === '--help' || arg === '-h') {
      console.log(
        'Usage: pnpm run update:starter-snapshots [-- --framework <name>] [--keep-tmp]'
      );
      process.exit(0);
    }
  }
  return out;
}

const COPY_EXCLUDES = new Set([
  'node_modules',
  '.git',
  'dist',
  '.next',
  '.angular',
  '.turbo',
]);

async function copyStarter(src: string, dest: string): Promise<void> {
  await fs.cp(src, dest, {
    recursive: true,
    filter: (source) => !COPY_EXCLUDES.has(path.basename(source)),
  });
}

async function processStarter(
  starter: Starter,
  args: Args
): Promise<{ ok: boolean; tmpDir: string }> {
  const tmpRoot = await fs.mkdtemp(
    path.join(os.tmpdir(), `kigumi-starter-snapshot-${starter.framework}-`)
  );

  try {
    console.log(pc.dim(`  copying ${starter.clone} → ${tmpRoot}`));
    await copyStarter(starter.clone, tmpRoot);

    if (!(await fs.pathExists(path.join(tmpRoot, 'kigumi.config.json')))) {
      console.error(
        pc.red(
          `  ${starter.framework}: no kigumi.config.json in clone, skipping`
        )
      );
      return { ok: false, tmpDir: tmpRoot };
    }

    console.log(pc.dim(`  kigumi add ${COMPONENTS.join(' ')}`));
    await execa('node', [CLI_PATH, 'add', ...COMPONENTS, '--force', '--yes'], {
      cwd: tmpRoot,
      stdio: 'inherit',
    });

    console.log(pc.dim('  running snapshot harness in --update mode'));
    await execa(
      'pnpm',
      [
        'exec',
        'vitest',
        'run',
        'tests/e2e/starter-snapshots.test.ts',
        '--config',
        'vitest.e2e.config.ts',
        '--testTimeout=600000',
        '--update',
      ],
      {
        cwd: ROOT_DIR,
        stdio: 'inherit',
        env: {
          ...process.env,
          KIGUMI_STARTER: starter.framework,
          KIGUMI_STARTER_DIR: tmpRoot,
        },
      }
    );

    return { ok: true, tmpDir: tmpRoot };
  } catch (err) {
    console.error(
      pc.red(`  failed for ${starter.framework}: ${(err as Error).message}`)
    );
    return { ok: false, tmpDir: tmpRoot };
  } finally {
    if (!args.keepTmp) {
      await fs.remove(tmpRoot);
    }
  }
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  console.log(pc.cyan('\n=== Update Starter Snapshots ===\n'));

  if (!(await fs.pathExists(CLI_PATH))) {
    console.error(
      pc.red(`CLI not built at ${CLI_PATH}. Run 'pnpm build' first.`)
    );
    process.exit(1);
  }

  const targets = resolveStarters(args.framework);

  if (targets.length === 0) {
    console.error(
      pc.red(
        '\nNo starters resolved. Set STARTER_<F>_DIR env vars (see script header) and retry.'
      )
    );
    process.exit(1);
  }

  const results: { framework: string; ok: boolean; tmpDir: string }[] = [];

  for (const starter of targets) {
    console.log(pc.bold(`\n→ ${starter.framework} (${starter.clone})`));
    if (!(await fs.pathExists(starter.clone))) {
      console.error(pc.red(`  clone not found at ${starter.clone}, skipping`));
      results.push({ framework: starter.framework, ok: false, tmpDir: '' });
      continue;
    }
    const result = await processStarter(starter, args);
    results.push({ framework: starter.framework, ...result });
  }

  console.log(pc.cyan('\n=== Summary ===\n'));
  for (const r of results) {
    const tag = r.ok ? pc.green('OK   ') : pc.red('FAIL ');
    const trail = args.keepTmp && r.tmpDir ? pc.dim(`  tmp: ${r.tmpDir}`) : '';
    console.log(`  ${tag} ${r.framework}${trail}`);
  }

  const failed = results.filter((r) => !r.ok).length;
  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(pc.red(String(err)));
  process.exit(1);
});
