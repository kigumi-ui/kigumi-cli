/**
 * npmrc Utility
 *
 * PURPOSE: Knows where npm and pnpm find the Web Awesome Pro credential, and
 * owns Kigumi's lines in the project `.npmrc`.
 *
 * The Pro registry authenticates only through an npmrc. A token in
 * WEBAWESOME_NPM_TOKEN reaches the package manager through a
 * `${WEBAWESOME_NPM_TOKEN}` reference in one, never on its own, and neither
 * package manager reads the project `.env` (issue #160).
 *
 * EXPORTS:
 * - proRegistryToken() - the Pro token an npmrc gives npm, or null
 * - readsTokenFromEnv() - whether an npmrc reads the Pro token from
 *   WEBAWESOME_NPM_TOKEN
 * - tokenReferenceUnset() - whether the project reads it and it is unset
 * - userNpmrcPath() / readUserNpmrc() / readUserNpmrcSync() - the user config
 *   npm and pnpm read
 * - mergeProjectNpmrc() - project `.npmrc` text with Kigumi's lines applied
 * - writeProjectNpmrc() - apply that to the project, deciding the reference
 *
 * @see src/AGENTS.md "Pro Authentication"
 */

import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import {
  ENV_TOKEN_REFERENCE,
  MIN_TOKEN_LENGTH,
  NPM_PRO_AUTH_TOKEN_KEY,
  NPM_PRO_REGISTRY,
  NPM_PUBLIC_REGISTRY,
  NPMRC_FILE_NAME,
  WEB_AWESOME_SCOPE,
} from '../constants.js';
import type { Tier } from './tier.js';

/** The Pro registry as an npmrc auth key prefix ("nerf dart"). */
const PRO_REGISTRY_DART = NPM_PRO_REGISTRY.replace(/^https?:/, '').replace(
  /\/?$/,
  '/'
);

const SCOPE_REGISTRY_KEY = `${WEB_AWESOME_SCOPE}:registry`;

/** Any of these on a key means "auth for this registry path" to npm. */
const AUTH_FIELDS = [
  '_authToken',
  '_auth',
  '_password',
  'username',
  'certfile',
  'keyfile',
];

/**
 * The keys npm tries for the Pro registry, most specific first. npm walks up
 * the path, dropping either the last segment or the trailing slash, until it
 * finds any auth, and uses only that key's (npm-registry-fetch `getAuth`).
 */
const PRO_REGISTRY_DARTS: readonly string[] = (() => {
  const darts: string[] = [];
  let dart = PRO_REGISTRY_DART;
  while (dart.length > '//'.length) {
    darts.push(dart);
    dart = dart.replace(/([^/]+|\/)$/, '');
  }
  return darts;
})();

interface NpmrcEntry {
  key: string;
  value: string;
}

function parseLine(line: string): NpmrcEntry | null {
  const trimmed = line.trim();
  if (trimmed === '' || trimmed.startsWith('#') || trimmed.startsWith(';')) {
    return null;
  }
  const eq = trimmed.indexOf('=');
  if (eq === -1) return null;
  return {
    key: trimmed.slice(0, eq).trim(),
    value: trimmed.slice(eq + 1).trim(),
  };
}

/** Later lines win, as in npm's ini parser. */
function parseNpmrc(content: string): Map<string, string> {
  const entries = new Map<string, string>();
  for (const line of content.split(/\r?\n/)) {
    const entry = parseLine(line);
    if (entry) entries.set(entry.key, entry.value);
  }
  return entries;
}

/** Whether `key` is auth npm would use for the Pro registry. */
function coversProRegistry(key: string): boolean {
  const colon = key.lastIndexOf(':');
  return (
    colon !== -1 &&
    PRO_REGISTRY_DARTS.includes(key.slice(0, colon)) &&
    AUTH_FIELDS.includes(key.slice(colon + 1))
  );
}

/**
 * The raw `_authToken` value npm would use for the Pro registry, or
 * undefined when the auth it finds first is not a token, or there is none.
 */
function proAuthTokenValue(entries: Map<string, string>): string | undefined {
  for (const dart of PRO_REGISTRY_DARTS) {
    if (AUTH_FIELDS.some((field) => entries.has(`${dart}:${field}`))) {
      return entries.get(`${dart}:_authToken`);
    }
  }
  return undefined;
}

/** `${NAME}` references filled from `env`, or null if one is unset. */
function expandEnv(value: string, env: NodeJS.ProcessEnv): string | null {
  let unresolved = false;
  const expanded = value.replace(/\$\{([^${}]+)\}/g, (_match, name: string) => {
    const resolved = env[name];
    if (resolved === undefined) unresolved = true;
    return resolved ?? '';
  });
  return unresolved ? null : expanded;
}

/**
 * The Pro token npm would send with this npmrc, or null. A reference to an
 * unset variable is no token: npm would send the literal `${NAME}`.
 */
export function proRegistryToken(
  content: string,
  env: NodeJS.ProcessEnv
): string | null {
  const value = proAuthTokenValue(parseNpmrc(content));
  if (value === undefined) return null;
  const token = expandEnv(value, env)?.trim();
  return token && token.length >= MIN_TOKEN_LENGTH ? token : null;
}

/** Whether this npmrc reads the Pro token from WEBAWESOME_NPM_TOKEN. */
export function readsTokenFromEnv(content: string): boolean {
  return (
    proAuthTokenValue(parseNpmrc(content))?.includes(ENV_TOKEN_REFERENCE) ??
    false
  );
}

/**
 * The user config npm and pnpm read: `npm_config_userconfig` when set (npm
 * sets it for `npx` and scripts, CI actions point it at their own file),
 * else `~/.npmrc`. Null when KIGUMI_SKIP_GLOBAL_NPMRC is set, which tests use
 * to keep a developer's own token out.
 */
export function userNpmrcPath(
  env: NodeJS.ProcessEnv = process.env
): string | null {
  if (env.KIGUMI_SKIP_GLOBAL_NPMRC) return null;
  return (
    env.npm_config_userconfig ||
    env.NPM_CONFIG_USERCONFIG ||
    path.join(os.homedir(), '.npmrc')
  );
}

/** The user npmrc's text, or '' when there is none. */
export async function readUserNpmrc(
  env: NodeJS.ProcessEnv = process.env
): Promise<string> {
  const npmrcPath = userNpmrcPath(env);
  if (!npmrcPath || !(await fs.pathExists(npmrcPath))) return '';
  return fs.readFile(npmrcPath, 'utf-8');
}

/** Synchronous version of readUserNpmrc */
export function readUserNpmrcSync(
  env: NodeJS.ProcessEnv = process.env
): string {
  const npmrcPath = userNpmrcPath(env);
  if (!npmrcPath || !fs.existsSync(npmrcPath)) return '';
  return fs.readFileSync(npmrcPath, 'utf-8');
}

/**
 * The project `.npmrc` with Kigumi's lines applied. Kigumi owns the
 * `@awesome.me:registry` line and, on Pro, adds the token reference when
 * `referenceToken` is set and the project has no Pro auth of its own. Every
 * other line stays as it was, and an auth line the project already has is
 * never replaced. On Free the reference Kigumi writes is dropped: nothing
 * reads it, and with the variable unset pnpm ignores the whole file.
 */
export function mergeProjectNpmrc(
  existing: string,
  tier: Tier,
  referenceToken: boolean
): string {
  const eol = existing.includes('\r\n') ? '\r\n' : '\n';
  const lines = existing.split(/\r?\n/);
  if (lines[lines.length - 1] === '') lines.pop();

  const registry = tier === 'pro' ? NPM_PRO_REGISTRY : NPM_PUBLIC_REGISTRY;
  const registryLine = `${SCOPE_REGISTRY_KEY}=${registry}`;
  const out: string[] = [];
  let registryIndex = -1;
  let hasProAuth = false;

  for (const line of lines) {
    const entry = parseLine(line);
    if (entry?.key === SCOPE_REGISTRY_KEY) {
      if (registryIndex === -1) {
        registryIndex = out.length;
        out.push(registryLine);
      }
      continue;
    }
    if (entry && coversProRegistry(entry.key)) {
      if (
        tier === 'free' &&
        entry.key === NPM_PRO_AUTH_TOKEN_KEY &&
        entry.value === ENV_TOKEN_REFERENCE
      ) {
        continue;
      }
      hasProAuth = true;
    }
    out.push(line);
  }

  if (registryIndex === -1) {
    registryIndex = out.length;
    out.push(registryLine);
  }
  if (tier === 'pro' && referenceToken && !hasProAuth) {
    out.splice(
      registryIndex + 1,
      0,
      `${NPM_PRO_AUTH_TOKEN_KEY}=${ENV_TOKEN_REFERENCE}`
    );
  }

  return out.join(eol) + eol;
}

/**
 * Whether the project `.npmrc` reads the Pro token from WEBAWESOME_NPM_TOKEN
 * and `env` gives it none: a plain `npm install` there cannot authenticate.
 */
export async function tokenReferenceUnset(
  cwd: string,
  env: NodeJS.ProcessEnv = process.env
): Promise<boolean> {
  const npmrcPath = path.join(cwd, NPMRC_FILE_NAME);
  if (!(await fs.pathExists(npmrcPath))) return false;
  const content = await fs.readFile(npmrcPath, 'utf-8');
  return readsTokenFromEnv(content) && proRegistryToken(content, env) === null;
}

export interface ProjectNpmrcResult {
  /** Whether the file on disk changed. */
  changed: boolean;
  /** Whether the project now reads the Pro token from WEBAWESOME_NPM_TOKEN. */
  readsTokenFromEnv: boolean;
}

/**
 * Write the project `.npmrc` for `tier`, keeping the lines Kigumi does not
 * own. On Pro the token reference goes in unless the user npmrc already
 * gives npm the Pro token: a project line takes precedence over it, so with
 * the variable unset npm would send the literal reference (401) and pnpm
 * would skip the whole project `.npmrc` (404 from the public registry).
 */
export async function writeProjectNpmrc(
  cwd: string,
  tier: Tier
): Promise<ProjectNpmrcResult> {
  const npmrcPath = path.join(cwd, NPMRC_FILE_NAME);
  const existing = (await fs.pathExists(npmrcPath))
    ? await fs.readFile(npmrcPath, 'utf-8')
    : '';
  const referenceToken =
    tier === 'pro' &&
    proRegistryToken(await readUserNpmrc(), process.env) === null;

  const next = mergeProjectNpmrc(existing, tier, referenceToken);
  const changed = next !== existing;
  if (changed) await fs.writeFile(npmrcPath, next);

  return { changed, readsTokenFromEnv: readsTokenFromEnv(next) };
}
