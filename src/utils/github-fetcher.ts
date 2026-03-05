/**
 * GitHub Content Fetcher
 *
 * Fetches registry.json and component files from GitHub repositories
 * using the raw content API.
 */

import {
  type CommunityRegistry,
  validateCommunityRegistry,
} from '../schemas/community-registry.js';
import { GITHUB_RAW_BASE_URL } from '../constants.js';

/**
 * Parsed GitHub registry source
 */
export interface GitHubRegistrySource {
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
 * Parse a GitHub URL into its components
 *
 * Supports formats:
 * - https://github.com/user/repo
 * - https://github.com/user/repo/tree/branch
 * - github.com/user/repo
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
  } catch {
    throw new Error(`Invalid URL: ${url}`);
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
 * Fetch a file from a GitHub repository
 *
 * @param source - GitHub registry source
 * @param filePath - Path relative to repo root
 * @returns File content as string
 */
export async function fetchFile(
  source: GitHubRegistrySource,
  filePath: string
): Promise<string> {
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
 * Fetch and validate registry.json from a GitHub repository
 *
 * @param source - GitHub registry source
 * @returns Validated community registry
 */
export async function fetchRegistryJson(
  source: GitHubRegistrySource
): Promise<CommunityRegistry> {
  const content = await fetchFile(source, 'registry.json');

  let data: unknown;
  try {
    data = JSON.parse(content);
  } catch {
    throw new Error(`Invalid JSON in registry.json from ${source.url}`);
  }

  return validateCommunityRegistry(data);
}
