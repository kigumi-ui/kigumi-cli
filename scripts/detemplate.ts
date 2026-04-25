#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Detemplate — One-Shot Migration Tool
 *
 * PURPOSE: Walk `templates/**\/*.hbs`, resolve the four Handlebars tokens
 * (`{{name}}`, `{{tagName}}`, `{{description}}`, `{{{importPath}}}`) per
 * component, and write each file to its non-`.hbs` path. Old `.hbs` paths
 * are removed via fs.unlink — `git status` will report them as deletes
 * alongside the newly created untracked files, so the commit captures the
 * rename pair.
 *
 * Output is byte-identical to what `renderTemplate` produces today for a
 * free-tier consumer. The Pro-tier rewrite is handled at runtime by
 * `materializeTemplate()` after this migration; the on-disk template always
 * carries the free package as its base.
 *
 * USAGE:
 *   pnpm tsx scripts/detemplate.ts
 *
 * After this PR ships, this script is deleted in a follow-up commit.
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import pc from 'picocolors';
import { getAllComponents } from '../src/utils/registry.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.dirname(__dirname);
const TEMPLATES_DIR = path.join(PROJECT_ROOT, 'templates');

const FRAMEWORKS = ['react', 'vue', 'angular'] as const;

interface Tokens {
  name: string;
  tagName: string;
  description: string;
  importPath: string;
}

/**
 * Build a fast lookup from PascalCase folder name → token bundle.
 * Folder names match `component.name` exactly (verified by validate-templates.ts).
 */
function buildLookup(): Map<string, Tokens> {
  const components = getAllComponents();
  const lookup = new Map<string, Tokens>();
  for (const component of Object.values(components)) {
    lookup.set(component.name, {
      name: component.name,
      tagName: component.tagName,
      description: component.description,
      importPath: component.importPath,
    });
  }
  return lookup;
}

/**
 * Substitute the four Handlebars tokens in template text.
 *
 * Order matters only insofar as the triple-brace `{{{importPath}}}` is
 * tokenized differently from `{{name}}` etc., but `String.replaceAll` on
 * literal strings makes order irrelevant since the patterns don't overlap.
 */
function substitute(text: string, tokens: Tokens): string {
  return text
    .replaceAll('{{{importPath}}}', tokens.importPath)
    .replaceAll('{{name}}', tokens.name)
    .replaceAll('{{tagName}}', tokens.tagName)
    .replaceAll('{{description}}', tokens.description);
}

async function listHbsFiles(dir: string): Promise<string[]> {
  const out: string[] = [];
  const stack = [dir];
  while (stack.length > 0) {
    const current = stack.pop()!;
    const entries = await fs.readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(full);
      } else if (entry.isFile() && entry.name.endsWith('.hbs')) {
        out.push(full);
      }
    }
  }
  return out;
}

async function main() {
  const lookup = buildLookup();
  const errors: string[] = [];
  let migrated = 0;

  for (const framework of FRAMEWORKS) {
    const frameworkDir = path.join(TEMPLATES_DIR, framework);
    if (!(await fs.pathExists(frameworkDir))) {
      console.warn(pc.yellow(`Missing framework dir: ${frameworkDir}`));
      continue;
    }

    const files = await listHbsFiles(frameworkDir);
    for (const filePath of files) {
      // templates/<fw>/<ComponentDir>/<file>.hbs — extract <ComponentDir>.
      const rel = path.relative(frameworkDir, filePath);
      const segments = rel.split(path.sep);
      if (segments.length < 2) {
        errors.push(`Unexpected layout (no component dir): ${filePath}`);
        continue;
      }
      const componentDir = segments[0];
      const tokens = lookup.get(componentDir);
      if (!tokens) {
        errors.push(`No registry entry for component dir: ${componentDir}`);
        continue;
      }

      const content = await fs.readFile(filePath, 'utf-8');
      const rendered = substitute(content, tokens);

      // Sanity: any surviving Handlebars token means a registry mismatch
      // (e.g. a token we don't know about). Surface loudly rather than
      // ship a half-rendered template.
      const leftover = rendered.match(/\{\{[^}]+\}\}/);
      if (leftover) {
        errors.push(
          `Unrendered token in ${filePath}: ${leftover[0]} — registry value missing?`
        );
        continue;
      }

      const newPath = filePath.replace(/\.hbs$/, '');
      await fs.writeFile(newPath, rendered);
      await fs.unlink(filePath);
      migrated++;
    }
  }

  if (errors.length > 0) {
    console.error(pc.red(`\n❌ ${errors.length} error(s):`));
    for (const err of errors) console.error(pc.red(`  • ${err}`));
    process.exit(1);
  }

  console.log(
    pc.green(
      `✅ Migrated ${migrated} templates across ${FRAMEWORKS.length} frameworks.`
    )
  );
}

main().catch((err) => {
  console.error(pc.red('Fatal:'), err);
  process.exit(1);
});
