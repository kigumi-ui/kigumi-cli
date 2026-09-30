/**
 * The shared workflow loader and did-not-run rule behind both GHA validators.
 */
import os from 'os';
import path from 'path';
import fs from 'fs-extra';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  inspectionGap,
  readWorkflowFiles,
} from '../../../scripts/gha-workflows.js';
import { validateGhaPermissions } from '../../../scripts/validate-gha-permissions.js';

describe('readWorkflowFiles', () => {
  let dir: string;
  beforeEach(async () => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), 'kigumi-gha-workflows-'));
  });
  afterEach(() => fs.remove(dir));

  it('parses .yml and .yaml files in name order and skips the rest', async () => {
    await fs.writeFile(path.join(dir, 'b.yaml'), 'on: push\n');
    await fs.writeFile(path.join(dir, 'a.yml'), 'on: pull_request\n');
    await fs.writeFile(path.join(dir, 'notes.md'), '# not a workflow\n');

    expect(readWorkflowFiles(dir)).toEqual([
      { file: 'a.yml', doc: { on: 'pull_request' } },
      { file: 'b.yaml', doc: { on: 'push' } },
    ]);
  });

  it('is empty for a missing directory', () => {
    expect(readWorkflowFiles(path.join(dir, 'missing'))).toEqual([]);
  });
});

describe('inspectionGap', () => {
  it('is null once one item was inspected', () => {
    expect(inspectionGap(3, 1, 'checkout job')).toBeNull();
  });

  it('names a run without workflow files, and one that inspected nothing', () => {
    expect(inspectionGap(0, 0, 'checkout job')).toMatch(/no workflow file/);
    expect(inspectionGap(3, 0, 'checkout job')).toBe(
      'read 3 workflow file(s) but found no checkout job to inspect'
    );
  });
});

describe('validateGhaPermissions on a workflow directory', () => {
  let dir: string;
  beforeEach(async () => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), 'kigumi-gha-permissions-'));
  });
  afterEach(() => fs.remove(dir));

  it('passes a checkout job that can read the repo', async () => {
    await fs.writeFile(
      path.join(dir, 'ci.yml'),
      'on: pull_request\njobs:\n  build:\n    permissions: { contents: read }\n    steps:\n      - uses: actions/checkout@v7\n'
    );
    expect(validateGhaPermissions(dir)).toMatchObject({
      passed: true,
      gap: null,
    });
  });

  it('fails a run that inspected no checkout job instead of passing it (docs/adr/0003)', async () => {
    await fs.writeFile(
      path.join(dir, 'lint.yml'),
      'on: pull_request\njobs:\n  lint:\n    steps:\n      - run: echo hi\n'
    );
    expect(validateGhaPermissions(dir).passed).toBe(false);
    expect(validateGhaPermissions(path.join(dir, 'missing')).passed).toBe(
      false
    );
  });
});
