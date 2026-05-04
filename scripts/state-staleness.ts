#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * State-file staleness CLI.
 *
 * Lists initiatives whose linked state-file has not been touched in
 * the last N days (default 14). Used by the weekly-review skill;
 * the stop-hook freshness reminder is independent (bash-only).
 *
 * Usage:
 *   tsx scripts/state-staleness.ts list [--days N]
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pc from 'picocolors';
import {
  loadInitiatives,
  loadStateFileMtime,
  type InitiativeRow,
} from './state-files.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.dirname(__dirname);
const INITIATIVES_PATH = path.join(
  PROJECT_ROOT,
  'docs/superpowers/state/INITIATIVES.md'
);

export interface StalenessRow {
  initiative: string;
  stateFile: string;
  lastModified: string;
  daysStale: number;
  status: InitiativeRow['status'];
}

export function computeStaleness(
  initiatives: InitiativeRow[],
  mtimes: Map<string, Date>,
  thresholdDays: number,
  now: Date
): StalenessRow[] {
  const rows: StalenessRow[] = [];
  for (const init of initiatives) {
    const mtime = mtimes.get(init.stateFile);
    if (!mtime) continue;
    const daysStale = Math.floor((now.getTime() - mtime.getTime()) / 86400000);
    if (daysStale >= thresholdDays) {
      rows.push({
        initiative: init.name,
        stateFile: init.stateFile,
        lastModified: mtime.toISOString().slice(0, 10),
        daysStale,
        status: init.status,
      });
    }
  }
  rows.sort((a, b) => b.daysStale - a.daysStale);
  return rows;
}

export function parseArgs(argv: string[]): { days: number } {
  let days = 14;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--days') {
      const next = argv[i + 1];
      if (!next || next.startsWith('-')) {
        console.error(pc.red('--days requires a numeric value'));
        process.exit(2);
      }
      days = parseInt(next, 10);
      if (!Number.isFinite(days) || days <= 0) {
        console.error(pc.red(`Invalid --days value: ${next}`));
        process.exit(2);
      }
      i++;
    }
  }
  return { days };
}

function main(): void {
  const cmd = process.argv[2];
  if (cmd !== 'list') {
    console.error(
      pc.red(`Usage: tsx scripts/state-staleness.ts list [--days N]`)
    );
    process.exit(2);
  }
  const { days } = parseArgs(process.argv.slice(3));

  const initiatives = loadInitiatives(INITIATIVES_PATH);
  const mtimes = new Map<string, Date>();
  for (const init of initiatives) {
    try {
      mtimes.set(
        init.stateFile,
        loadStateFileMtime(
          PROJECT_ROOT,
          path.join('docs/superpowers/state', init.stateFile)
        )
      );
    } catch {
      // missing state-file: skip
    }
  }

  const stale = computeStaleness(initiatives, mtimes, days, new Date());
  console.log(JSON.stringify(stale, null, 2));
  if (stale.length > 0) {
    console.error(
      pc.yellow(
        `\n${stale.length} stale initiative(s) (threshold: ${days} days)`
      )
    );
  }
}

const isMain =
  process.argv[1] &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
  main();
}
