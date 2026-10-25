#!/usr/bin/env node

/**
 * Deploy the Theme Agent's trigger.dev task to prod, quietly.
 *
 * `trigger deploy` prints spinner frames and the full image build, tens of
 * kilobytes per run, which is noise in a terminal and in an agent's context.
 * The whole output goes to docs/trigger-deploy.log (gitignored as *.log);
 * the terminal gets the deployed version, or on failure the log's last lines.
 *
 * Run from docs/: pnpm deploy:task (extra arguments go to `trigger deploy`).
 */

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const LOG_FILE = path.resolve('trigger-deploy.log');
const FAILURE_TAIL = 40;

/** Terminal output as plain lines: no colour codes, spinner redraws split. */
function plainLines(text) {
  return text
    .replace(/\x1b\[[0-9;?]*[A-Za-z]/g, '')
    .split(/[\r\n]+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

const child = spawn(
  'pnpm',
  ['exec', 'trigger', 'deploy', '--prod', ...process.argv.slice(2)],
  { stdio: ['inherit', 'pipe', 'pipe'] }
);
const log = fs.createWriteStream(LOG_FILE);
child.stdout.pipe(log, { end: false });
child.stderr.pipe(log, { end: false });

child.on('close', (code) => {
  log.end(() => {
    const lines = plainLines(fs.readFileSync(LOG_FILE, 'utf8'));
    if (code === 0) {
      const done = lines.filter((line) =>
        /Deployment completed|was deployed/.test(line)
      );
      console.log([...new Set(done)].join('\n') || 'Deployed.');
    } else {
      console.error(lines.slice(-FAILURE_TAIL).join('\n'));
      console.error(`\ntrigger deploy failed (exit ${code}).`);
    }
    console.log(`Full output: ${LOG_FILE}`);
    process.exit(code ?? 1);
  });
});
