import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  computeStaleness,
  parseArgs,
  type StalenessRow,
} from '../../../scripts/state-staleness.js';
import type { InitiativeRow } from '../../../scripts/state-files.js';

const NOW = new Date('2026-05-04T12:00:00Z');

const initiatives: InitiativeRow[] = [
  {
    name: 'fresh',
    status: 'IN-PROGRESS',
    activeCluster: 'X',
    nextCluster: null,
    blocks: 'v0.20.0',
    stateFile: 'fresh-status.md',
  },
  {
    name: 'stale',
    status: 'IN-PROGRESS',
    activeCluster: 'Y',
    nextCluster: null,
    blocks: null,
    stateFile: 'stale-status.md',
  },
];

const mtimes = new Map<string, Date>([
  ['fresh-status.md', new Date('2026-05-01T12:00:00Z')], // 3 days
  ['stale-status.md', new Date('2026-04-15T12:00:00Z')], // 19 days
]);

describe('computeStaleness', () => {
  it('returns rows beyond the threshold sorted by daysStale desc', () => {
    const rows = computeStaleness(initiatives, mtimes, 14, NOW);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toEqual<StalenessRow>({
      initiative: 'stale',
      stateFile: 'stale-status.md',
      lastModified: '2026-04-15',
      daysStale: 19,
      status: 'IN-PROGRESS',
    });
  });

  it('returns nothing when all rows are within the threshold', () => {
    const rows = computeStaleness(initiatives, mtimes, 30, NOW);
    expect(rows).toEqual([]);
  });

  it('respects custom thresholds', () => {
    const rows = computeStaleness(initiatives, mtimes, 2, NOW);
    expect(rows.map((r) => r.initiative)).toEqual(['stale', 'fresh']);
  });
});

describe('parseArgs', () => {
  const exitSpy = vi.spyOn(process, 'exit').mockImplementation((code) => {
    throw new Error(`process.exit(${code})`);
  });
  const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

  afterEach(() => {
    exitSpy.mockClear();
    errorSpy.mockClear();
  });

  it('defaults to 14 days when --days is omitted', () => {
    expect(parseArgs([])).toEqual({ days: 14 });
  });

  it('accepts a positive integer value', () => {
    expect(parseArgs(['--days', '30'])).toEqual({ days: 30 });
  });

  it('exits 2 when --days has no following value', () => {
    expect(() => parseArgs(['--days'])).toThrow('process.exit(2)');
    expect(errorSpy.mock.calls[0]?.[0]).toMatch(
      /--days requires a numeric value/
    );
  });

  it('exits 2 when --days is followed by another flag', () => {
    expect(() => parseArgs(['--days', '--verbose'])).toThrow('process.exit(2)');
    expect(errorSpy.mock.calls[0]?.[0]).toMatch(
      /--days requires a numeric value/
    );
  });

  it('exits 2 when --days value is non-numeric', () => {
    expect(() => parseArgs(['--days', 'abc'])).toThrow('process.exit(2)');
    expect(errorSpy.mock.calls[0]?.[0]).toMatch(/Invalid --days value: abc/);
  });

  it('exits 2 when --days value is zero or negative', () => {
    expect(() => parseArgs(['--days', '0'])).toThrow('process.exit(2)');
  });
});
