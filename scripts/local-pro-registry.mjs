#!/usr/bin/env node

/**
 * A local registry that serves Web Awesome Pro under its own name, for the
 * Pro consumer suites in CI.
 *
 * `kigumi init` installs `@awesome.me/webawesome-pro` from the Pro registry,
 * Cloudsmith unless KIGUMI_PRO_REGISTRY names another. The kigumi-ui
 * organization hosts its licensed copy on GitHub Packages as
 * `@kigumi-ui/webawesome-pro`, which `init` cannot install by that name. This
 * runs Verdaccio on 127.0.0.1, republishes that copy there as
 * `@awesome.me/webawesome-pro`, and hands back a token for it, so the suites
 * run `init` against KIGUMI_PRO_REGISTRY exactly as a Pro user's install does:
 * the token sits in the user npmrc, `init` finds it there and writes only the
 * registry line.
 *
 * The registry accepts only authenticated reads, listens on loopback alone,
 * and serves nothing but the `@awesome.me` scope; everything else resolves
 * from the public registry as usual.
 *
 * Usage:
 *   GITHUB_PACKAGES_TOKEN=... node scripts/local-pro-registry.mjs fetch <dir>
 *     npm pack the version docs/package.json pins into <dir>
 *   node scripts/local-pro-registry.mjs serve <tarball>
 *     start the registry, republish the tarball, print `token=` and
 *     `registry=` lines (also to $GITHUB_OUTPUT when set, the token masked)
 */

import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readPinnedSpec } from './setup-npmrc.mjs';

const __filename = fileURLToPath(import.meta.url);
const ROOT_DIR = path.dirname(path.dirname(__filename));

/** Verdaccio 7 needs Node 24; CI runs Node 22. */
const VERDACCIO_VERSION = '6.10.5';
const HOST = '127.0.0.1';
const PORT = 4873;
export const LOCAL_REGISTRY = `http://${HOST}:${PORT}`;
const PRO_PACKAGE = '@awesome.me/webawesome-pro';

/** Verdaccio config: loopback only, `@awesome.me` for logged-in users only. */
export function verdaccioConfig(storage, htpasswd) {
  return [
    `storage: ${JSON.stringify(storage)}`,
    'auth:',
    '  htpasswd:',
    `    file: ${JSON.stringify(htpasswd)}`,
    '    max_users: 1',
    'uplinks: {}',
    'packages:',
    "  '@awesome.me/*':",
    '    access: $authenticated',
    '    publish: $authenticated',
    "  '**':",
    '    access: $authenticated',
    '    publish: $authenticated',
    'listen:',
    `  - ${HOST}:${PORT}`,
    'log: { type: stdout, format: pretty, level: warn }',
    '',
  ].join('\n');
}

/** The tarball's package.json, renamed to the Pro package it stands in for. */
export function asProPackage(manifest) {
  const renamed = { ...manifest, name: PRO_PACKAGE };
  // The organization copy points publishConfig at GitHub Packages, which
  // would override --registry and send the republish there.
  delete renamed.publishConfig;
  return renamed;
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { encoding: 'utf8', ...options });
  if (result.status !== 0) {
    throw new Error(
      `${command} ${args[0]} failed (exit ${result.status}): ${(result.stderr || result.stdout || '').trim().split('\n').slice(-3).join(' | ')}`
    );
  }
  return result.stdout;
}

function fetchTarball(destination) {
  const token = process.env.GITHUB_PACKAGES_TOKEN?.trim();
  if (!token) throw new Error('GITHUB_PACKAGES_TOKEN is not set');

  const packageJson = JSON.parse(
    fs.readFileSync(path.join(ROOT_DIR, 'docs', 'package.json'), 'utf8')
  );
  const { scope, spec } = readPinnedSpec(packageJson);
  fs.mkdirSync(destination, { recursive: true });

  // A throwaway userconfig, removed before anything else runs, so the token
  // never lands in an npmrc a later step could read.
  const configDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kigumi-pkgs-'));
  const userconfig = path.join(configDir, 'userconfig');
  fs.writeFileSync(
    userconfig,
    `${scope}:registry=https://npm.pkg.github.com\n//npm.pkg.github.com/:_authToken=${token}\n`
  );
  try {
    const out = run('npm', [
      'pack',
      spec,
      '--pack-destination',
      destination,
      '--userconfig',
      userconfig,
      '--ignore-scripts',
      '--json',
    ]);
    const [{ filename }] = JSON.parse(out);
    console.log(path.join(destination, filename));
  } finally {
    fs.rmSync(configDir, { recursive: true, force: true });
  }
}

async function waitForRegistry() {
  for (let attempt = 0; attempt < 240; attempt++) {
    try {
      const response = await fetch(`${LOCAL_REGISTRY}/-/ping`);
      if (response.ok) return;
    } catch (_error) {
      // Not listening yet: npx may still be downloading Verdaccio.
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`the local registry did not start on ${LOCAL_REGISTRY}`);
}

async function createUser() {
  const name = 'kigumi-ci';
  const password = `p-${process.pid}-${Date.now()}`;
  const response = await fetch(
    `${LOCAL_REGISTRY}/-/user/org.couchdb.user:${name}`,
    {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name, password }),
    }
  );
  const body = await response.json();
  if (!response.ok || typeof body.token !== 'string') {
    throw new Error(`creating the registry user failed (${response.status})`);
  }
  return body.token;
}

async function serve(tarball) {
  if (!fs.existsSync(tarball)) throw new Error(`no tarball at ${tarball}`);

  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'kigumi-registry-'));
  const config = path.join(home, 'config.yaml');
  fs.writeFileSync(
    config,
    verdaccioConfig(path.join(home, 'storage'), path.join(home, 'htpasswd'))
  );

  const log = fs.openSync(path.join(home, 'verdaccio.log'), 'a');
  const server = spawn(
    'npx',
    ['--yes', `verdaccio@${VERDACCIO_VERSION}`, '--config', config],
    { detached: true, stdio: ['ignore', log, log] }
  );
  server.unref();
  await waitForRegistry();
  const token = await createUser();

  const unpacked = path.join(home, 'package');
  fs.mkdirSync(unpacked);
  run('tar', ['-xzf', tarball, '-C', unpacked, '--strip-components=1']);
  const manifestPath = path.join(unpacked, 'package.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  fs.writeFileSync(
    manifestPath,
    `${JSON.stringify(asProPackage(manifest), null, 2)}\n`
  );

  const userconfig = path.join(home, 'userconfig');
  fs.writeFileSync(
    userconfig,
    `${LOCAL_REGISTRY.replace(/^https?:/, '')}/:_authToken=${token}\n`
  );
  run(
    'npm',
    [
      'publish',
      '--registry',
      LOCAL_REGISTRY,
      '--userconfig',
      userconfig,
      '--ignore-scripts',
    ],
    { cwd: unpacked }
  );
  fs.rmSync(userconfig);

  const output = process.env.GITHUB_OUTPUT;
  if (output) {
    console.log(`::add-mask::${token}`);
    fs.appendFileSync(output, `token=${token}\nregistry=${LOCAL_REGISTRY}\n`);
  }
  console.log(`${PRO_PACKAGE}@${manifest.version} served at ${LOCAL_REGISTRY}`);
}

async function main() {
  const [command, target] = process.argv.slice(2);
  if (command === 'fetch' && target) return fetchTarball(path.resolve(target));
  if (command === 'serve' && target) return serve(path.resolve(target));
  throw new Error(
    'usage: local-pro-registry.mjs fetch <dir> | serve <tarball>'
  );
}

if (
  process.argv[1] &&
  fs.realpathSync(process.argv[1]) === fs.realpathSync(__filename)
) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
