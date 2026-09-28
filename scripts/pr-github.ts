/**
 * The GitHub half of the PR body and PR log guards (issue #150): thin calls
 * through `gh api`. `{owner}/{repo}` resolves from `GH_REPO` (set in CI) or
 * the git remote of the working directory, so the same calls work locally.
 *
 * Deliberately thin and not unit-tested: every decision lives in
 * `pr-body-rules.ts`, and these calls only fetch and post.
 */

import { execFileSync } from 'child_process';

function ghApi(args: string[], input?: string): string {
  return execFileSync('gh', ['api', ...args], {
    encoding: 'utf8',
    input,
    stdio: ['pipe', 'pipe', 'pipe'],
    maxBuffer: 64 * 1024 * 1024,
  });
}

function stderrOf(error: unknown): string {
  const stderr = (error as { stderr?: unknown }).stderr;
  return typeof stderr === 'string' ? stderr.trim() : String(error);
}

/**
 * Whether issue or PR #N exists. Only a 404 means "no": any other failure
 * (network, rate limit, auth) throws, so an unreachable API can never read
 * as a missing issue (ADR 0003).
 */
export function issueExists(issue: number): boolean {
  try {
    ghApi([`repos/{owner}/{repo}/issues/${issue}`, '--silent']);
    return true;
  } catch (error) {
    if (/HTTP 404/.test(stderrOf(error))) return false;
    throw new Error(`could not look up #${issue}: ${stderrOf(error)}`, {
      cause: error,
    });
  }
}

export interface PullRequestComment {
  id: number;
  authorAssociation: string;
  body: string;
}

/** Every comment on the PR's conversation tab, oldest first. */
export function prComments(pr: number): PullRequestComment[] {
  const out = ghApi([
    '--paginate',
    `repos/{owner}/{repo}/issues/${pr}/comments`,
    '--jq',
    '.[] | [.id, .author_association, .body] | @json',
  ]);
  return out
    .split('\n')
    .filter((line) => line !== '')
    .map((line) => {
      const [id, authorAssociation, body] = JSON.parse(line) as [
        number,
        string,
        string | null,
      ];
      return { id, authorAssociation, body: body ?? '' };
    });
}

export function postComment(pr: number, body: string): void {
  ghApi(
    [
      '--method',
      'POST',
      `repos/{owner}/{repo}/issues/${pr}/comments`,
      '--input',
      '-',
    ],
    JSON.stringify({ body })
  );
}

export interface PullRequestInfo {
  number: number;
  draft: boolean;
  authorType: string;
  headRef: string;
  headSha: string;
  /** The head branch lives in this repository, not in a fork. */
  sameRepo: boolean;
  baseRef: string;
  /** Seconds since the epoch. */
  createdAt: number;
}

export function pullRequest(pr: number): PullRequestInfo {
  const raw = JSON.parse(ghApi([`repos/{owner}/{repo}/pulls/${pr}`])) as {
    number: number;
    draft: boolean;
    created_at: string;
    user: { type: string };
    // `repo` is null once a fork's repository is deleted.
    head: { ref: string; sha: string; repo: { full_name: string } | null };
    base: { ref: string; repo: { full_name: string } };
  };
  return {
    number: raw.number,
    draft: raw.draft,
    authorType: raw.user.type,
    headRef: raw.head.ref,
    headSha: raw.head.sha,
    sameRepo: raw.head.repo?.full_name === raw.base.repo.full_name,
    baseRef: raw.base.ref,
    createdAt: Math.floor(Date.parse(raw.created_at) / 1000),
  };
}

/** Sets a commit status on `sha`. Needs `statuses: write`. */
export function setStatus(
  sha: string,
  status: {
    context: string;
    state: string;
    description: string;
    targetUrl?: string;
  }
): void {
  ghApi(
    [
      '--method',
      'POST',
      `repos/{owner}/{repo}/statuses/${sha}`,
      '--input',
      '-',
    ],
    JSON.stringify({
      context: status.context,
      state: status.state,
      description: status.description,
      target_url: status.targetUrl,
    })
  );
}
