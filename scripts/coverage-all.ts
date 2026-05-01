#!/usr/bin/env tsx
/**
 * Merged coverage harness for cluster P phase 1.
 *
 * Runs unit, integration, and e2e suites with NODE_V8_COVERAGE pointed at one
 * tmp directory so plain Node, vitest workers, and CLI subprocess invocations
 * all dump raw V8 coverage there. Then c8 stitches the JSONs into a single
 * report under coverage-merged/.
 *
 * Unit runs WITHOUT --coverage on purpose: with NODE_V8_COVERAGE set, raw V8
 * JSON lands in the tmp dir directly. Adding --coverage would route vitest's
 * coverage-v8 output to ./coverage/ separately and c8 report would not see it.
 */
import { execa } from 'execa';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';

const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'kigumi-coverage-'));
const env = { ...process.env, NODE_V8_COVERAGE: tempDir };

const failures: string[] = [];
async function runStep(label: string, args: string[]): Promise<void> {
  console.error(`\n=== coverage:all - ${label} ===`);
  const r = await execa('pnpm', args, { stdio: 'inherit', env, reject: false });
  if (r.exitCode !== 0) failures.push(label);
}

try {
  await runStep('unit', [
    'exec',
    'vitest',
    'run',
    'tests/unit',
    '--config',
    'vitest.unit.config.ts',
  ]);
  await runStep('integration', [
    'exec',
    'vitest',
    'run',
    'tests/integration',
    '--config',
    'vitest.integration.config.ts',
  ]);
  await runStep('e2e', [
    'exec',
    'vitest',
    'run',
    '--config',
    'vitest.e2e.config.ts',
  ]);

  console.error('\n=== coverage:all - c8 report ===');
  await execa(
    'pnpm',
    [
      'exec',
      'c8',
      'report',
      '--temp-directory',
      tempDir,
      '--src',
      'src/',
      '--reporter',
      'text',
      '--reporter',
      'json-summary',
      '--reports-dir',
      'coverage-merged',
    ],
    { stdio: 'inherit' }
  );
} finally {
  await fs.remove(tempDir);
}

if (failures.length > 0) {
  console.error(`\nTest step(s) failed: ${failures.join(', ')}`);
  process.exit(1);
}
