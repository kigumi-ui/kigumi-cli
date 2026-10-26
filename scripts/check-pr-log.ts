#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * PR Log Coverage (issue #150, ADR 0006)
 *
 * PURPOSE: every session that pushes to a PR posts one log comment headed
 * `**Round N** · Covers: a..b`. This checks that every commit committed
 * after the PR was opened sits inside some log comment's range, and reports
 * the result as the `pr-log` commit status on the PR's head. Committer time
 * stands in for push time, which GitHub does not expose per commit; a rebase
 * renews it, so rewritten commits need a new round too.
 *
 * Why a commit status and not a job result: `pr-log.yml` also runs on
 * `issue_comment` (a new log comment can fix a failing check), and a job
 * started by a comment is attached to main, not to the PR. So the job stays
 * green unless this script itself breaks, and the status is the signal.
 *
 * Safe on untrusted PRs: it fetches the PR's commits and reads them with
 * `git log` / `git rev-list`, and never runs code from the PR branch.
 *
 * USAGE:
 *   tsx scripts/check-pr-log.ts --pr 150                  local: print, exit 1 on failure
 *   tsx scripts/check-pr-log.ts --pr 150 --post-status    CI: set the status, exit 0
 */

import pc from 'picocolors';

import { isEntryPoint } from './is-entry-point.js';
import {
  branchCommits,
  prMergeBase,
  rangeResolver,
} from './pr-body-context.js';
import {
  isExempt,
  isTrustedAuthor,
  logCoverage,
  logExitCode,
  logInputs,
  logStatus,
  requiredCommits,
  type LogCoverage,
  type LogStatus,
} from './pr-body-rules.js';
import {
  prComments,
  pullRequest,
  setStatus,
  type PullRequestInfo,
} from './pr-github.js';

const CONTEXT = 'pr-log';

function flag(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

const NOTHING: LogCoverage = {
  uncovered: [],
  unparseable: [],
  stale: [],
  rounds: 0,
};

type PrComment = ReturnType<typeof prComments>[number];

function check(
  pr: PullRequestInfo,
  prCommentList: readonly PrComment[]
): {
  status: LogStatus;
  coverage: LogCoverage;
  commits: ReturnType<typeof branchCommits>;
} {
  const exempt = isExempt(pr);
  if (exempt || pr.draft) {
    const status = logStatus({
      exempt,
      draft: pr.draft,
      branchCommits: 0,
      required: 0,
      baseMerges: 0,
      coverage: NOTHING,
    });
    return { status, coverage: NOTHING, commits: [] };
  }

  const base = prMergeBase(process.cwd(), pr);
  const commits = branchCommits(process.cwd(), base, pr.headSha);
  const { required, baseMerges } = requiredCommits(commits, pr.createdAt);
  const comments = prCommentList.map((c) => ({
    id: c.id,
    body: c.body,
    trusted: isTrustedAuthor(c.authorAssociation),
  }));
  const coverage = logCoverage(
    required,
    comments,
    rangeResolver(process.cwd())
  );
  const status = logStatus({
    exempt,
    draft: false,
    branchCommits: commits.length,
    required: required.length,
    baseMerges,
    coverage,
  });
  return { status, coverage, commits };
}

function report(
  status: LogStatus,
  coverage: LogCoverage,
  commits: ReturnType<typeof branchCommits>
): void {
  const colour =
    status.state === 'success'
      ? pc.green
      : status.state === 'pending'
        ? pc.yellow
        : pc.red;
  console.log(colour(`${CONTEXT}: ${status.state}: ${status.description}`));
  const messageBySha = new Map(commits.map((c) => [c.sha, c.message]));
  for (const sha of coverage.uncovered) {
    const message = messageBySha.get(sha) ?? '';
    const suffix = message ? ` — ${message}` : '';
    console.log(
      pc.red(`  not in any Covers range: ${sha.slice(0, 12)}${suffix}`)
    );
  }
  for (const id of coverage.stale) {
    console.log(
      pc.yellow(
        `  comment ${id}: range no longer resolves (rebased away), covers nothing`
      )
    );
  }
}

function main(): number {
  const prNumber = Number(flag('--pr'));
  const post = process.argv.includes('--post-status');
  if (!Number.isInteger(prNumber) || prNumber <= 0) {
    console.error(pc.red('check-pr-log: --pr <number> is required'));
    return 1;
  }
  const runUrl = process.env.GITHUB_RUN_ID
    ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
    : undefined;

  let headSha: string | undefined;
  try {
    const pr = pullRequest(prNumber);
    headSha = pr.headSha;
    const comments = prComments(prNumber);
    const read = logInputs(pr, comments);
    const result = check(pr, comments);
    report(result.status, result.coverage, result.commits);
    if (post) {
      // No run is cancelled (a cancelled push run stays red on the head), so
      // an older run may finish after a newer one: it writes only while what
      // it read is still current, and otherwise the newer run reports.
      const now = pullRequest(prNumber);
      if (logInputs(now, prComments(prNumber)) !== read) {
        console.log(
          pc.yellow(
            `${CONTEXT}: not posted: the PR changed while this run checked it; the run for that change reports`
          )
        );
        return 0;
      }
      setStatus(headSha, {
        context: CONTEXT,
        ...result.status,
        targetUrl: runUrl,
      });
      return 0;
    }
    return logExitCode(result.status, result.coverage);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(pc.red(`check-pr-log: ${message}`));
    // A check that could not run must not leave a stale pass standing.
    if (post && headSha) {
      setStatus(headSha, {
        context: CONTEXT,
        state: 'error',
        description: 'Could not check log coverage; see the run',
        targetUrl: runUrl,
      });
    }
    return 1;
  }
}

if (isEntryPoint(import.meta.url)) {
  process.exit(main());
}
