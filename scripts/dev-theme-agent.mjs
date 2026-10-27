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
 * Keys come from docs/.env.local (and the Anthropic key from there or
 * docs/.env); both are gitignored. A missing key stops the script before
 * anything starts. Setup: docs/src/kigumi-studio/AGENTS.md, "Trying it
 * locally". Run from docs/: pnpm dev:agent [--deployed].
 */

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import { realpathSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseEnv } from 'node:util';

const SETUP = 'docs/src/kigumi-studio/AGENTS.md, "Trying it locally"';

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
 * `envFile` (docs/.env). The Anthropic key counts only from the two files:
 * `trigger dev` hands the local task what those files hold, not its own
 * environment.
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

  if (!deployed && !(envLocal.ANTHROPIC_API_KEY || envFile.ANTHROPIC_API_KEY)) {
    problems.push(
      'ANTHROPIC_API_KEY is not set in docs/.env.local or docs/.env: the local task reads it from there.'
    );
  }

  if (problems.length > 0) return { ok: false, problems };

  // The trigger CLI authenticates with its own login (`trigger login`); a
  // secret key in its environment is never what it should use.
  const { TRIGGER_SECRET_KEY: _unused, ...triggerEnv } = env;
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

/** @param {string} file */
function readEnvFile(file) {
  return fs.existsSync(file) ? parseEnv(fs.readFileSync(file, 'utf8')) : {};
}

function main() {
  const deployed = process.argv.includes('--deployed');
  const plan = planLocalAgent({
    deployed,
    processEnv: process.env,
    envLocal: readEnvFile(path.resolve('.env.local')),
    envFile: readEnvFile(path.resolve('.env')),
  });

  if (!plan.ok) {
    console.error('Theme Agent not started:\n');
    for (const problem of plan.problems) console.error(`  - ${problem}`);
    console.error(`\nSetup: ${SETUP}`);
    process.exit(1);
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
