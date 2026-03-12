/**
 * Post-Build Script
 *
 * Copies templates and llms.txt into dist/ after tsup build.
 * Replaces fragile shell `cp -r` commands with validated copies.
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

const COPIES: Array<{ src: string; dest: string; type: 'dir' | 'file' }> = [
  { src: 'templates', dest: 'templates', type: 'dir' },
  { src: 'llms.txt', dest: 'llms.txt', type: 'file' },
];

let copied = 0;
let errors = 0;

for (const { src, dest, type } of COPIES) {
  const srcPath = path.join(ROOT, src);
  const destPath = path.join(DIST, dest);

  if (!fs.existsSync(srcPath)) {
    console.error(`[post-build] Missing: ${src}`);
    errors++;
    continue;
  }

  fs.copySync(srcPath, destPath, { overwrite: true });

  if (type === 'dir') {
    const count = fs.readdirSync(destPath, { recursive: true }).length;
    console.error(`[post-build] Copied ${src}/ (${count} entries)`);
  } else {
    console.error(`[post-build] Copied ${src}`);
  }
  copied++;
}

if (errors > 0) {
  console.error(`[post-build] ${errors} error(s), ${copied} copied`);
  process.exit(1);
}

console.error(`[post-build] Done — ${copied} items copied to dist/`);
