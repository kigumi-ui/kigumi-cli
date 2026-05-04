/**
 * Shared parser for `docs/superpowers/state/*.md` markdown tables.
 *
 * Used by scripts/release-readiness.ts, scripts/triage-finding.ts,
 * and scripts/state-staleness.ts. Internal to scripts/, not exported
 * from the published package.
 */

import fs from 'node:fs';
import path from 'node:path';
import { execaSync } from 'execa';

export interface InitiativeRow {
  name: string;
  status: 'IN-PROGRESS' | 'PENDING' | 'SHIPPED' | 'BLOCKED';
  activeCluster: string | null;
  nextCluster: string | null;
  blocks: string | null;
  stateFile: string;
}

export interface ClusterRow {
  cluster: string;
  codename: string;
  status: 'PLANNED' | 'IN-PROGRESS' | 'BLOCKED' | 'SHIPPED';
  pr: string | null;
}

const INITIATIVE_HEADERS = [
  'Initiative',
  'Status',
  'Active cluster',
  'Next cluster',
  'Blocks',
  'State-file',
] as const;

const CLUSTER_HEADERS = [
  'Cluster',
  'Codename',
  'Primary F-IDs',
  'Depends on',
  'Status',
  'PR',
] as const;

function stripCellFormatting(cell: string): string {
  let s = cell.trim();
  s = s.replace(/\*\*(.+?)\*\*/g, '$1').replace(/__(.+?)__/g, '$1');
  s = s.replace(/(?<![a-zA-Z0-9])_(.+?)_(?![a-zA-Z0-9])/g, '$1');
  s = s.replace(/(?<![a-zA-Z0-9])\*(.+?)\*(?![a-zA-Z0-9])/g, '$1');
  s = s.replace(/`([^`]+)`/g, '$1');
  s = s.replace(/\[[^\]]+\]\([^)]+\)/g, (m) => {
    const textMatch = /\[([^\]]+)\]/.exec(m);
    return textMatch ? textMatch[1] : m;
  });
  return s.trim();
}

function extractLinkUrl(cell: string): string | null {
  const m = /\[[^\]]+\]\(([^)]+)\)/.exec(cell);
  return m ? m[1] : null;
}

export function parseMarkdownTable(
  markdown: string,
  requiredHeaders: readonly string[],
  options: { stripFormatting?: boolean } = {}
): Record<string, string>[] {
  const stripFormatting = options.stripFormatting ?? true;
  const lines = markdown.split(/\r?\n/);
  let headerIdx = -1;
  let headers: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line.startsWith('|')) continue;
    const cells = line
      .split('|')
      .slice(1, -1)
      .map((c) => c.trim());
    if (requiredHeaders.every((h) => cells.includes(h))) {
      headerIdx = i;
      headers = cells;
      break;
    }
  }

  if (headerIdx === -1) {
    throw new Error(
      `Could not find markdown table with headers [${requiredHeaders.join(', ')}]`
    );
  }

  const rows: Record<string, string>[] = [];
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line.startsWith('|')) break;
    if (/^\|\s*[-: ]+\s*(\|\s*[-: ]+\s*)+\|?$/.test(line)) continue;
    const cells = line
      .split('|')
      .slice(1, -1)
      .map((c) => (stripFormatting ? stripCellFormatting(c) : c.trim()));
    if (cells.length !== headers.length) continue;
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = cells[idx];
    });
    rows.push(row);
  }

  return rows;
}

function normalizeInitiativeStatus(s: string): InitiativeRow['status'] {
  const upper = s.toUpperCase();
  if (upper.includes('IN-PROGRESS')) return 'IN-PROGRESS';
  if (upper.includes('SHIPPED')) return 'SHIPPED';
  if (upper.includes('BLOCKED')) return 'BLOCKED';
  return 'PENDING';
}

function normalizeClusterStatus(s: string): ClusterRow['status'] {
  const upper = s.toUpperCase();
  if (upper.includes('SHIPPED')) return 'SHIPPED';
  if (upper.includes('IN-PROGRESS')) return 'IN-PROGRESS';
  if (upper.includes('BLOCKED')) return 'BLOCKED';
  return 'PLANNED';
}

export function loadInitiatives(
  initiativesMarkdownPath: string
): InitiativeRow[] {
  const md = fs.readFileSync(initiativesMarkdownPath, 'utf8');
  const raw = parseMarkdownTable(md, INITIATIVE_HEADERS, {
    stripFormatting: false,
  });
  return raw.map((r) => {
    const cleanCell = (k: string): string => stripCellFormatting(r[k]);
    const blocksCell = cleanCell('Blocks');
    return {
      name: cleanCell('Initiative'),
      status: normalizeInitiativeStatus(cleanCell('Status')),
      activeCluster:
        cleanCell('Active cluster') === '-'
          ? null
          : cleanCell('Active cluster'),
      nextCluster:
        cleanCell('Next cluster') === '-' ? null : cleanCell('Next cluster'),
      blocks:
        blocksCell.toLowerCase() === 'none' || blocksCell === '-'
          ? null
          : blocksCell,
      stateFile:
        extractLinkUrl(r['State-file']) ?? stripCellFormatting(r['State-file']),
    };
  });
}

export function loadClusters(testInfraMarkdownPath: string): ClusterRow[] {
  const md = fs.readFileSync(testInfraMarkdownPath, 'utf8');
  const raw = parseMarkdownTable(md, CLUSTER_HEADERS);
  return raw.map((r) => ({
    cluster: r['Cluster'],
    codename: r['Codename'],
    status: normalizeClusterStatus(r['Status']),
    pr:
      r['PR'] === '-' || r['PR'] === '' || r['PR'].includes('pending')
        ? null
        : r['PR'],
  }));
}

export function loadStateFileMtime(
  repoRoot: string,
  relativePath: string
): Date {
  const fullPath = path.join(repoRoot, relativePath);
  try {
    const result = execaSync(
      'git',
      ['log', '-1', '--format=%ct', '--', fullPath],
      { cwd: repoRoot, reject: false }
    );
    const timestamp = parseInt(result.stdout.trim(), 10);
    if (Number.isFinite(timestamp) && timestamp > 0) {
      return new Date(timestamp * 1000);
    }
  } catch {
    // fall through to filesystem mtime
  }
  return fs.statSync(fullPath).mtime;
}
