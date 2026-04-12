/**
 * Registry Content Fetcher
 *
 * Fetches registry.json and component files from registry sources.
 * Supports GitHub repositories (via raw content API) and local
 * filesystem paths (for sibling repos in monorepo / multi-repo setups).
 */

import os from 'os';
import path from 'path';
import fs from 'fs-extra';
import {
  type CommunityRegistry,
  validateCommunityRegistry,
} from '../schemas/community-registry.js';
import { GITHUB_RAW_BASE_URL } from '../constants.js';

/**
 * Parsed GitHub registry source
 */
export interface GitHubRegistrySource {
  /** Discriminator for the union with LocalRegistrySource */
  kind: 'github';
  /** Original URL */
  url: string;
  /** Repository owner */
  owner: string;
  /** Repository name */
  repo: string;
  /** Branch (defaults to "main") */
  branch: string;
  /** Optional GitHub PAT for private repos */
  token?: string;
}

/**
 * Parsed local filesystem registry source.
 *
 * Used for sibling repositories: e.g. when a Vue project at
 * `/path/to/kigumi-vue` wants to consume a registry at
 * `/path/to/kigumi-react`, the user can pass `../kigumi-react` to
 * `kigumi registry connect` or `kigumi add --from`.
 */
export interface LocalRegistrySource {
  /** Discriminator for the union with GitHubRegistrySource */
  kind: 'local';
  /**
   * Resolved absolute path to the directory containing `registry.json`.
   * Stored in `url` as well for display purposes and dedup keys.
   */
  url: string;
  /** Resolved absolute path (same as `url` for local sources) */
  absolutePath: string;
}

/**
 * A parsed registry source — either remote GitHub or local filesystem.
 */
export type RegistrySource = GitHubRegistrySource | LocalRegistrySource;

/**
 * Detect whether an input string looks like a local filesystem path.
 *
 * Recognized prefixes: `./`, `../`, `/`, `~`. Anything else is treated
 * as a (possibly schemeless) GitHub URL by `parseRegistrySource`.
 */
function isLocalPathInput(input: string): boolean {
  const trimmed = input.trim();
  return (
    trimmed.startsWith('./') ||
    trimmed.startsWith('../') ||
    trimmed.startsWith('/') ||
    trimmed === '.' ||
    trimmed === '..' ||
    trimmed.startsWith('~/') ||
    trimmed === '~'
  );
}

/**
 * Resolve a local-path input to an absolute path.
 *
 * - `~` and `~/...` resolve against `os.homedir()`
 * - Relative paths resolve against `baseDir` (default: `process.cwd()`)
 * - Absolute paths pass through
 */
function resolveLocalPath(input: string, baseDir?: string): string {
  const trimmed = input.trim();
  if (trimmed === '~' || trimmed.startsWith('~/')) {
    const rest = trimmed === '~' ? '' : trimmed.slice(2);
    return path.join(os.homedir(), rest);
  }
  if (path.isAbsolute(trimmed)) {
    return trimmed;
  }
  return path.resolve(baseDir ?? process.cwd(), trimmed);
}

/**
 * Options accepted by `parseRegistrySource`.
 */
export interface ParseRegistrySourceOptions {
  /**
   * Directory used to resolve relative local paths. Defaults to
   * `process.cwd()`. Pass an explicit value when the call site has
   * its own working-directory context (e.g. `addCommand({ cwd })`).
   */
  baseDir?: string;
}

/**
 * Parse a registry source string into a structured `RegistrySource`.
 *
 * Accepts:
 * - GitHub URLs: `https://github.com/user/repo`,
 *   `https://github.com/user/repo/tree/branch`, `github.com/user/repo`
 * - Local paths: `./foo`, `../sibling`, `/abs/path`, `~/projects/foo`
 *
 * @throws Error if the input is neither a valid GitHub URL nor a
 *   recognizable local path
 */
export function parseRegistrySource(
  input: string,
  options?: ParseRegistrySourceOptions
): RegistrySource {
  if (isLocalPathInput(input)) {
    const absolutePath = resolveLocalPath(input, options?.baseDir);
    return {
      kind: 'local',
      url: absolutePath,
      absolutePath,
    };
  }
  return parseGitHubUrl(input);
}

/**
 * Parse a GitHub URL into its components
 *
 * Supports formats:
 * - https://github.com/user/repo
 * - https://github.com/user/repo/tree/branch
 * - github.com/user/repo
 *
 * For local filesystem paths, prefer `parseRegistrySource`.
 *
 * @throws Error if URL is not a valid GitHub repository URL
 */
export function parseGitHubUrl(url: string): GitHubRegistrySource {
  // Normalize URL
  let normalized = url.trim();
  if (!normalized.startsWith('http')) {
    normalized = `https://${normalized}`;
  }

  // Remove trailing slashes
  normalized = normalized.replace(/\/+$/, '');

  let parsed: URL;
  try {
    parsed = new URL(normalized);
  } catch (error) {
    throw new Error(`Invalid URL: ${url}`, { cause: error });
  }

  if (parsed.hostname !== 'github.com') {
    throw new Error(`Only GitHub URLs are supported. Got: ${parsed.hostname}`);
  }

  const pathParts = parsed.pathname.split('/').filter(Boolean);

  if (pathParts.length < 2) {
    throw new Error(
      `Invalid GitHub repository URL: ${url}. Expected format: https://github.com/owner/repo`
    );
  }

  const owner = pathParts[0];
  const repo = pathParts[1];

  // Check for branch in URL: /tree/branch-name
  let branch = 'main';
  if (pathParts.length >= 4 && pathParts[2] === 'tree') {
    branch = pathParts.slice(3).join('/');
  }

  return {
    kind: 'github',
    url: `https://github.com/${owner}/${repo}`,
    owner,
    repo,
    branch,
  };
}

/**
 * Build a raw content URL for a file in a GitHub repo
 */
export function buildRawUrl(
  source: GitHubRegistrySource,
  filePath: string
): string {
  const cleanPath = filePath.replace(/^\//, '');
  return `${GITHUB_RAW_BASE_URL}/${source.owner}/${source.repo}/${source.branch}/${cleanPath}`;
}

/**
 * Fetch a file from a registry source.
 *
 * - GitHub source: downloads via the raw content API
 * - Local source: reads directly from the filesystem under `absolutePath`
 *
 * @param source - Registry source (GitHub or local filesystem)
 * @param filePath - Path relative to the registry root
 * @returns File content as string
 */
export async function fetchFile(
  source: RegistrySource,
  filePath: string
): Promise<string> {
  if (source.kind === 'local') {
    const cleanPath = filePath.replace(/^\//, '');
    const absoluteFilePath = path.join(source.absolutePath, cleanPath);
    try {
      return await fs.readFile(absoluteFilePath, 'utf-8');
    } catch (error) {
      const errno = error as NodeJS.ErrnoException;
      if (errno.code === 'ENOENT') {
        throw new Error(
          `File not found: ${filePath} in ${source.absolutePath}`,
          { cause: error }
        );
      }
      throw new Error(
        `Failed to read ${filePath} from ${source.absolutePath}: ${errno.message}`,
        { cause: error }
      );
    }
  }

  const url = buildRawUrl(source, filePath);
  const headers: Record<string, string> = {
    'User-Agent': 'kigumi-cli',
  };

  if (source.token) {
    headers['Authorization'] = `token ${source.token}`;
  }

  const response = await fetch(url, { headers });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`File not found: ${filePath} in ${source.url}`);
    }
    if (response.status === 401 || response.status === 403) {
      throw new Error(
        `Authentication failed for ${source.url}. ` +
          'Provide a GitHub token for private repositories.'
      );
    }
    throw new Error(
      `Failed to fetch ${filePath} from ${source.url}: ${response.status} ${response.statusText}`
    );
  }

  return response.text();
}

/**
 * Fetch and validate registry.json from a registry source.
 *
 * @param source - Registry source (GitHub or local filesystem)
 * @returns Validated community registry
 */
export async function fetchRegistryJson(
  source: RegistrySource
): Promise<CommunityRegistry> {
  const content = await fetchFile(source, 'registry.json');

  let data: unknown;
  try {
    data = JSON.parse(content);
  } catch (error) {
    throw new Error(`Invalid JSON in registry.json from ${source.url}`, {
      cause: error,
    });
  }

  return validateCommunityRegistry(data);
}
