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
import { getConfig } from '../utils/config.js';
import { handleError } from '../errors/index.js';
import { getComponent } from '../utils/registry.js';
import { toKebabCase } from '../utils/naming.js';
import {
  generateComponent,
  generateComponentCSSContent,
  generateComponentTestContent,
  getComponentExtension,
  getTestExtension,
  getFileBaseName,
} from '../utils/template.js';
import { loadSnapshot } from '../utils/snapshot.js';
import { renderDiff } from '../utils/diff-renderer.js';
import {
  resolveComponents,
  reportUnmanagedComponents,
} from '../utils/installed-components.js';
import type { KigumiConfig } from '../schemas/config.js';
import type { ComponentDefinition } from '../utils/registry.js';

interface DiffOptions {
  cwd?: string;
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
  existingContent?: string;
  generatedContent?: string;
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
    // 1. Load config (throws ConfigNotFoundError / ConfigInvalidError)
    const config = getConfig(cwd);

    // 2. Determine which components to check
    const { components: componentsToCheck, unmanaged } =
      await resolveComponents(components, config, cwd);

    reportUnmanagedComponents(unmanaged, output, 'compared');

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

      output.info('');
      output.info(pc.bold(`${result.name}`) + pc.dim(versionInfo));

      for (const f of result.files) {
        let statusLine = '';
        switch (f.status) {
          case 'unchanged':
            statusLine = `    ${pc.green('✓')} ${f.fileName} — unchanged`;
            break;
          case 'template-changed':
            templateChangedCount++;
            statusLine = `    ${pc.yellow('~')} ${f.fileName} — ${pc.yellow('template changed')}`;
            break;
          case 'locally-modified':
            locallyModifiedCount++;
            statusLine = `    ${pc.blue('*')} ${f.fileName} — ${pc.blue('locally modified')}`;
            break;
          case 'both-changed':
            bothChangedCount++;
            statusLine = `    ${pc.magenta('⚡')} ${f.fileName} — ${pc.magenta('both changed')}`;
            break;
          case 'missing':
            statusLine = `    ${pc.dim('-')} ${f.fileName} — not found`;
            break;
        }
        output.info(statusLine);

        if (f.existingContent && f.generatedContent) {
          const diff = renderDiff(
            f.existingContent,
            f.generatedContent,
            f.fileName
          );
          if (diff) {
            output.info(diff);
          }
        }
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
 * Compare a single component's files against current templates.
 */
async function diffComponent(
  componentName: string,
  config: KigumiConfig,
  cwd: string
): Promise<ComponentDiffResult | null> {
  const component = getComponent(toKebabCase(componentName));
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
  const ext = getComponentExtension(config.framework, config.typescript);
  const fileBaseName = getFileBaseName(config.framework, component.name);
  const componentFileName = `${fileBaseName}.${ext}`;
  const componentFilePath = path.join(componentDir, componentFileName);

  try {
    const generatedContent = await generateComponent(
      component,
      config,
      config.typescript,
      cwd
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
  const cssFileName =
    config.framework === 'angular'
      ? `${fileBaseName}.component.css`
      : `${component.name}.css`;
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
  const testExt = getTestExtension(config.framework, config.typescript);
  const testFileName = `${fileBaseName}.${testExt}`;
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
      return {
        fileName,
        status: 'template-changed',
        existingContent,
        generatedContent,
      };
    }

    // base === theirs, user edited → locally-modified
    if (baseTrimmed === generatedTrimmed) {
      return {
        fileName,
        status: 'locally-modified',
        existingContent,
        generatedContent,
      };
    }

    // All three differ → both-changed
    return {
      fileName,
      status: 'both-changed',
      existingContent,
      generatedContent,
    };
  }

  // No snapshot — fall back to previous behavior
  return {
    fileName,
    status: 'template-changed',
    existingContent,
    generatedContent,
  };
}
