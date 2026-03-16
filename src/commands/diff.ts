/**
 * Diff Command
 *
 * PURPOSE: Compares installed component files against what the current
 * CLI version would generate. Helps users see what changed between
 * their installed version and the current templates.
 *
 * Uses the existing file-diff.ts utility for modification detection.
 *
 * @public
 */

import path from 'path';
import fs from 'fs-extra';
import pc from 'picocolors';
import { getOutput } from '../output/index.js';
import { loadConfig } from '../utils/config.js';
import { handleError, ConfigNotFoundError } from '../errors/index.js';
import { getComponent } from '../utils/registry.js';
import {
  generateComponent,
  generateComponentCSSContent,
  generateComponentTestContent,
} from '../utils/template.js';
import { loadSnapshot } from '../utils/snapshot.js';
import type { KigumiConfig } from '../schemas/config.js';
import type { ComponentDefinition } from '../utils/registry.js';

interface DiffOptions {
  cwd?: string;
  verbose?: boolean;
}

interface ComponentDiffResult {
  name: string;
  installedVersion: string | undefined;
  files: FileDiffResult[];
}

interface FileDiffResult {
  fileName: string;
  status:
    | 'unchanged'
    | 'template-changed'
    | 'locally-modified'
    | 'both-changed'
    | 'missing';
}

/**
 * Diff command - compare installed components against current templates
 */
export async function diffCommand(
  components: string[],
  options: DiffOptions = {}
) {
  const output = getOutput();
  output.intro('kigumi diff');

  const cwd = options.cwd || process.cwd();

  try {
    // 1. Load config
    const config = loadConfig(cwd);
    if (!config) {
      throw new ConfigNotFoundError(cwd);
    }

    // 2. Determine which components to check
    const componentsToCheck = await resolveComponents(components, config, cwd);

    if (componentsToCheck.length === 0) {
      output.info('No installed components found to compare.');
      output.outro('Done');
      return;
    }

    // 3. Compare each component
    const results: ComponentDiffResult[] = [];

    for (const componentName of componentsToCheck) {
      const result = await diffComponent(componentName, config, cwd);
      if (result) {
        results.push(result);
      }
    }

    // 4. Display results
    let templateChangedCount = 0;
    let locallyModifiedCount = 0;
    let bothChangedCount = 0;

    for (const result of results) {
      const versionInfo = result.installedVersion
        ? ` (installed: ${result.installedVersion})`
        : '';

      const fileStatuses = result.files.map((f) => {
        switch (f.status) {
          case 'unchanged':
            return `    ${pc.green('✓')} ${f.fileName} — unchanged`;
          case 'template-changed':
            templateChangedCount++;
            return `    ${pc.yellow('~')} ${f.fileName} — ${pc.yellow('template changed')}`;
          case 'locally-modified':
            locallyModifiedCount++;
            return `    ${pc.blue('*')} ${f.fileName} — ${pc.blue('locally modified')}`;
          case 'both-changed':
            bothChangedCount++;
            return `    ${pc.magenta('⚡')} ${f.fileName} — ${pc.magenta('both changed')}`;
          case 'missing':
            return `    ${pc.dim('-')} ${f.fileName} — not found`;
        }
      });

      output.info('');
      output.info(pc.bold(`${result.name}`) + pc.dim(versionInfo));
      for (const line of fileStatuses) {
        output.info(line);
      }
    }

    // 5. Summary
    output.info('');
    output.info(pc.bold('Summary:'));
    output.info(`  ${results.length} component(s) checked`);
    if (templateChangedCount > 0) {
      output.info(
        `  ${pc.yellow(`${templateChangedCount} file(s) with template updates available`)}`
      );
    }
    if (locallyModifiedCount > 0) {
      output.info(
        `  ${pc.blue(`${locallyModifiedCount} file(s) with local modifications`)}`
      );
    }
    if (bothChangedCount > 0) {
      output.info(
        `  ${pc.magenta(`${bothChangedCount} file(s) with both local and template changes`)}`
      );
    }
    if (
      templateChangedCount === 0 &&
      locallyModifiedCount === 0 &&
      bothChangedCount === 0
    ) {
      output.success('All components are up to date.');
    }

    output.outro('Done');
  } catch (error) {
    handleError(error, output);
  }
}

/**
 * Resolve which components to check.
 * If specific names given, use those. Otherwise, scan the components directory.
 */
async function resolveComponents(
  names: string[],
  config: KigumiConfig,
  cwd: string
): Promise<string[]> {
  if (names.length > 0) {
    // Normalize: accept lowercase, return PascalCase
    return names.map((n) => n.charAt(0).toUpperCase() + n.slice(1));
  }

  // Scan components directory for installed components
  const componentsDir = path.join(cwd, config.componentsDir);
  if (!(await fs.pathExists(componentsDir))) {
    return [];
  }

  const entries = await fs.readdir(componentsDir, { withFileTypes: true });
  return entries
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .filter((name) => getComponent(name.toLowerCase()) !== null) // Only builtin components
    .sort();
}

/**
 * Compare a single component's files against current templates.
 */
async function diffComponent(
  componentName: string,
  config: KigumiConfig,
  cwd: string
): Promise<ComponentDiffResult | null> {
  const component = getComponent(componentName.toLowerCase());
  if (!component) {
    return null; // Not a builtin component, skip
  }

  const installedVersion =
    config.installedComponents?.[componentName]?.kigumiVersion;

  const files = await diffComponentFiles(component, config, cwd);

  return {
    name: componentName,
    installedVersion,
    files,
  };
}

/**
 * Compare all files of a component against freshly generated content.
 */
async function diffComponentFiles(
  component: ComponentDefinition,
  config: KigumiConfig,
  cwd: string
): Promise<FileDiffResult[]> {
  const componentDir = path.join(cwd, config.componentsDir, component.name);
  const results: FileDiffResult[] = [];

  // Load snapshot for three-way classification
  const snapshot = await loadSnapshot(cwd, component.name);

  // Component file
  const ext =
    config.framework === 'vue'
      ? config.typescript
        ? 'vue'
        : 'js.vue'
      : config.typescript
        ? 'tsx'
        : 'jsx';
  const componentFileName = `${component.name}.${ext}`;
  const componentFilePath = path.join(componentDir, componentFileName);

  try {
    const generatedContent = await generateComponent(
      component,
      config,
      config.typescript
    );
    const snapshotContent = snapshot?.[componentFileName] ?? null;
    results.push(
      await compareFile(
        componentFilePath,
        componentFileName,
        generatedContent,
        snapshotContent
      )
    );
  } catch (_error) {
    results.push({ fileName: componentFileName, status: 'missing' });
  }

  // CSS file
  const cssFileName = `${component.name}.css`;
  const cssFilePath = path.join(componentDir, cssFileName);
  try {
    const generatedCSS = await generateComponentCSSContent(component, config);
    const snapshotContent = snapshot?.[cssFileName] ?? null;
    results.push(
      await compareFile(cssFilePath, cssFileName, generatedCSS, snapshotContent)
    );
  } catch (_error) {
    results.push({ fileName: cssFileName, status: 'missing' });
  }

  // Test file
  const testExt =
    config.framework === 'vue'
      ? config.typescript
        ? 'test.ts'
        : 'test.js'
      : config.typescript
        ? 'test.tsx'
        : 'test.jsx';
  const testFileName = `${component.name}.${testExt}`;
  const testFilePath = path.join(componentDir, testFileName);
  try {
    const generatedTest = await generateComponentTestContent(component, config);
    const snapshotContent = snapshot?.[testFileName] ?? null;
    results.push(
      await compareFile(
        testFilePath,
        testFileName,
        generatedTest,
        snapshotContent
      )
    );
  } catch (_error) {
    results.push({ fileName: testFileName, status: 'missing' });
  }

  return results;
}

/**
 * Compare a single file against its generated content.
 *
 * When a snapshot is available, classifies changes more precisely:
 * - base === ours, base !== theirs → template-changed (upstream update)
 * - base !== ours, base === theirs → locally-modified (user edit)
 * - all three differ → both-changed
 */
async function compareFile(
  filePath: string,
  fileName: string,
  generatedContent: string,
  snapshotContent: string | null = null
): Promise<FileDiffResult> {
  if (!(await fs.pathExists(filePath))) {
    return { fileName, status: 'missing' };
  }

  const existingContent = await fs.readFile(filePath, 'utf-8');
  const existingTrimmed = existingContent.trim();
  const generatedTrimmed = generatedContent.trim();

  if (existingTrimmed === generatedTrimmed) {
    return { fileName, status: 'unchanged' };
  }

  // With snapshot, we can classify precisely
  if (snapshotContent !== null) {
    const baseTrimmed = snapshotContent.trim();

    // base === ours, template changed → template-changed
    if (baseTrimmed === existingTrimmed) {
      return { fileName, status: 'template-changed' };
    }

    // base === theirs, user edited → locally-modified
    if (baseTrimmed === generatedTrimmed) {
      return { fileName, status: 'locally-modified' };
    }

    // All three differ → both-changed
    return { fileName, status: 'both-changed' };
  }

  // No snapshot — fall back to previous behavior
  return { fileName, status: 'template-changed' };
}
