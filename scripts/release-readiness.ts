#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Release-readiness gate runner and report renderer.
 *
 * Runs all pre-release gates, performs state-file meta-checks,
 * aggregates results into a Go/No-Go markdown report persisted to
 * `docs/superpowers/state/release-readiness-YYYY-MM-DD.md`.
 *
 * Usage:
 *   tsx scripts/release-readiness.ts run [--quick] [--dry-run]
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execaSync } from 'execa';
import pc from 'picocolors';
import {
  loadInitiatives,
  loadClusters,
  type ClusterRow,
  type InitiativeRow,
} from './state-files.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.dirname(__dirname);
const STATE_DIR = path.join(PROJECT_ROOT, 'docs/superpowers/state');
const INITIATIVES_PATH = path.join(STATE_DIR, 'INITIATIVES.md');
const TEST_INFRA_PATH = path.join(
  STATE_DIR,
  'test-infrastructure-hardening-status.md'
);
const CHANGESET_DIR = path.join(PROJECT_ROOT, '.changeset');
const PACK_SOFT_CAP_BYTES = 2 * 1024 * 1024;

export interface GateResult {
  name: string;
  pass: boolean;
  durationSec: number;
  coveragePct?: number;
  detail?: string;
}

export interface MetaResult {
  blockingInitiatives: {
    name: string;
    status: InitiativeRow['status'];
    stateFile: string;
  }[];
  testInfraClusters: { cluster: string; status: ClusterRow['status'] }[];
  changesetCount: number;
  packageVersion: string;
  lastTag: string | null;
}

export interface ReportInputs {
  date: string;
  timeHHMM: string;
  branch: string;
  commitSha: string;
  pnpmVersion: string;
  nodeVersion: string;
  gates: GateResult[];
  meta: MetaResult;
}

export interface Decision {
  go: boolean;
  reasons: string[];
}

interface GateSpec {
  name: string;
  cmd: string;
  args: string[];
  optional?: boolean;
  parseCoverage?: (stdout: string) => number | undefined;
}

function buildGateSpecs(quick: boolean): GateSpec[] {
  const gates: GateSpec[] = [
    { name: 'build', cmd: 'pnpm', args: ['build'] },
    { name: 'type-check', cmd: 'pnpm', args: ['type-check'] },
    { name: 'lint', cmd: 'pnpm', args: ['lint'] },
    {
      name: 'test',
      cmd: 'pnpm',
      args: ['test:coverage'],
      parseCoverage: (out: string) => {
        const m = /All files\s+\|\s+([\d.]+)/.exec(out);
        return m ? parseFloat(m[1]) : undefined;
      },
    },
    { name: 'test:integration', cmd: 'pnpm', args: ['test:integration'] },
  ];
  if (!quick) {
    // test:e2e covers tests/e2e/starter-snapshots.test.ts via vitest.e2e.config.ts
    // include glob, so a separate test:starters gate would re-run the same file.
    gates.push({ name: 'test:e2e', cmd: 'pnpm', args: ['test:e2e'] });
  }
  gates.push({ name: 'validate:all', cmd: 'pnpm', args: ['validate:all'] });
  return gates;
}

function runGate(spec: GateSpec): GateResult {
  const start = Date.now();
  const result = execaSync(spec.cmd, spec.args, {
    cwd: PROJECT_ROOT,
    reject: false,
  });
  const durationSec = (Date.now() - start) / 1000;
  return {
    name: spec.name,
    pass: result.exitCode === 0,
    durationSec,
    coveragePct: spec.parseCoverage?.(result.stdout + '\n' + result.stderr),
    detail: result.exitCode === 0 ? undefined : `exit=${result.exitCode}`,
  };
}

function runPackSmoke(): GateResult {
  const start = Date.now();
  // Resolve tarball path BEFORE running pack so we can clean it up on every
  // exit path, including when the previous regex-based parse missed it.
  const pkg = JSON.parse(
    fs.readFileSync(path.join(PROJECT_ROOT, 'package.json'), 'utf8')
  ) as { name: string; version: string };
  const tarball = path.join(PROJECT_ROOT, `${pkg.name}-${pkg.version}.tgz`);
  const cleanup = (): void => {
    if (fs.existsSync(tarball)) fs.unlinkSync(tarball);
  };

  const result = execaSync('pnpm', ['pack'], {
    cwd: PROJECT_ROOT,
    reject: false,
  });
  const durationSec = (Date.now() - start) / 1000;

  if (result.exitCode !== 0) {
    cleanup();
    return {
      name: 'pack-smoke',
      pass: false,
      durationSec,
      detail: 'pnpm pack failed',
    };
  }
  if (!fs.existsSync(tarball)) {
    return {
      name: 'pack-smoke',
      pass: false,
      durationSec,
      detail: `expected tarball at ${path.relative(PROJECT_ROOT, tarball)} not found`,
    };
  }
  const size = fs.statSync(tarball).size;
  cleanup();
  if (size > PACK_SOFT_CAP_BYTES) {
    return {
      name: 'pack-smoke',
      pass: false,
      durationSec,
      detail: `tarball ${(size / 1048576).toFixed(2)} MB > ${(PACK_SOFT_CAP_BYTES / 1048576).toFixed(0)} MB soft cap`,
    };
  }
  return {
    name: 'pack-smoke',
    pass: true,
    durationSec,
    detail: `tarball ${(size / 1048576).toFixed(2)} MB`,
  };
}

function gatherMeta(): MetaResult {
  const initiatives = loadInitiatives(INITIATIVES_PATH);
  // Exact match on 'v0.20.0' so 'post-v0.20.0' rows are not flagged as blocking.
  const blockingInitiatives = initiatives
    .filter((i) => i.blocks?.toLowerCase().trim() === 'v0.20.0')
    .map((i) => ({ name: i.name, status: i.status, stateFile: i.stateFile }));

  let testInfraClusters: MetaResult['testInfraClusters'] = [];
  if (fs.existsSync(TEST_INFRA_PATH)) {
    testInfraClusters = loadClusters(TEST_INFRA_PATH).map((c) => ({
      cluster: c.cluster,
      status: c.status,
    }));
  }

  let changesetCount = 0;
  if (fs.existsSync(CHANGESET_DIR)) {
    changesetCount = fs
      .readdirSync(CHANGESET_DIR)
      .filter((n) => n.endsWith('.md') && n !== 'README.md').length;
  }

  const pkg = JSON.parse(
    fs.readFileSync(path.join(PROJECT_ROOT, 'package.json'), 'utf8')
  ) as { version: string };
  const tagResult = execaSync('git', ['describe', '--tags', '--abbrev=0'], {
    cwd: PROJECT_ROOT,
    reject: false,
  });
  const lastTag =
    tagResult.exitCode === 0 ? tagResult.stdout.trim().replace(/^v/, '') : null;

  return {
    blockingInitiatives,
    testInfraClusters,
    changesetCount,
    packageVersion: pkg.version,
    lastTag,
  };
}

export function decideGoNoGo(gates: GateResult[], meta: MetaResult): Decision {
  const reasons: string[] = [];
  for (const g of gates) {
    if (!g.pass)
      reasons.push(`gate "${g.name}" failed${g.detail ? `: ${g.detail}` : ''}`);
  }
  for (const i of meta.blockingInitiatives) {
    if (i.status !== 'SHIPPED') {
      reasons.push(
        `initiative "${i.name}" status is ${i.status} (expected SHIPPED)`
      );
    }
  }
  for (const c of meta.testInfraClusters) {
    if (c.status !== 'SHIPPED') {
      reasons.push(
        `Cluster ${c.cluster} status is ${c.status} (expected SHIPPED)`
      );
    }
  }
  if (meta.changesetCount === 0) {
    reasons.push('no unreleased changesets present in `.changeset/`');
  }
  if (meta.lastTag && meta.packageVersion === meta.lastTag) {
    reasons.push(
      `package.json version ${meta.packageVersion} equals last tag (version bump required)`
    );
  }
  return { go: reasons.length === 0, reasons };
}

function badge(pass: boolean): string {
  return pass ? '✅' : '❌';
}

export function renderReport(input: ReportInputs, decision: Decision): string {
  const gateRows = input.gates
    .map((g) => {
      const cov =
        g.coveragePct !== undefined
          ? ` (cov: ${g.coveragePct.toFixed(1)}%)`
          : '';
      const detail = g.detail ? `, ${g.detail}` : '';
      return `| ${badge(g.pass)} | ${g.name} | ${g.durationSec.toFixed(1)}s${cov}${detail} |`;
    })
    .join('\n');

  const initiativeRows =
    input.meta.blockingInitiatives
      .map(
        (i) =>
          `| ${i.status === 'SHIPPED' ? '✅' : '❌'} | ${i.name} | ${i.status} |`
      )
      .join('\n') || '| - | (no blocking initiatives configured) | - |';

  const clusterRows =
    input.meta.testInfraClusters
      .map(
        (c) =>
          `| ${c.status === 'SHIPPED' ? '✅' : '❌'} | ${c.cluster} | ${c.status} |`
      )
      .join('\n') || '| - | (no clusters parsed) | - |';

  const reasonsBlock =
    decision.reasons.length === 0
      ? '_All checks satisfied._'
      : decision.reasons.map((r, idx) => `${idx + 1}. ${r}`).join('\n');

  const decisionHeader = decision.go
    ? '## Decision: ✅ GO'
    : '## Decision: ❌ NO-GO';

  return [
    `# Release Readiness ${input.date} ${input.timeHHMM}`,
    ``,
    `**Branch:** ${input.branch}`,
    `**Commit:** ${input.commitSha}`,
    `**pnpm:** ${input.pnpmVersion}`,
    `**node:** ${input.nodeVersion}`,
    ``,
    `## Gates`,
    ``,
    `|  | Gate | Duration |`,
    `| --- | --- | --- |`,
    gateRows,
    ``,
    `## Meta-checks`,
    ``,
    `### v0.20.0-blocking initiatives`,
    ``,
    `|  | Initiative | Status |`,
    `| --- | --- | --- |`,
    initiativeRows,
    ``,
    `### test-infra clusters`,
    ``,
    `|  | Cluster | Status |`,
    `| --- | --- | --- |`,
    clusterRows,
    ``,
    `### Release scaffolding`,
    ``,
    `- Changesets pending: **${input.meta.changesetCount}**`,
    `- package.json version: \`${input.meta.packageVersion}\``,
    `- Last git tag: \`${input.meta.lastTag ?? '(none)'}\``,
    ``,
    decisionHeader,
    ``,
    reasonsBlock,
    ``,
  ].join('\n');
}

function persistReport(content: string, dryRun: boolean): string | null {
  if (dryRun) return null;
  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  const hhmm = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
  const candidates = [
    `release-readiness-${date}.md`,
    `release-readiness-${date}-${hhmm}.md`,
    ...Array.from(
      { length: 99 },
      (_, i) => `release-readiness-${date}-${hhmm}-${i + 1}.md`
    ),
  ];
  const fileName = candidates.find(
    (c) => !fs.existsSync(path.join(STATE_DIR, c))
  );
  if (!fileName) {
    throw new Error(
      'Could not find a free release-readiness filename within 99 collisions'
    );
  }
  const filePath = path.join(STATE_DIR, fileName);
  fs.writeFileSync(filePath, content, 'utf8');
  return filePath;
}

function main(): void {
  const argv = process.argv.slice(2);
  const cmd = argv[0];
  if (cmd !== 'run' && cmd !== 'dry-run') {
    console.error(
      pc.red(
        `Usage: tsx scripts/release-readiness.ts run [--quick] [--dry-run]`
      )
    );
    process.exit(2);
  }
  const quick = argv.includes('--quick');
  const dryRun = cmd === 'dry-run' || argv.includes('--dry-run');

  console.error(
    pc.cyan(
      `▶ release-readiness: running gates${quick ? ' (--quick)' : ''}${dryRun ? ' (dry-run)' : ''}`
    )
  );

  const gates: GateResult[] = [];
  for (const spec of buildGateSpecs(quick)) {
    console.error(pc.dim(`  ▸ ${spec.name}…`));
    const r = runGate(spec);
    gates.push(r);
    console.error(
      `  ${r.pass ? pc.green('✓') : pc.red('✗')} ${spec.name} (${r.durationSec.toFixed(1)}s)`
    );
  }
  console.error(pc.dim(`  ▸ pack-smoke…`));
  const pack = runPackSmoke();
  gates.push(pack);
  console.error(
    `  ${pack.pass ? pc.green('✓') : pc.red('✗')} pack-smoke (${pack.durationSec.toFixed(1)}s)`
  );

  const meta = gatherMeta();

  const branchResult = execaSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
    cwd: PROJECT_ROOT,
    reject: false,
  });
  const branch =
    branchResult.exitCode === 0
      ? branchResult.stdout.trim()
      : '(not a git repo)';
  const shaResult = execaSync('git', ['rev-parse', '--short', 'HEAD'], {
    cwd: PROJECT_ROOT,
    reject: false,
  });
  const commitSha =
    shaResult.exitCode === 0 ? shaResult.stdout.trim() : '(no commit)';
  const pnpmVersion = execaSync('pnpm', ['--version'], {
    reject: false,
  }).stdout.trim();
  const nodeVersion = process.version;

  const now = new Date();
  const inputs: ReportInputs = {
    date: now.toISOString().slice(0, 10),
    timeHHMM: `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`,
    branch,
    commitSha,
    pnpmVersion,
    nodeVersion,
    gates,
    meta,
  };

  const decision = decideGoNoGo(gates, meta);
  const md = renderReport(inputs, decision);

  const reportPath = persistReport(md, dryRun);
  if (reportPath) {
    console.error(
      pc.bold(`\nReport: ${path.relative(PROJECT_ROOT, reportPath)}`)
    );
  } else {
    console.log(md);
  }
  console.error(
    decision.go
      ? pc.green(`\n✅ GO`)
      : pc.red(`\n❌ NO-GO (${decision.reasons.length} reason(s))`)
  );
  process.exit(decision.go ? 0 : 1);
}

const isMain =
  process.argv[1] &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
  main();
}
