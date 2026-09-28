/**
 * The GitHub half of the PR body and PR log guards (issue #150): thin calls
 * through `gh api`. `{owner}/{repo}` resolves from `GH_REPO` (set in CI) or
 * the git remote of the working directory, so the same calls work locally.
 *
 * Deliberately thin and not unit-tested: every decision lives in
 * `pr-body-rules.ts`, and these calls only fetch and post.
 */

import { execFileSync } from 'child_process';

import type { BodyRevision } from './pr-body-rules.js';

function ghApi(args: string[], input?: string): string {
  return execFileSync('gh', ['api', ...args], {
    encoding: 'utf8',
    input,
    stdio: ['pipe', 'pipe', 'pipe'],
    maxBuffer: 64 * 1024 * 1024,
  });
}

function lines(output: string): string[] {
  return output.split('\n').filter((line) => line !== '');
}

function seconds(isoTime: string): number {
  return Math.floor(Date.parse(isoTime) / 1000);
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
  return lines(out).map((line) => {
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
  body: string;
}

export function pullRequest(pr: number): PullRequestInfo {
  const raw = JSON.parse(ghApi([`repos/{owner}/{repo}/pulls/${pr}`])) as {
    number: number;
    draft: boolean;
    created_at: string;
    body: string | null;
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
    createdAt: seconds(raw.created_at),
    body: raw.body ?? '',
  };
}

const BODY_REVISIONS = `
  query($owner: String!, $repo: String!, $pr: Int!, $endCursor: String) {
    repository(owner: $owner, name: $repo) {
      pullRequest(number: $pr) {
        userContentEdits(first: 100, after: $endCursor) {
          pageInfo { hasNextPage endCursor }
          nodes { editedAt diff }
        }
      }
    }
  }`;

/**
 * The PR body's edit history, oldest first, the original body included:
 * GitHub's `diff` holds each revision's whole text, despite its name, and
 * null once a revision is deleted from the history. Empty while the body
 * was never edited.
 */
export function bodyRevisions(pr: number): BodyRevision[] {
  const out = ghApi([
    'graphql',
    '--paginate',
    '-F',
    'owner={owner}',
    '-F',
    'repo={repo}',
    '-F',
    `pr=${pr}`,
    '-f',
    `query=${BODY_REVISIONS}`,
    '--jq',
    '.data.repository.pullRequest.userContentEdits.nodes[] | [.editedAt, .diff] | @json',
  ]);
  return lines(out)
    .map((line) => {
      const [editedAt, body] = JSON.parse(line) as [string, string | null];
      return { editedAt: seconds(editedAt), body };
    })
    .reverse();
}

/**
 * When the PR was last marked ready for review, or null when it never was:
 * it was opened ready, or it is still a draft.
 */
export function lastReadyForReview(pr: number): number | null {
  const times = lines(
    ghApi([
      '--paginate',
      `repos/{owner}/{repo}/issues/${pr}/timeline`,
      '--jq',
      '.[] | select(.event == "ready_for_review") | .created_at',
    ])
  ).map(seconds);
  return times.length === 0 ? null : Math.max(...times);
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
