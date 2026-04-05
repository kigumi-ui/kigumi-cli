#!/usr/bin/env node
/**
 * Copy whitelisted skills to docs/public/ for Vercel deployment.
 *
 * Skills are served at two paths:
 * - /skills/{name}/          (direct access)
 * - /.well-known/skills/{name}/  (skill discovery protocol)
 *
 * Only end-user skills are published. Contributor-only skills
 * (release, generate-component-wrapper, etc.) are excluded.
 *
 * After copying, generate-skills-index.mjs builds the index.json.
 */

import { cp, rm, mkdir, readdir } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

/** Skills published to kigumi.style — add new end-user skills here */
const PUBLISHED_SKILLS = [
  'shared',
  'kigumi-react',
  'kigumi-vue',
  'kigumi-angular',
  'kigumi-theme',
  'kigumi-compose-form',
  'kigumi-compose-layout',
  'kigumi-compose-overlay',
  'kigumi-compose-data',
];

const SKILLS_SRC = join(ROOT, '.claude', 'skills');
const TARGETS = [
  join(ROOT, 'docs', 'public', 'skills'),
  join(ROOT, 'docs', 'public', '.well-known', 'skills'),
];

async function main() {
  // Clean and recreate output dirs
  for (const dir of TARGETS) {
    await rm(dir, { recursive: true, force: true });
    await mkdir(dir, { recursive: true });
  }

  // Directories excluded from published output (internal QA tooling)
  const EXCLUDED_DIRS = ['evals'];

  // Copy each whitelisted skill to both targets, excluding internal dirs
  for (const skill of PUBLISHED_SKILLS) {
    const src = join(SKILLS_SRC, skill);
    for (const target of TARGETS) {
      await cp(src, join(target, skill), {
        recursive: true,
        filter: (source) => {
          const name = source.split('/').pop();
          return !EXCLUDED_DIRS.includes(name);
        },
      });
    }
  }

  console.log(`Published ${PUBLISHED_SKILLS.length} skills: ${PUBLISHED_SKILLS.join(', ')}`);
}

main().catch(err => {
  console.error('Failed to publish skills:', err);
  process.exit(1);
});
