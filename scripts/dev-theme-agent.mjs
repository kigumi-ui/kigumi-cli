#!/usr/bin/env node

/**
 * Run Studio with a working Theme Agent on localhost.
 *
 * Default: `trigger dev` runs the task on this machine in trigger.dev's dev
 * environment, and Vite serves Studio plus /api/theme-agent with that
 * environment's secret key. Changes under docs/trigger/ apply to the next
 * message, and Production stays untouched.
 *
 * --deployed: Vite only, against the task deployed to Production.
 *
 * Keys come from docs/.env.local and docs/.env, both gitignored, or the
 * shell. In a git worktree the main checkout's files are read first and the
 * worktree's own over them, so the keys need no copy per worktree. A missing
 * key stops the script before anything starts. Setup: docs/src/kigumi-studio/AGENTS.md, "Trying it
 * locally". Run from docs/: pnpm dev:agent [--deployed].
 */

import { execFileSync, spawn, spawnSync } from 'node:child_process';
import fs, { realpathSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseEnv } from 'node:util';

const SETUP = 'docs/src/kigumi-studio/AGENTS.md, "Trying it locally"';

/** Keys only Vite and the Function use, never handed to the local task. */
const VITE_ONLY_KEYS = [
  'TRIGGER_SECRET_KEY',
  'TRIGGER_PROD_SECRET_KEY',
  'THEME_AGENT_ACCESS_KEY',
];

/**
 * @typedef {Record<string, string | undefined>} Env
 * @typedef {{ name: 'trigger' | 'vite', args: string[], env: Env }} AgentProcess
 *   `name` is the binary in docs/node_modules/.bin.
 * @typedef {{ ok: true, environment: 'dev' | 'prod', processes: AgentProcess[] }
 *   | { ok: false, problems: string[] }} LocalAgentPlan
 */

/**
 * Decide what to start from the keys at hand, or every reason not to.
 * `processEnv` wins over `envLocal` (docs/.env.local), which wins over
 * `envFile` (docs/.env). `trigger dev` hands its own environment to the
 * local task, so it gets the shell's environment and the Anthropic key, and
 * none of the keys only Vite needs.
 *
 * @param {{ deployed: boolean, processEnv: Env, envLocal: Env, envFile: Env }} input
 * @returns {LocalAgentPlan}
 */
export function planLocalAgent({ deployed, processEnv, envLocal, envFile }) {
  const env = { ...envFile, ...envLocal, ...processEnv };
  const problems = [];

  if (!env.THEME_AGENT_ACCESS_KEY) {
    problems.push(
      'THEME_AGENT_ACCESS_KEY is not set: any value of your choice in docs/.env.local, and the same value in the kigumi-theme-agent cookie on localhost.'
    );
  }

  const keyName = deployed ? 'TRIGGER_PROD_SECRET_KEY' : 'TRIGGER_SECRET_KEY';
  const prefix = deployed ? 'tr_prod_' : 'tr_dev_';
  const environmentName = deployed ? 'Production' : 'dev';
  const secretKey = env[keyName];
  if (!secretKey) {
    problems.push(
      `${keyName} is not set: the trigger.dev ${environmentName} environment's secret key (${prefix}…) in docs/.env.local.`
    );
  } else if (!secretKey.startsWith(prefix)) {
    problems.push(
      `${keyName} must be the trigger.dev ${environmentName} environment's secret key, which starts with ${prefix}.`
    );
  }

  if (!deployed && !env.ANTHROPIC_API_KEY) {
    problems.push(
      'ANTHROPIC_API_KEY is not set: your Anthropic key, for the local task, in docs/.env.local or docs/.env.'
    );
  }

  if (problems.length > 0) return { ok: false, problems };

  // The trigger CLI authenticates with its own login (`trigger login`), and
  // whatever is in its environment reaches the task.
  const triggerEnv = Object.fromEntries(
    Object.entries(processEnv).filter(([key]) => !VITE_ONLY_KEYS.includes(key))
  );
  triggerEnv.ANTHROPIC_API_KEY = env.ANTHROPIC_API_KEY;
  /** @type {AgentProcess} */
  const vite = {
    name: 'vite',
    args: [],
    env: {
      ...env,
      TRIGGER_SECRET_KEY: secretKey,
      THEME_AGENT_LOCAL: '1',
    },
  };
  return deployed
    ? { ok: true, environment: 'prod', processes: [vite] }
    : {
        ok: true,
        environment: 'dev',
        processes: [
          {
            name: 'trigger',
            args: ['dev'],
            env: triggerEnv,
          },
          vite,
        ],
      };
}

/**
 * The docs/ directories whose env files count, lowest precedence first: in a
 * git worktree the main checkout's docs/, then the worktree's own.
 *
 * @param {{ docsDir: string, commonGitDir: string | undefined }} input
 *   `commonGitDir` is `git rev-parse --git-common-dir`, absolute.
 * @returns {string[]}
 */
export function envFileDirs({ docsDir, commonGitDir }) {
  if (!commonGitDir) return [docsDir];
  const mainDocsDir = path.join(path.dirname(commonGitDir), 'docs');
  return mainDocsDir === docsDir ? [docsDir] : [mainDocsDir, docsDir];
}

function readCommonGitDir() {
  try {
    return execFileSync(
      'git',
      ['rev-parse', '--path-format=absolute', '--git-common-dir'],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }
    ).trim();
  } catch (_error) {
    // Not a git checkout (an extracted archive): docs/ alone counts.
    return undefined;
  }
}

/** @param {string[]} dirs @param {string} name */
function readEnvFiles(dirs, name) {
  return Object.assign(
    {},
    ...dirs.map((dir) => {
      const file = path.join(dir, name);
      return fs.existsSync(file) ? parseEnv(fs.readFileSync(file, 'utf8')) : {};
    })
  );
}

function main() {
  const deployed = process.argv.includes('--deployed');
  const dirs = envFileDirs({
    docsDir: realpathSync(process.cwd()),
    commonGitDir: readCommonGitDir(),
  });
  const plan = planLocalAgent({
    deployed,
    processEnv: process.env,
    envLocal: readEnvFiles(dirs, '.env.local'),
    envFile: readEnvFiles(dirs, '.env'),
  });

  if (!plan.ok) {
    console.error('Theme Agent not started:\n');
    for (const problem of plan.problems) console.error(`  - ${problem}`);
    console.error(`\nSetup: ${SETUP}`);
    process.exit(1);
  }

  // `trigger dev` without a login would fail after Vite is already serving:
  // a page whose agent never answers. Check before starting anything.
  if (plan.environment === 'dev') {
    const whoami = spawnSync(
      path.resolve('node_modules', '.bin', 'trigger'),
      ['whoami'],
      { stdio: 'ignore' }
    );
    if (whoami.status !== 0) {
      console.error(
        `Theme Agent not started:\n\n  - trigger.dev CLI is not logged in: run \`pnpm exec trigger login\` once.\n\nSetup: ${SETUP}`
      );
      process.exit(1);
    }
  }

  console.log(
    plan.environment === 'dev'
      ? 'Theme Agent: trigger.dev dev environment. The task runs here (trigger dev); changes under docs/trigger/ apply to the next message.'
      : 'Theme Agent: trigger.dev Production. The deployed task answers; local changes under docs/trigger/ do not apply.'
  );

  // Ctrl+C reaches the children through the terminal's process group; the
  // parent only waits for them to finish, and reports nothing as a failure.
  let stopping = false;
  process.on('SIGINT', () => {
    stopping = true;
  });
  // A SIGTERM or SIGHUP reaches only this process: pass it on, or the
  // children outlive it.
  for (const signal of /** @type {const} */ (['SIGTERM', 'SIGHUP'])) {
    process.on(signal, () => {
      stopping = true;
      for (const child of children) {
        if (child.exitCode === null) child.kill(signal);
      }
    });
  }

  const children = plan.processes.map(({ name, args, env }) => {
    const bin = path.resolve('node_modules', '.bin', name);
    const child = spawn(bin, args, { stdio: 'inherit', env });
    child.on('exit', (code) => {
      if (stopping) return;
      // One process gone leaves a half-working page: stop the other too.
      stopping = true;
      console.error(
        `\n${name} stopped (exit code ${code}); stopping the rest.`
      );
      for (const other of children) {
        if (other !== child && other.exitCode === null) other.kill('SIGINT');
      }
      process.exitCode = code || 1;
    });
    return child;
  });
}

if (
  process.argv[1] &&
  realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))
) {
  main();
}
