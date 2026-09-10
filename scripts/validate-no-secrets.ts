#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Committed-Secret Checker
 *
 * PURPOSE: this repository is public. Anything committed to it is visible to
 * everyone, and a credential pushed to a public repo must be treated as burned
 * even after it is deleted, because the object stays reachable in forks, clones
 * and caches. Rotating is the only real remedy, so the cheap win is never
 * committing one in the first place.
 *
 * This is not hypothetical: a live Chromatic project token sat in
 * `docs/package.json` as `--project-token=chpt_...` while CI read the same
 * credential from a repository secret. The workflow treated it as secret and
 * the local convenience script did not.
 *
 * CHECKS (all fail the build), over tracked files only:
 * - A provider-prefixed credential (Chromatic, npm, GitHub, Slack, AWS,
 *   OpenAI, Anthropic, Stripe live keys) appearing as a literal.
 * - A `.env` file that is tracked by git. `.env.example` is fine and expected.
 * - An absolute path into a developer's home directory. Not a credential, but
 *   it leaks the maintainer's username to every clone and breaks on every
 *   other machine. Both husky hooks carried one.
 *
 * WHY PREFIX MATCHING AND NOT ENTROPY:
 * entropy scanners flag every hash, fixture and minified bundle, so the
 * signal drowns and the check gets disabled. A provider prefix like `chpt_`
 * or `ghp_` is a near-certain true positive, which is what makes failing the
 * build on it defensible. Broad-spectrum scanning is gitleaks' job, run
 * separately; this guard is the narrow, always-on tripwire.
 *
 * PLACEHOLDERS ARE ALLOWED so docs and tests can show the real shape:
 * anything whose secret body is obviously fake (`your_token_here`, `xxx`,
 * `example`, repeated characters, or the sequential `abc123.../abcdefghij...`
 * used by the existing fixtures) passes.
 *
 * USAGE:
 *   pnpm validate:no-secrets
 *   tsx scripts/validate-no-secrets.ts
 */

import { execFileSync } from 'node:child_process';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import pc from 'picocolors';

const __filename = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.dirname(path.dirname(__filename));

/**
 * Credential patterns keyed by the provider prefix that makes them
 * unambiguous. Each `pattern` must capture the secret body in group 1 so
 * `isPlaceholder` can inspect it.
 */
const CREDENTIAL_PATTERNS: ReadonlyArray<{
  readonly name: string;
  readonly pattern: RegExp;
}> = [
  { name: 'Chromatic project token', pattern: /\bchpt_([A-Za-z0-9]{8,})/g },
  { name: 'npm access token', pattern: /\bnpm_([A-Za-z0-9]{20,})/g },
  {
    name: 'GitHub token',
    pattern: /\bgh[pousr]_([A-Za-z0-9]{20,})/g,
  },
  {
    name: 'Slack token',
    pattern: /\bxox[baprs]-([A-Za-z0-9-]{10,})/g,
  },
  { name: 'AWS access key id', pattern: /\b(?:AKIA|ASIA)([A-Z0-9]{16})/g },
  { name: 'OpenAI API key', pattern: /\bsk-proj-([A-Za-z0-9_-]{20,})/g },
  { name: 'Anthropic API key', pattern: /\bsk-ant-([A-Za-z0-9_-]{20,})/g },
  { name: 'Stripe live key', pattern: /\bsk_live_([A-Za-z0-9]{16,})/g },
  { name: 'Google API key', pattern: /\bAIza([A-Za-z0-9_-]{35})/g },
];

/**
 * True when a matched secret body is obviously not a real credential.
 *
 * Docs and fixtures legitimately show the SHAPE of a token, and failing on
 * those would make the check unusable. Real credentials from these providers
 * are high-entropy and mixed-case; placeholders are not.
 */
export function isPlaceholder(secret: string): boolean {
  const lower = secret.toLowerCase();

  // Named placeholders.
  if (
    /(your|my|the)?_?(token|key|secret|api)_?(here|goes)?/.test(lower) &&
    /your|here|goes|placeholder|example|dummy|fake|sample|redacted|changeme/.test(
      lower
    )
  ) {
    return true;
  }
  if (/^(x{4,}|0{4,}|1{4,}|a{4,})$/.test(lower)) return true;

  // Sequential filler: abc123def456..., abcdefghij1234567890, 1234567890...
  if (/^(?:abc|abcdef|1234|test|demo|foo|bar)/.test(lower)) return true;

  // A body with no digits AND no uppercase is very unlikely to be real for
  // these providers, and is the shape hand-written placeholders take.
  if (!/[0-9]/.test(secret) && !/[A-Z]/.test(secret)) return true;

  return false;
}

export interface SecretFinding {
  readonly file: string;
  readonly line: number;
  readonly kind: string;
  readonly excerpt: string;
}

/**
 * Scan one file's text for credential literals.
 *
 * Pure: takes content, returns findings. The caller decides which files to
 * feed it, which is what keeps this testable without touching a filesystem.
 */
export function findSecretsInText(
  file: string,
  content: string
): SecretFinding[] {
  const findings: SecretFinding[] = [];
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    for (const { name, pattern } of CREDENTIAL_PATTERNS) {
      // The patterns are global and shared across calls, but the loop below
      // always runs `exec` to completion, and the null result that ends it is
      // what resets `lastIndex`. So no state survives to the next line or the
      // next file, and no explicit reset is needed. Break out of this loop
      // early and that stops being true.
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(line)) !== null) {
        const body = match[1] ?? '';
        if (isPlaceholder(body)) continue;
        findings.push({
          file,
          line: idx + 1,
          kind: name,
          // Redact so the check does not reprint the credential in CI logs.
          excerpt: `${match[0].slice(0, 8)}${'*'.repeat(8)}`,
        });
      }
    }
  });

  return findings;
}

/**
 * Absolute paths into a developer's home directory.
 *
 * Not a credential, but the same class of mistake: it leaks the maintainer's
 * username to every clone and is useless to anyone else, because the path does
 * not exist on their machine. Two husky hooks carried a hard-coded
 * `/Users/<name>/Library/...` interpreter path for exactly this reason.
 *
 * Only the tracked-file case matters; inside a gitignored local file is the
 * correct place for such a path.
 */
const HOME_PATH_PATTERN = /\/(?:Users|home)\/([A-Za-z0-9._-]+)\//g;

/** Home directories that documentation and CI legitimately reference. */
const GENERIC_HOME_USERS = new Set([
  'you',
  'user',
  'username',
  'name',
  'me',
  'someone',
  'your-name',
  'yourname',
  'dev',
  'developer',
  'runner',
  'ubuntu',
  'root',
  'node',
]);

export function findHomePaths(file: string, content: string): SecretFinding[] {
  const findings: SecretFinding[] = [];

  content.split('\n').forEach((line, idx) => {
    let match: RegExpExecArray | null;
    while ((match = HOME_PATH_PATTERN.exec(line)) !== null) {
      const user = match[1] ?? '';
      if (GENERIC_HOME_USERS.has(user.toLowerCase())) continue;
      findings.push({
        file,
        line: idx + 1,
        kind: 'absolute home-directory path',
        excerpt: match[0],
      });
    }
  });

  return findings;
}

/**
 * A tracked `.env` is always wrong: the convention here is `.env.example`
 * committed, `.env` ignored.
 */
export function findTrackedEnvFiles(trackedFiles: string[]): string[] {
  return trackedFiles.filter((f) => {
    const base = path.basename(f);
    if (!base.startsWith('.env')) return false;
    return !base.endsWith('.example') && !base.endsWith('.sample');
  });
}

function listTrackedFiles(): string[] {
  const out = execFileSync('git', ['ls-files', '-z'], {
    cwd: PROJECT_ROOT,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  return out.split('\0').filter(Boolean);
}

/** Binary assets, where a match would only ever be coincidence. */
const BINARY_EXT =
  /\.(png|jpe?g|gif|webp|avif|ico|svg|woff2?|ttf|eot|pdf|zip|gz|mp4|webm)$/i;

export function isScannable(file: string): boolean {
  return !BINARY_EXT.test(file);
}

/**
 * The one file allowed to contain credential-shaped literals.
 *
 * This guard's own tests must carry realistic tokens, otherwise they cannot
 * prove the matchers fire. Exempting the test file rather than weakening the
 * patterns keeps the check strict everywhere it matters. The exemption is a
 * single exact path, not a glob, so it cannot quietly widen: a second file
 * wanting in has to be added deliberately here.
 */
const EXEMPT_FILES: ReadonlySet<string> = new Set([
  'tests/unit/scripts/validate-no-secrets.test.ts',
]);

export interface SecretScanResult {
  readonly passed: boolean;
  readonly filesScanned: number;
  readonly findings: SecretFinding[];
  readonly trackedEnvFiles: string[];
}

export function validateNoSecrets(): SecretScanResult {
  const tracked = listTrackedFiles();
  const trackedEnvFiles = findTrackedEnvFiles(tracked);
  const findings: SecretFinding[] = [];
  let filesScanned = 0;

  for (const file of tracked) {
    if (!isScannable(file)) continue;
    if (EXEMPT_FILES.has(file)) continue;
    const abs = path.join(PROJECT_ROOT, file);
    let content: string;
    try {
      const stat = fs.statSync(abs);
      // Skip very large files: a credential is never megabytes long, and
      // reading generated bundles wastes the whole budget.
      if (!stat.isFile() || stat.size > 2 * 1024 * 1024) continue;
      content = fs.readFileSync(abs, 'utf8');
    } catch {
      continue;
    }
    filesScanned++;
    findings.push(...findSecretsInText(file, content));
    findings.push(...findHomePaths(file, content));
  }

  return {
    passed: findings.length === 0 && trackedEnvFiles.length === 0,
    filesScanned,
    findings,
    trackedEnvFiles,
  };
}

function printResults(result: SecretScanResult): void {
  console.log(
    pc.cyan('\nScanning tracked files for committed credentials...\n')
  );

  if (result.trackedEnvFiles.length > 0) {
    console.log(
      pc.red(`Tracked .env files (${result.trackedEnvFiles.length}):`)
    );
    for (const f of result.trackedEnvFiles) {
      console.log(pc.red(`  ${f}`));
    }
    console.log('');
  }

  if (result.findings.length > 0) {
    console.log(pc.red(`Findings (${result.findings.length}):`));
    for (const f of result.findings) {
      console.log(pc.red(`  ${f.file}:${f.line}  ${f.kind}  ${f.excerpt}`));
    }
    console.log('');
    console.log(
      pc.yellow(
        'Fix: move the value to a repository secret (CI) and a gitignored\n' +
          '.env (local), then document it in the matching .env.example.\n' +
          'Rotate the credential: anything committed must be treated as burned.\n'
      )
    );
  }

  if (result.passed) {
    console.log(
      pc.green(
        `Secret validation passed! No credentials in ${result.filesScanned} tracked files.\n`
      )
    );
  } else {
    console.log(
      pc.red(
        `Secret validation failed with ${
          result.findings.length + result.trackedEnvFiles.length
        } error(s)\n`
      )
    );
  }
}

// ── CLI Entry ───────────────────────────────────────────────────────────────

function main(): void {
  try {
    const result = validateNoSecrets();
    printResults(result);
    process.exit(result.passed ? 0 : 1);
  } catch (error) {
    console.error(pc.red('Fatal error during secret validation:'));
    console.error(error);
    process.exit(1);
  }
}

// Only run when executed directly, not when imported (keeps the script testable)
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
