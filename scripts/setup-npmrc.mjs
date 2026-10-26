#!/usr/bin/env node

/**
 * Authenticate docs/ against the Web Awesome Pro package it installs.
 *
 * docs/package.json aliases `@awesome.me/webawesome-pro` to the copy the
 * kigumi-ui organization hosts on GitHub Packages, so every import keeps the
 * Pro package's own name. This writes the registry line for that scope and a
 * GitHub token that can read it to docs/.npmrc, which is gitignored (docs/
 * has no committed .npmrc).
 *
 * The token comes from GITHUB_PACKAGES_TOKEN (Vercel, CI), else from the
 * GitHub CLI's login (`gh auth token`, local development). It needs
 * `read:packages`. No other npmrc is touched.
 *
 * Zero dependencies - uses only Node.js built-ins.
 *
 * Usage:
 *   node scripts/setup-npmrc.mjs           write docs/.npmrc
 *   node scripts/setup-npmrc.mjs --probe   write it, then exit 1 unless the
 *                                          pinned package can be read with it
 */

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const ROOT_DIR = path.dirname(path.dirname(__filename));
const DOCS_DIR = path.join(ROOT_DIR, 'docs');

const ENV_TOKEN_KEY = 'GITHUB_PACKAGES_TOKEN';
const PRO_PACKAGE = '@awesome.me/webawesome-pro';
const PACKAGES_REGISTRY = 'https://npm.pkg.github.com';

/**
 * The aliased package docs/package.json pins, e.g.
 * `@kigumi-ui/webawesome-pro@3.14.0`, and the scope it lives under.
 */
export function readPinnedSpec(packageJson) {
  const range = packageJson.dependencies?.[PRO_PACKAGE] ?? '';
  const match = /^npm:(@[^/]+)\/([^@]+)@(.+)$/.exec(range);
  if (!match) {
    throw new Error(
      `docs/package.json must alias ${PRO_PACKAGE} as npm:@scope/name@version, found "${range}"`
    );
  }
  const [, scope, name, version] = match;
  return { scope, spec: `${scope}/${name}@${version}` };
}

/** The docs/.npmrc content for `scope` on GitHub Packages. */
export function docsNpmrc(scope, token) {
  const dart = PACKAGES_REGISTRY.replace(/^https?:/, '');
  return `${scope}:registry=${PACKAGES_REGISTRY}\n${dart}/:_authToken=${token}\n`;
}

function detectToken() {
  const fromEnv = process.env[ENV_TOKEN_KEY]?.trim();
  if (fromEnv) return { token: fromEnv, source: ENV_TOKEN_KEY };

  const gh = spawnSync('gh', ['auth', 'token'], { encoding: 'utf8' });
  const fromGh = gh.status === 0 ? gh.stdout.trim() : '';
  if (fromGh) return { token: fromGh, source: 'gh auth token' };

  return { token: null, source: null };
}

function main() {
  const probe = process.argv.includes('--probe');
  const { token, source } = detectToken();

  if (!token) {
    console.error(`No GitHub token for the Web Awesome Pro package.\n`);
    console.error(`Set ${ENV_TOKEN_KEY} to a token with read:packages, or`);
    console.error(
      'log in with the GitHub CLI: gh auth refresh -s read:packages'
    );
    process.exit(1);
  }

  const packageJson = JSON.parse(
    fs.readFileSync(path.join(DOCS_DIR, 'package.json'), 'utf8')
  );
  const { scope, spec } = readPinnedSpec(packageJson);
  fs.writeFileSync(path.join(DOCS_DIR, '.npmrc'), docsNpmrc(scope, token));
  console.log(`docs/.npmrc written for ${scope} (token from ${source})`);

  if (!probe) return;

  const view = spawnSync('npm', ['view', spec, 'version'], {
    cwd: DOCS_DIR,
    encoding: 'utf8',
  });
  if (view.status !== 0) {
    const reason =
      view.stderr.match(/npm error code (\S+)/)?.[1] ?? `exit ${view.status}`;
    console.error(`${spec} is not readable with this token (${reason})`);
    process.exit(1);
  }
  console.log(`${spec} is readable`);
}

if (
  process.argv[1] &&
  fs.realpathSync(process.argv[1]) === fs.realpathSync(__filename)
) {
  main();
}
