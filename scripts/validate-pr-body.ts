#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * PR Body Validator (issue #150, ADR 0006)
 *
 * PURPOSE: the repo squashes with `squash_merge_commit_message: PR_BODY`, so
 * a PR body becomes the commit message on main. This checks the body against
 * `pr-body-rules.ts`: four allowed headings, no tables / `<details>` / HTML
 * comments / checklists, at most 2,500 characters, no AI attribution, and on
 * a PR ready for review, claims that match the diff (Impact vs changesets,
 * `#N` that exist, repo paths that exist, a Verification that links a log
 * comment on this PR). On a ready PR it also refuses a rewrite: an edit
 * since the PR last became ready that changed more than half of the body,
 * read from GitHub's edit history, so it fails every run until the PR goes
 * back to draft.
 *
 * USAGE:
 *   tsx scripts/validate-pr-body.ts --event "$GITHUB_EVENT_PATH"
 *       CI (`pr-body.yml`): checks the body in a pull_request event.
 *   tsx scripts/validate-pr-body.ts --event "$GITHUB_EVENT_PATH" --trail
 *       CI: posts the old-to-new diff of an `edited` event as a comment.
 *   tsx scripts/validate-pr-body.ts --body-file body.md [--draft] [--pr N] [--base origin/main]
 *       Locally, before `gh pr create` / `gh pr edit`. With --pr it also
 *       measures the edit from the PR's current body. Without --pr, a
 *       Verification link cannot be checked and is reported, and the edit
 *       history is not read.
 */

import fs from 'fs-extra';
import pc from 'picocolors';

import { isEntryPoint } from './is-entry-point.js';
import { changesetBump, knownPaths } from './pr-body-context.js';
import {
  bodyEdit,
  checkBody,
  checkEditHistory,
  checkRewrite,
  isExempt,
  mentionedIssues,
  type BodyContext,
  type BodyFinding,
} from './pr-body-rules.js';
import {
  bodyRevisions,
  issueExists,
  lastReadyForReview,
  postComment,
  prComments,
  pullRequest,
} from './pr-github.js';

interface PullRequestEvent {
  action: string;
  sender: { login: string };
  changes?: { body?: { from?: string | null } };
  repository: { full_name: string };
  pull_request: {
    number: number;
    body: string | null;
    draft: boolean;
    created_at: string;
    user: { type: string };
    // `repo` is null once a fork's repository is deleted.
    head: { ref: string; sha: string; repo: { full_name: string } | null };
    base: { sha: string };
  };
}

interface Input {
  body: string;
  draft: boolean;
  /** Why the PR is exempt (`isExempt()`); its body gets the attribution check only. */
  exempt: string | null;
  base: string;
  head: string;
  /** The PR on GitHub, when known. */
  pr?: {
    number: number;
    /** When it was opened, seconds since the epoch. */
    createdAt: number;
    /** A local run: the body on GitHub that this one would replace. */
    current?: string;
  };
}

function flag(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

/** Gathers the facts the claim rules need. Drafts skip claims, so they skip this. */
function gatherContext(input: Input): { ctx: BodyContext; evidence: string } {
  if (input.exempt || input.draft) {
    const ctx: BodyContext = {
      exempt: input.exempt,
      draft: input.draft,
      changesetBump: 'none',
      existingIssues: new Set(),
      knownPaths: new Set(),
      commentIds: new Set(),
    };
    const evidence = input.exempt
      ? `exempt (${input.exempt}): only the attribution rule checked`
      : 'claims not checked: draft';
    return { ctx, evidence };
  }
  const cwd = process.cwd();
  const mentioned = mentionedIssues(input.body);
  const ctx: BodyContext = {
    exempt: null,
    draft: false,
    changesetBump: changesetBump(cwd, input.base, input.head),
    existingIssues: new Set(mentioned.filter((issue) => issueExists(issue))),
    knownPaths: knownPaths(cwd, input.base, input.head),
    commentIds: new Set(
      input.pr ? prComments(input.pr.number).map((c) => c.id) : []
    ),
  };
  // Every number here is read from the evidence, so a run that looked
  // nothing up cannot print the same line as one that did (ADR 0003).
  const evidence =
    `changesets bump ${ctx.changesetBump}; ${mentioned.length} #N looked up; ` +
    `${ctx.knownPaths.size} repo paths; ${ctx.commentIds.size} PR comments`;
  return { ctx, evidence };
}

/**
 * The rewrite rule on a ready PR: GitHub's edit history since the PR last
 * became ready, plus, in a local run, the edit this body would make.
 */
function checkEdits(input: Input): {
  findings: BodyFinding[];
  evidence?: string;
} {
  if (input.exempt || input.draft) return { findings: [] };
  if (!input.pr) {
    return { findings: [], evidence: 'edit history not read: no --pr' };
  }
  const readySince = lastReadyForReview(input.pr.number) ?? input.pr.createdAt;
  const history = checkEditHistory(bodyRevisions(input.pr.number), readySince);
  const pending =
    input.pr.current === undefined
      ? []
      : checkRewrite(input.pr.current, input.body, { draft: false });
  const unmeasured =
    history.unmeasured > 0
      ? ` (${history.unmeasured} next to a deleted revision, unmeasured)`
      : '';
  return {
    findings: [...history.findings, ...pending],
    evidence: `${history.edits} body edit(s) since ready for review${unmeasured}`,
  };
}

function validate(input: Input): number {
  const context = gatherContext(input);
  const edits = checkEdits(input);
  const evidence = [context.evidence, edits.evidence]
    .filter((part) => part !== undefined)
    .join('; ');
  const findings: BodyFinding[] = [
    ...checkBody(input.body, context.ctx),
    ...edits.findings,
  ];

  if (findings.length === 0) {
    console.log(
      pc.green(`PR body passes (${input.body.length} characters; ${evidence}).`)
    );
    return 0;
  }
  console.error(
    pc.red(`\nPR body: ${findings.length} finding(s) (${evidence})\n`)
  );
  for (const f of findings) {
    console.error(
      pc.red(`  ${f.line ? `line ${f.line} ` : ''}[${f.rule}] ${f.message}`)
    );
  }
  console.error(
    pc.yellow(
      '\nThe body becomes the commit on main. Keep it to the summary and the four\n' +
        'sections; evidence and review rounds go in a log comment. See the pr-log\n' +
        'skill (.claude/skills/pr-log/SKILL.md) and docs/adr/0006.\n'
    )
  );
  return 1;
}

function fromEvent(eventPath: string): Input {
  const event = fs.readJSONSync(eventPath) as PullRequestEvent;
  const pr = event.pull_request;
  const exempt = isExempt({
    authorType: pr.user.type,
    headRef: pr.head.ref,
    sameRepo: pr.head.repo?.full_name === event.repository.full_name,
  });
  return {
    body: pr.body ?? '',
    draft: pr.draft,
    exempt,
    base: pr.base.sha,
    head: pr.head.sha,
    pr: {
      number: pr.number,
      createdAt: Math.floor(Date.parse(pr.created_at) / 1000),
    },
  };
}

/** Posts the machine-written trail of a body edit (ADR 0006). */
function postTrail(eventPath: string): number {
  const event = fs.readJSONSync(eventPath) as PullRequestEvent;
  if (event.action !== 'edited' || event.changes?.body === undefined) {
    // The workflow only runs this step for body edits; anything else means
    // the wiring is wrong, and staying quiet would hide it.
    console.error(
      pc.red('validate-pr-body --trail: this event is not a body edit')
    );
    return 1;
  }
  const pr = event.pull_request;
  const { trail } = bodyEdit(
    event.changes.body.from ?? '',
    pr.body ?? '',
    event.sender.login
  );
  postComment(pr.number, trail);
  console.log(pc.green(`Posted the body-edit trail on #${pr.number}.`));
  return 0;
}

function main(): number {
  const eventPath = flag('--event');
  if (eventPath && process.argv.includes('--trail'))
    return postTrail(eventPath);
  if (eventPath) return validate(fromEvent(eventPath));

  const bodyFile = flag('--body-file');
  if (!bodyFile) {
    console.error(
      pc.red(
        'validate-pr-body: pass --event <path> (CI) or --body-file <path> (local)'
      )
    );
    return 1;
  }
  const prFlag = flag('--pr');
  const pr = prFlag ? pullRequest(Number(prFlag)) : undefined;
  return validate({
    body: fs.readFileSync(bodyFile, 'utf8'),
    draft: process.argv.includes('--draft'),
    exempt: null,
    base: flag('--base') ?? 'origin/main',
    head: 'HEAD',
    pr: pr && {
      number: pr.number,
      createdAt: pr.createdAt,
      current: pr.body,
    },
  });
}

if (isEntryPoint(import.meta.url)) {
  process.exit(main());
}
