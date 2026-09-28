/**
 * PR body and PR log rules (issue #150, ADR 0006).
 *
 * The repo squashes with `squash_merge_commit_message: PR_BODY`, so a PR body
 * becomes the commit message on main. These rules keep that body short and
 * true. Evidence and review history belong in the PR log instead: one
 * append-only comment per push, headed `**Round N** · Covers: a..b`.
 *
 * Everything here is pure. The CLIs (`validate-pr-body.ts`,
 * `check-pr-log.ts`) gather the facts from git and the GitHub API and pass
 * them in, so every rule is testable on literal input.
 */

import { diffComm } from 'node-diff3';

import { findAttribution } from './check-commit-attribution.js';

export type Bump = 'none' | 'patch' | 'minor' | 'major';

/** Facts about the pull request that a body is checked against. */
export interface BodyContext {
  /** Draft PRs are only checked for structure, not for required headings or claims. */
  draft: boolean;
  /** Highest bump across the changesets the diff adds or changes. */
  changesetBump: Bump;
  /** Which of the `#N` the body mentions exist (issues or PRs). */
  existingIssues: ReadonlySet<number>;
  /** Every file at head, plus every file the diff deletes. */
  knownPaths: ReadonlySet<string>;
  /** IDs of the comments on this PR. */
  commentIds: ReadonlySet<number>;
}

export interface BodyFinding {
  rule: string;
  /** 1-based line in the body, when the finding has one. */
  line?: number;
  message: string;
}

const ALLOWED_HEADINGS = [
  /^## Deviations from #\d+$/,
  /^## Impact$/,
  /^## Review focus$/,
  /^## Verification$/,
];

interface BodyLine {
  /** 1-based. */
  number: number;
  text: string;
  /** Inside a fenced code block: rendered literally, never as structure. */
  fenced: boolean;
}

/** Splits a body into lines, marking the ones inside fenced code blocks. */
function readLines(body: string): BodyLine[] {
  const lines = body.replace(/\r\n?/g, '\n').split('\n');
  let fence: string | null = null;
  return lines.map((text, index) => {
    const marker = /^\s{0,3}(`{3,}|~{3,})/.exec(text)?.[1];
    if (fence === null && marker) {
      fence = marker;
      return { number: index + 1, text, fenced: true };
    }
    if (fence !== null) {
      if (marker && marker[0] === fence[0] && marker.length >= fence.length) {
        fence = null;
      }
      return { number: index + 1, text, fenced: true };
    }
    return { number: index + 1, text, fenced: false };
  });
}

const LIST_ITEM = /^\s*([-*+]|\d+[.)])\s/;

/**
 * A `===` or `---` line directly under paragraph text turns that text into a
 * heading (CommonMark "setext" headings), so it counts as one.
 */
function isSetextUnderline(
  line: BodyLine,
  previous: BodyLine | undefined
): boolean {
  if (line.fenced || !previous || previous.fenced) return false;
  if (!/^\s{0,3}(=+|-+)\s*$/.test(line.text)) return false;
  const text = previous.text.trim();
  return text !== '' && !text.startsWith('#') && !LIST_ITEM.test(previous.text);
}

function checkHeadings(lines: BodyLine[]): BodyFinding[] {
  const findings: BodyFinding[] = [];
  const seen = new Set<string>();
  lines.forEach((line, index) => {
    if (isSetextUnderline(line, lines[index - 1])) {
      findings.push({
        rule: 'heading',
        line: line.number - 1,
        message: `heading "${lines[index - 1].text.trim()}" (underlined) is not allowed`,
      });
      return;
    }
    if (line.fenced) return;
    const heading = line.text.trim();
    if (!/^#{1,6}(\s|$)/.test(heading)) return;
    if (!ALLOWED_HEADINGS.some((allowed) => allowed.test(heading))) {
      findings.push({
        rule: 'heading',
        line: line.number,
        message: `heading "${heading}" is not allowed`,
      });
      return;
    }
    if (seen.has(heading)) {
      findings.push({
        rule: 'duplicate-heading',
        line: line.number,
        message: `heading "${heading}" appears more than once`,
      });
    }
    seen.add(heading);
  });
  return findings;
}

/** Removes inline code spans, whose content renders literally. */
function withoutInlineCode(text: string): string {
  return text.replace(/(`+)[^`]*?\1/g, '');
}

/** A GFM table delimiter row: cells of dashes, optionally colon-aligned. */
const TABLE_DELIMITER = /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/;

const CONSTRUCTS: Array<{
  rule: string;
  matches: (text: string) => boolean;
  message: string;
}> = [
  {
    rule: 'table',
    matches: (text) => text.includes('|') && TABLE_DELIMITER.test(text),
    message:
      'tables break when the body becomes a commit message; put them in a log comment',
  },
  {
    rule: 'details',
    matches: (text) => /<details[\s>]/i.test(withoutInlineCode(text)),
    message:
      '<details> lands in git log as raw HTML; put the content in a log comment',
  },
  {
    rule: 'html-comment',
    matches: (text) => withoutInlineCode(text).includes('<!--'),
    message:
      'HTML comments land in git log verbatim; delete leftover template guidance',
  },
  {
    rule: 'checklist',
    matches: (text) => /^\s*([-*+]|\d+[.)])\s+\[[ xX]\]/.test(text),
    message: 'checklists belong in a log comment, not in the commit on main',
  },
];

function checkConstructs(lines: BodyLine[]): BodyFinding[] {
  const findings: BodyFinding[] = [];
  for (const line of lines) {
    if (line.fenced) continue;
    for (const construct of CONSTRUCTS) {
      if (construct.matches(line.text)) {
        findings.push({
          rule: construct.rule,
          line: line.number,
          message: construct.message,
        });
      }
    }
  }
  return findings;
}

/**
 * The squash writes the body to main, so the attribution rule that guards
 * commit messages guards the body too (issue #97).
 */
function checkAttribution(body: string): BodyFinding[] {
  return findAttribution(body).map((f) => ({
    rule: 'attribution',
    line: f.line,
    message: `${f.reason}: ${f.text}`,
  }));
}

export const MAX_BODY_LENGTH = 2500;

function checkSize(body: string): BodyFinding[] {
  if (body.length <= MAX_BODY_LENGTH) return [];
  return [
    {
      rule: 'size',
      message: `body is ${body.length} characters; the limit is ${MAX_BODY_LENGTH}`,
    },
  ];
}

const REQUIRED_HEADINGS = ['## Impact', '## Verification'];

function checkRequiredHeadings(lines: BodyLine[]): BodyFinding[] {
  const present = new Set(
    lines.filter((l) => !l.fenced).map((l) => l.text.trim())
  );
  return REQUIRED_HEADINGS.filter((heading) => !present.has(heading)).map(
    (heading) => ({
      rule: 'required-heading',
      message: `a PR ready for review needs "${heading}"`,
    })
  );
}

// ── Claims ──────────────────────────────────────────────────────────────────

interface Section {
  heading: BodyLine;
  /** Non-empty, non-fenced lines up to the next heading. */
  content: BodyLine[];
}

function findSection(lines: BodyLine[], heading: RegExp): Section | undefined {
  const start = lines.findIndex(
    (l) => !l.fenced && heading.test(l.text.trim())
  );
  if (start === -1) return undefined;
  const content: BodyLine[] = [];
  for (const line of lines.slice(start + 1)) {
    if (!line.fenced && /^#{1,6}(\s|$)/.test(line.text.trim())) break;
    if (line.text.trim() !== '') content.push(line);
  }
  return { heading: lines[start], content };
}

/** The changeset levels, lowest first. */
const BUMP_LEVELS: readonly Bump[] = ['none', 'patch', 'minor', 'major'];

/** The higher of two changeset levels, e.g. to reduce a list of them. */
export function higherBump(a: Bump, b: Bump): Bump {
  return BUMP_LEVELS.indexOf(b) > BUMP_LEVELS.indexOf(a) ? b : a;
}

function checkImpact(lines: BodyLine[], ctx: BodyContext): BodyFinding[] {
  const section = findSection(lines, /^## Impact$/);
  if (!section) return [];
  const first = section.content[0] ?? section.heading;
  const word = /^[\s*_`]*([A-Za-z]+)/
    .exec(section.content[0]?.text ?? '')?.[1]
    ?.toLowerCase();
  const level = BUMP_LEVELS.find((l) => l === word);
  if (!level) {
    return [
      {
        rule: 'impact-level',
        line: first.number,
        message: '"## Impact" must start with none, patch, minor or major',
      },
    ];
  }
  if (level === ctx.changesetBump) return [];
  const message =
    ctx.changesetBump === 'none'
      ? `Impact says ${level}, but the diff adds no changeset`
      : `Impact says ${level}, but the changesets in the diff bump ${ctx.changesetBump}`;
  return [{ rule: 'impact-changeset', line: first.number, message }];
}

/** `#N`, but not `owner/repo#N`, `##N` or `#issuecomment-N`. */
const ISSUE_MENTION = /(?<![\w/#-])#(\d+)\b/g;

/** The issues a PR closes or references, which Deviations may name. */
const ISSUE_LINK =
  /\b(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?|refs?)\b:?\s+#(\d+)/gi;

/** Each `#N` the body mentions, with the line it first appears on. */
function findMentions(lines: BodyLine[]): Map<number, number> {
  const mentions = new Map<number, number>();
  for (const line of lines) {
    if (line.fenced) continue;
    for (const match of withoutInlineCode(line.text).matchAll(ISSUE_MENTION)) {
      const issue = Number(match[1]);
      if (!mentions.has(issue)) mentions.set(issue, line.number);
    }
  }
  return mentions;
}

/** The `#N` a body mentions, in order: the issues the CLI has to look up. */
export function mentionedIssues(body: string): number[] {
  return [...findMentions(readLines(body)).keys()];
}

function checkIssues(lines: BodyLine[], ctx: BodyContext): BodyFinding[] {
  const findings: BodyFinding[] = [];
  for (const [issue, line] of findMentions(lines)) {
    if (!ctx.existingIssues.has(issue)) {
      findings.push({
        rule: 'issue-missing',
        line,
        message: `#${issue} does not exist`,
      });
    }
  }
  const linked = new Set<number>();
  for (const line of lines) {
    if (line.fenced) continue;
    for (const match of withoutInlineCode(line.text).matchAll(ISSUE_LINK)) {
      linked.add(Number(match[1]));
    }
  }
  const deviations = findSection(lines, /^## Deviations from #\d+$/);
  if (deviations) {
    const issue = Number(/#(\d+)$/.exec(deviations.heading.text.trim())?.[1]);
    if (!linked.has(issue)) {
      findings.push({
        rule: 'deviations-ref',
        line: deviations.heading.number,
        message: `"## Deviations from #${issue}" names an issue the PR does not close or reference`,
      });
    }
  }
  return findings;
}

/** Characters that make an inline-code token a pattern or a command, not a path. */
const NOT_A_PATH = /[\s*?<>{}$[\]()]|:\/\//;

/**
 * A backticked token is a repo path when its first segment is a top-level
 * entry of the repo. That keeps `kigumi-ui/kigumi-cli` and `dist/index.js`
 * (gitignored) out, and holds `scripts/...` to what actually exists. A bare
 * name is never checkable: it is a top-level entry (so it exists), or it may
 * name a nested file (`pr-body.yml`), which a typo cannot be told apart from.
 */
function checkPaths(lines: BodyLine[], ctx: BodyContext): BodyFinding[] {
  const topLevel = new Set([...ctx.knownPaths].map((p) => p.split('/')[0]));
  const findings: BodyFinding[] = [];
  for (const line of lines) {
    if (line.fenced) continue;
    for (const match of line.text.matchAll(/(`+)([^`]+?)\1/g)) {
      const token = match[2].trim();
      if (NOT_A_PATH.test(token) || token.startsWith('@')) continue;
      const path = token.replace(/^\.\//, '').replace(/(:\d+){1,2}$/, '');
      if (!topLevel.has(path.split('/')[0])) continue;
      const dir = `${path.replace(/\/$/, '')}/`;
      if (
        ctx.knownPaths.has(path) ||
        [...ctx.knownPaths].some((p) => p.startsWith(dir))
      )
        continue;
      findings.push({
        rule: 'path-missing',
        line: line.number,
        message: `\`${token}\` does not exist at head and is not deleted by the diff`,
      });
    }
  }
  return findings;
}

function checkVerification(lines: BodyLine[], ctx: BodyContext): BodyFinding[] {
  const section = findSection(lines, /^## Verification$/);
  if (!section) return [];
  const text = section.content.map((l) => l.text.trim()).join(' ');
  if (/^ci only\.?$/i.test(text)) return [];
  const findings: BodyFinding[] = [];
  let linksHere = 0;
  for (const line of section.content) {
    for (const match of line.text.matchAll(/#issuecomment-(\d+)/g)) {
      const id = Number(match[1]);
      if (ctx.commentIds.has(id)) {
        linksHere += 1;
      } else {
        findings.push({
          rule: 'verification',
          line: line.number,
          message: `#issuecomment-${id} is not a comment on this PR`,
        });
      }
    }
  }
  if (linksHere === 0 && findings.length === 0) {
    findings.push({
      rule: 'verification',
      line: (section.content[0] ?? section.heading).number,
      message:
        '"## Verification" must read "CI only" or link a log comment on this PR',
    });
  }
  return findings;
}

/**
 * Checks a PR body against the rules in ADR 0006. Returns every finding; an
 * empty array means the body passed every rule that applies to `ctx`.
 */
export function checkBody(rawBody: string, ctx: BodyContext): BodyFinding[] {
  const body = rawBody.replace(/\r\n?/g, '\n');
  const lines = readLines(body);
  const findings = [
    ...checkHeadings(lines),
    ...checkConstructs(lines),
    ...checkAttribution(body),
    ...checkSize(body),
  ];
  if (ctx.draft) return findings;
  return [
    ...findings,
    ...checkRequiredHeadings(lines),
    ...checkImpact(lines, ctx),
    ...checkIssues(lines, ctx),
    ...checkPaths(lines, ctx),
    ...checkVerification(lines, ctx),
  ];
}

// ── Body edits ──────────────────────────────────────────────────────────────

type CommChunk =
  { common: string[] } | { buffer1: string[]; buffer2: string[] };

function comm(before: string[], after: string[]): CommChunk[] {
  return diffComm(before, after) as CommChunk[];
}

function commonLength(before: string[], after: string[]): number {
  return comm(before, after).reduce(
    (sum, chunk) => sum + ('common' in chunk ? chunk.common.length : 0),
    0
  );
}

export interface BodyEdit {
  /** Non-blank lines the edit changed. */
  changed: number;
  /** Non-blank lines in the longer version. */
  counted: number;
  /** `changed / counted`, 0 for two empty bodies. */
  changedRatio: number;
  /** The machine-written trail comment: a summary line and a diff. */
  trail: string;
}

/**
 * Measures a body edit and renders its trail. The workflow posts the trail
 * itself, from the old body GitHub puts in the `edited` event, so the record
 * of what changed cannot be made up or forgotten (ADR 0006).
 */
export function bodyEdit(
  rawBefore: string,
  rawAfter: string,
  actor: string
): BodyEdit {
  const before = rawBefore.replace(/\r\n?/g, '\n').split('\n');
  const after = rawAfter.replace(/\r\n?/g, '\n').split('\n');
  const nonBlank = (lines: string[]) => lines.filter((l) => l.trim() !== '');
  const counted = Math.max(nonBlank(before).length, nonBlank(after).length);
  const changed = counted - commonLength(nonBlank(before), nonBlank(after));
  const changedRatio = counted === 0 ? 0 : changed / counted;

  const diff = comm(before, after).flatMap((chunk) =>
    'common' in chunk
      ? chunk.common.map((l) => ` ${l}`)
      : [
          ...chunk.buffer1.map((l) => `-${l}`),
          ...chunk.buffer2.map((l) => `+${l}`),
        ]
  );
  const longestRun = Math.max(
    0,
    ...[...diff.join('\n').matchAll(/`+/g)].map((m) => m[0].length)
  );
  const fence = '`'.repeat(Math.max(3, longestRun + 1));
  const trail = [
    `**Body edit** by @${actor}: ${changed} of ${counted} lines changed (${Math.round(changedRatio * 100)}%).`,
    '',
    `${fence}diff`,
    ...diff,
    fence,
  ].join('\n');
  return { changed, counted, changedRatio, trail };
}

/** Above this share of changed lines, an edit on a ready PR is a rewrite. */
export const MAX_EDIT_RATIO = 0.5;

/**
 * The body is written once and then only corrected (ADR 0006), so on a PR
 * ready for review an edit that replaces most of it fails. Drafts may be
 * rewritten while the work is still moving.
 */
export function checkRewrite(
  before: string,
  after: string,
  pr: { draft: boolean; actor: string }
): BodyFinding[] {
  if (pr.draft) return [];
  const { changed, counted, changedRatio } = bodyEdit(before, after, pr.actor);
  if (changedRatio <= MAX_EDIT_RATIO) return [];
  return [
    {
      rule: 'rewrite',
      message: `this edit changed ${changed} of ${counted} lines (${Math.round(changedRatio * 100)}%); edit the sentences that became wrong, and say why in a log comment`,
    },
  ];
}

// ── PR log ──────────────────────────────────────────────────────────────────

/**
 * A log comment's first line. `a..b` has git's meaning: the commits after
 * `a` up to and including `b`, as `git rev-list a..b` lists them.
 */
const LOG_HEADER =
  /^\*\*Round (\d+)\*\* · Covers: ([0-9a-f]{7,40})\.\.([0-9a-f]{7,40})$/;

export interface LogComment {
  id: number;
  body: string;
  /** Written by someone with write access (OWNER, MEMBER, COLLABORATOR). */
  trusted: boolean;
}

export interface LogCoverage {
  /** Required commits no log comment covers, in the order given. */
  uncovered: string[];
  /** Comments that start like a log header but do not parse. */
  unparseable: number[];
  /** Log comments whose range no longer resolves, e.g. after a rebase. */
  stale: number[];
  /** Log comments that parsed. */
  rounds: number;
}

/**
 * Checks that every required commit (committed after the PR opened) sits inside
 * some log comment's Covers range. `resolveRange` lists the commits a range
 * covers, or returns null when either end no longer exists.
 */
export function logCoverage(
  required: readonly string[],
  comments: readonly LogComment[],
  resolveRange: (from: string, to: string) => readonly string[] | null
): LogCoverage {
  const covered = new Set<string>();
  const result: LogCoverage = {
    uncovered: [],
    unparseable: [],
    stale: [],
    rounds: 0,
  };
  for (const comment of comments) {
    if (!comment.trusted) continue;
    const header = comment.body
      .replace(/\r\n?/g, '\n')
      .trim()
      .split('\n')[0]
      .trim();
    if (!header.startsWith('**Round')) continue;
    const match = LOG_HEADER.exec(header);
    if (!match) {
      result.unparseable.push(comment.id);
      continue;
    }
    result.rounds += 1;
    const commits = resolveRange(match[2], match[3]);
    if (commits === null) {
      result.stale.push(comment.id);
      continue;
    }
    for (const sha of commits) covered.add(sha);
  }
  result.uncovered = required.filter((sha) => !covered.has(sha));
  return result;
}

/** Why a PR is not checked, or null when it is. Bots and the release PR write their own bodies. */
export function isExempt(pr: {
  authorType: string;
  headRef: string;
}): string | null {
  if (pr.authorType === 'Bot') return 'bot author';
  if (pr.headRef === 'changeset-release/main') return 'release PR';
  return null;
}

export interface LogStatus {
  state: 'success' | 'failure' | 'pending' | 'error';
  /** GitHub truncates status descriptions at 140 characters. */
  description: string;
}

/**
 * The `pr-log` commit status. A commit status has no "skipped" state, so the
 * description carries what was not checked (ADR 0003): a draft stays
 * pending, and an exempt PR passes with "Not checked" rather than a bare pass.
 */
export function logStatus(input: {
  exempt: string | null;
  draft: boolean;
  branchCommits: number;
  required: number;
  coverage: LogCoverage;
}): LogStatus {
  const { exempt, draft, branchCommits, required, coverage } = input;
  if (exempt)
    return { state: 'success', description: `Not checked: exempt (${exempt})` };
  if (draft) {
    return {
      state: 'pending',
      description:
        'Draft: log coverage is checked when the PR is ready for review',
    };
  }
  if (branchCommits === 0) {
    return {
      state: 'error',
      description:
        'No commits between base and head: the range or the checkout is wrong',
    };
  }
  const problems: string[] = [];
  if (coverage.uncovered.length > 0) {
    problems.push(
      `${coverage.uncovered.length} commit(s) in no log comment's Covers range`
    );
  }
  if (coverage.unparseable.length > 0) {
    problems.push(
      `unparseable log header in comment ${coverage.unparseable.join(', ')}`
    );
  }
  if (problems.length > 0) {
    return { state: 'failure', description: problems.join('; ').slice(0, 140) };
  }
  if (required === 0) {
    return {
      state: 'success',
      description: `No commits committed after the PR opened (${branchCommits} on the branch)`,
    };
  }
  return {
    state: 'success',
    description: `All ${required} commit(s) committed after the PR opened are covered by ${coverage.rounds} log comment(s)`,
  };
}
