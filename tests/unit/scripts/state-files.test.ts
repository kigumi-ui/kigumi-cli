import { describe, it, expect } from 'vitest';
import path from 'node:path';
import {
  parseMarkdownTable,
  loadInitiatives,
  loadClusters,
  type InitiativeRow,
  type ClusterRow,
} from '../../../scripts/state-files.js';

const FIXTURE_DIR = path.join(__dirname, '../../fixtures/state');
const fixPath = (name: string) => path.join(FIXTURE_DIR, name);

describe('parseMarkdownTable', () => {
  it('parses a well-formed table and returns header-keyed rows', () => {
    const md = [
      '| A | B |',
      '| - | - |',
      '| 1 | 2 |',
      '| 3 | 4 |',
      '',
      'unrelated trailer',
    ].join('\n');
    const rows = parseMarkdownTable(md, ['A', 'B']);
    expect(rows).toEqual([
      { A: '1', B: '2' },
      { A: '3', B: '4' },
    ]);
  });

  it('strips bold, italic, code, and link formatting from cells', () => {
    const md = [
      '| Name | Status |',
      '| - | - |',
      '| **Q1** | _italic_ |',
      '| `code` | [link](url) |',
    ].join('\n');
    const rows = parseMarkdownTable(md, ['Name', 'Status']);
    expect(rows).toEqual([
      { Name: 'Q1', Status: 'italic' },
      { Name: 'code', Status: 'link' },
    ]);
  });

  it('throws when required headers are missing', () => {
    expect(() =>
      parseMarkdownTable('| Wrong | Cols |\n| - | - |\n| a | b |', ['A', 'B'])
    ).toThrow(/header/i);
  });

  it('skips separator-only rows and stops at first non-pipe line', () => {
    const md = [
      '| A | B |',
      '| --- | --- |',
      '| 1 | 2 |',
      '',
      '| C | D |',
      '| - | - |',
      '| 9 | 10 |',
    ].join('\n');
    const rows = parseMarkdownTable(md, ['A', 'B']);
    expect(rows).toEqual([{ A: '1', B: '2' }]);
  });

  it('returns empty rows when table has only header and separator', () => {
    const md = ['| A | B |', '| - | - |'].join('\n');
    expect(parseMarkdownTable(md, ['A', 'B'])).toEqual([]);
  });
});

describe('loadInitiatives', () => {
  it('parses the Active Initiatives table and extracts state-file paths from links', () => {
    const rows: InitiativeRow[] = loadInitiatives(
      fixPath('initiatives-good.md')
    );
    expect(rows).toHaveLength(3);
    expect(rows[0]).toEqual({
      name: 'test-infrastructure-hardening',
      status: 'IN-PROGRESS',
      activeCluster: 'T (starting)',
      nextCluster: 'U, V',
      blocks: 'v0.20.0',
      stateFile: 'test-infrastructure-hardening-status.md',
    });
    expect(rows[2].blocks).toBe('post-v0.20.0');
  });

  it('throws on a markdown file without the expected table', () => {
    expect(() => loadInitiatives(fixPath('initiatives-malformed.md'))).toThrow(
      /header/i
    );
  });
});

describe('loadClusters', () => {
  it('parses the Cluster Status Table and normalizes statuses', () => {
    const rows: ClusterRow[] = loadClusters(fixPath('test-infra-good.md'));
    expect(rows).toHaveLength(3);
    expect(rows[0]).toEqual({
      cluster: 'Q1',
      codename: 'Test foundation',
      status: 'SHIPPED',
      pr: '#137',
    });
    expect(rows[1].status).toBe('PLANNED');
    expect(rows[1].pr).toBeNull();
    expect(rows[2].status).toBe('BLOCKED');
  });
});
