#!/usr/bin/env node
/**
 * Generate .well-known/skills/index.json
 *
 * Creates the index file required by the `skills` CLI (vercel-labs/skills)
 * for skill discovery via the .well-known protocol.
 *
 * Reads skill directories under skills/ and produces an index with:
 * - name and description from SKILL.md frontmatter
 * - complete file listing for each skill
 */

import { readdir, readFile, writeFile, mkdir, stat } from 'fs/promises';
import { join, relative } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

const SKILLS_SOURCE = join(ROOT, 'skills');
const OUTPUT_DIR = join(ROOT, 'docs', 'public', '.well-known', 'skills');
const OUTPUT_FILE = join(OUTPUT_DIR, 'index.json');

/**
 * Recursively list all files in a directory (relative paths)
 */
async function listFiles(dir, baseDir = dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listFiles(fullPath, baseDir));
    } else {
      files.push(relative(baseDir, fullPath));
    }
  }

  return files.sort();
}

/**
 * Parse name and description from SKILL.md frontmatter
 */
function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};

  const frontmatter = {};
  for (const line of match[1].split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    let value = line.slice(colonIdx + 1).trim();
    // Strip quotes
    if ((value.startsWith("'") && value.endsWith("'")) ||
        (value.startsWith('"') && value.endsWith('"'))) {
      value = value.slice(1, -1);
    }
    frontmatter[key] = value;
  }

  return frontmatter;
}

async function main() {
  // Discover skill directories (each must contain SKILL.md)
  const entries = await readdir(SKILLS_SOURCE, { withFileTypes: true });
  const skillDirs = entries
    .filter(e => e.isDirectory())
    .map(e => e.name)
    .sort();

  const skills = [];

  for (const skillName of skillDirs) {
    const skillDir = join(SKILLS_SOURCE, skillName);
    const skillMdPath = join(skillDir, 'SKILL.md');

    try {
      await stat(skillMdPath);
    } catch {
      console.warn(`Skipping ${skillName}: no SKILL.md found`);
      continue;
    }

    const content = await readFile(skillMdPath, 'utf-8');
    const frontmatter = parseFrontmatter(content);

    if (!frontmatter.name || !frontmatter.description) {
      console.warn(`Skipping ${skillName}: SKILL.md missing name or description in frontmatter`);
      continue;
    }

    const files = await listFiles(skillDir);

    skills.push({
      name: frontmatter.name,
      description: frontmatter.description,
      files,
    });
  }

  // Write index.json
  await mkdir(OUTPUT_DIR, { recursive: true });
  const index = { skills };
  await writeFile(OUTPUT_FILE, JSON.stringify(index, null, 2) + '\n');

  console.log(`Generated ${OUTPUT_FILE}`);
  console.log(`  ${skills.length} skill(s): ${skills.map(s => s.name).join(', ')}`);
  for (const skill of skills) {
    console.log(`  ${skill.name}: ${skill.files.length} files`);
  }
}

main().catch(err => {
  console.error('Failed to generate skills index:', err);
  process.exit(1);
});
