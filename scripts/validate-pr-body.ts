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
 * comment on this PR). On an `edited` event it also refuses a rewrite of a
 * ready PR's body.
 *
 * USAGE:
 *   tsx scripts/validate-pr-body.ts --event "$GITHUB_EVENT_PATH"
 *       CI (`pr-body.yml`): checks the body in a pull_request event.
 *   tsx scripts/validate-pr-body.ts --event "$GITHUB_EVENT_PATH" --trail
 *       CI: posts the old-to-new diff of an `edited` event as a comment.
 *   tsx scripts/validate-pr-body.ts --body-file body.md [--draft] [--pr N] [--base origin/main]
 *       Locally, before `gh pr create` / `gh pr edit`. Without --pr, a
 *       Verification link cannot be checked and is reported.
 */

import fs from 'fs-extra';
import pc from 'picocolors';

import { isEntryPoint } from './is-entry-point.js';
import { changesetBump, knownPaths } from './pr-body-context.js';
import {
  bodyEdit,
  checkBody,
  checkRewrite,
  isExempt,
  mentionedIssues,
  type BodyContext,
  type BodyFinding,
} from './pr-body-rules.js';
import { issueExists, postComment, prComments } from './pr-github.js';

interface PullRequestEvent {
  action: string;
  sender: { login: string };
  changes?: { body?: { from?: string | null } };
  pull_request: {
    number: number;
    body: string | null;
    draft: boolean;
    user: { type: string };
    head: { ref: string; sha: string };
    base: { sha: string };
  };
}

interface Input {
  body: string;
  draft: boolean;
  base: string;
  head: string;
  pr?: number;
  /** Present when this run is for an edit of the body. */
  edit?: { before: string; actor: string };
}

function flag(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

/** Gathers the facts the claim rules need. Drafts skip claims, so they skip this. */
function gatherContext(input: Input): { ctx: BodyContext; evidence: string } {
  if (input.draft) {
    const ctx: BodyContext = {
      draft: true,
      changesetBump: 'none',
      existingIssues: new Set(),
      knownPaths: new Set(),
      commentIds: new Set(),
    };
    return { ctx, evidence: 'claims not checked: draft' };
  }
  const cwd = process.cwd();
  const mentioned = mentionedIssues(input.body);
  const ctx: BodyContext = {
    draft: false,
    changesetBump: changesetBump(cwd, input.base, input.head),
    existingIssues: new Set(mentioned.filter((issue) => issueExists(issue))),
    knownPaths: knownPaths(cwd, input.base, input.head),
    commentIds: new Set(input.pr ? prComments(input.pr).map((c) => c.id) : []),
  };
  // Every number here is read from the evidence, so a run that looked
  // nothing up cannot print the same line as one that did (ADR 0003).
  const evidence =
    `changesets bump ${ctx.changesetBump}; ${mentioned.length} #N looked up; ` +
    `${ctx.knownPaths.size} repo paths; ${ctx.commentIds.size} PR comments`;
  return { ctx, evidence };
}

function validate(input: Input): number {
  const { ctx, evidence } = gatherContext(input);
  const findings: BodyFinding[] = [
    ...checkBody(input.body, ctx),
    ...(input.edit
      ? checkRewrite(input.edit.before, input.body, {
          draft: input.draft,
          actor: input.edit.actor,
        })
      : []),
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

function fromEvent(eventPath: string): Input | null {
  const event = fs.readJSONSync(eventPath) as PullRequestEvent;
  const pr = event.pull_request;
  const exempt = isExempt({ authorType: pr.user.type, headRef: pr.head.ref });
  if (exempt) {
    console.log(pc.yellow(`PR body not checked: exempt (${exempt}).`));
    return null;
  }
  const bodyChanged =
    event.action === 'edited' && event.changes?.body !== undefined;
  return {
    body: pr.body ?? '',
    draft: pr.draft,
    base: pr.base.sha,
    head: pr.head.sha,
    pr: pr.number,
    edit: bodyChanged
      ? { before: event.changes?.body?.from ?? '', actor: event.sender.login }
      : undefined,
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
  if (eventPath) {
    const input = fromEvent(eventPath);
    return input ? validate(input) : 0;
  }

  const bodyFile = flag('--body-file');
  if (!bodyFile) {
    console.error(
      pc.red(
        'validate-pr-body: pass --event <path> (CI) or --body-file <path> (local)'
      )
    );
    return 1;
  }
  const pr = flag('--pr');
  return validate({
    body: fs.readFileSync(bodyFile, 'utf8'),
    draft: process.argv.includes('--draft'),
    base: flag('--base') ?? 'origin/main',
    head: 'HEAD',
    pr: pr ? Number(pr) : undefined,
  });
}

if (isEntryPoint(import.meta.url)) {
  process.exit(main());
}
