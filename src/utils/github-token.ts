/**
 * GitHub Token Resolution
 *
 * Resolves a GitHub personal access token from multiple sources
 * for accessing private registry repositories.
 */

import { execa } from 'execa';

/**
 * Resolve a GitHub token from available sources
 *
 * Resolution order:
 * 1. GITHUB_TOKEN environment variable
 * 2. KIGUMI_GITHUB_TOKEN environment variable
 * 3. `gh auth token` CLI output (if gh is installed)
 *
 * @returns Token string or undefined if not found
 */
export async function getGitHubToken(): Promise<string | undefined> {
  // 1. GITHUB_TOKEN env var
  const githubToken = process.env.GITHUB_TOKEN;
  if (githubToken?.trim()) {
    return githubToken.trim();
  }

  // 2. KIGUMI_GITHUB_TOKEN env var
  const kigumiToken = process.env.KIGUMI_GITHUB_TOKEN;
  if (kigumiToken?.trim()) {
    return kigumiToken.trim();
  }

  // 3. Try gh CLI
  try {
    const { stdout } = await execa('gh', ['auth', 'token']);
    const token = stdout.trim();
    if (token) {
      return token;
    }
  } catch (_error) {
    // gh not installed or not authenticated — that's fine
  }

  return undefined;
}
