/**
 * Update Command
 *
 * PURPOSE: Update installed components using three-way merge.
 * Compares base (snapshot) + ours (user's file) + theirs (fresh template)
 * to intelligently merge upstream template changes with local customizations.
 *
 * @public
 */

import path from 'path';
import fs from 'fs-extra';
import pc from 'picocolors';
import * as p from '../prompts/index.js';
import { getOutput } from '../output/index.js';
import { loadConfig } from '../utils/config.js';
import { handleError, ConfigNotFoundError } from '../errors/index.js';
import { getComponent, normalizeComponentName } from '../utils/registry.js';
import { toKebabCase } from '../utils/naming.js';
import {
  generateComponent,
  generateComponentCSSContent,
  generateComponentTestContent,
  getComponentExtension,
  getTestExtension,
  getFileBaseName,
} from '../utils/template.js';
import { loadSnapshot, saveSnapshot } from '../utils/snapshot.js';
import {
  mergeFile,
  type FileMergeResult,
  type FileStatus,
} from '../utils/three-way-merge.js';
import { renderDiff } from '../utils/diff-renderer.js';
import { detectTier, type Tier } from '../utils/tier.js';
import {
  isNextProject,
  detectNextRouter,
  type NextRouter,
} from '../utils/detect-framework.js';
import type { KigumiConfig } from '../schemas/config.js';
import type { ComponentDefinition } from '../utils/registry.js';

interface UpdateOptions {
  dryRun?: boolean;
  force?: boolean;
  yes?: boolean;
  cwd?: string;
}

interface ComponentUpdateResult {
  name: string;
  files: FileMergeResult[];
}

/**
 * Update command - update installed components with three-way merge
 */
export async function updateCommand(
  components: string[],
  options: UpdateOptions = {}
) {
  const output = getOutput();
  output.intro('kigumi update');

  const cwd = options.cwd || process.cwd();

  try {
    // 1. Load config
    const config = loadConfig(cwd);
    if (!config) {
      throw new ConfigNotFoundError(cwd);
    }

    // Detect tier and Next-project context once here so generateComponent
    // does not repeat the package.json / .env / next.config probes for every
    // component we visit. An update sweep across the full installed set
    // would otherwise hit ~10 fs stats per component for the router check.
    const tier = await detectTier(cwd);
    const isNext = await isNextProject(cwd);
    const nextRouter = isNext ? await detectNextRouter(cwd) : undefined;

    // 2. Determine which components to check
    const componentsToCheck = await resolveComponents(components, config, cwd);

    if (componentsToCheck.length === 0) {
      output.info('No installed components found to update.');
      output.outro('Done');
      return;
    }

    if (options.dryRun) {
      output.info(pc.dim('Dry run — no files will be written.'));
    }

    // 3. Process each component
    const results: ComponentUpdateResult[] = [];
    let updatedCount = 0;
    let conflictCount = 0;
    let skippedCount = 0;

    for (const componentName of componentsToCheck) {
      const result = await processComponent(
        componentName,
        config,
        cwd,
        tier,
        isNext,
        nextRouter,
        options
      );
      if (result) {
        results.push(result);

        for (const file of result.files) {
          if (
            file.status === 'safe-overwrite' ||
            file.status === 'clean-merge'
          ) {
            updatedCount++;
          } else if (file.status === 'conflict') {
            conflictCount++;
          } else if (file.status === 'no-snapshot-differ') {
            skippedCount++;
          }
        }
      }
    }

    // 4. Display results
    for (const result of results) {
      output.info('');
      output.info(pc.bold(result.name));
      for (const file of result.files) {
        output.info(`  ${formatFileStatus(file)}`);

        // Show diff for updated files
        if (
          (file.status === 'safe-overwrite' ||
            file.status === 'clean-merge' ||
            file.status === 'conflict') &&
          file.previousContent != null &&
          file.newContent != null
        ) {
          const diff = renderDiff(
            file.previousContent,
            file.newContent,
            file.fileName
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
    output.info(`  ${results.length} component(s) processed`);
    if (updatedCount > 0) {
      output.info(`  ${pc.green(`${updatedCount} file(s) updated`)}`);
    }
    if (conflictCount > 0) {
      output.info(
        `  ${pc.yellow(`${conflictCount} file(s) with conflicts (resolve manually)`)}`
      );
    }
    if (skippedCount > 0) {
      output.info(
        `  ${pc.dim(`${skippedCount} file(s) skipped (no snapshot, files differ)`)}`
      );
    }
    if (updatedCount === 0 && conflictCount === 0 && skippedCount === 0) {
      output.success('All components are up to date.');
    }

    output.outro('Done');
  } catch (error) {
    handleError(error, output);
  }
}

/**
 * Resolve which components to update.
 * If specific names given, use those. Otherwise, scan the components directory.
 */
export async function resolveComponents(
  names: string[],
  config: KigumiConfig,
  cwd: string
): Promise<string[]> {
  if (names.length > 0) {
    return names.map((n) => normalizeComponentName(n) ?? n);
  }

  const componentsDir = path.join(cwd, config.componentsDir);
  if (!(await fs.pathExists(componentsDir))) {
    return [];
  }

  const entries = await fs.readdir(componentsDir, { withFileTypes: true });
  return entries
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .filter((name) => getComponent(toKebabCase(name)) !== null)
    .sort();
}

/**
 * Process a single component — compute merge results and apply them.
 */
async function processComponent(
  componentName: string,
  config: KigumiConfig,
  cwd: string,
  tier: Tier,
  isNext: boolean,
  nextRouter: NextRouter | undefined,
  options: UpdateOptions
): Promise<ComponentUpdateResult | null> {
  const component = getComponent(toKebabCase(componentName));
  if (!component) {
    return null;
  }

  // Load snapshot (base)
  const snapshot = await loadSnapshot(cwd, componentName);

  // Determine file extensions
  const ext = getComponentExtension(config.framework, config.typescript);
  const testExt = getTestExtension(config.framework, config.typescript);

  const componentDir = path.join(cwd, config.componentsDir, component.name);

  // Build file list: { fileName, oursPath, generateTheirs }
  const fileSpecs = await buildFileSpecs(
    component,
    config,
    componentDir,
    ext,
    testExt,
    cwd,
    tier,
    isNext,
    nextRouter
  );

  const mergeResults: FileMergeResult[] = [];

  for (const spec of fileSpecs) {
    // Read current file (ours)
    if (!(await fs.pathExists(spec.oursPath))) {
      mergeResults.push({
        fileName: spec.fileName,
        status: 'up-to-date',
        newContent: null,
      });
      continue;
    }

    const ours = await fs.readFile(spec.oursPath, 'utf-8');
    const theirs = await spec.generateTheirs();
    const base = snapshot?.[spec.fileName] ?? null;

    if (options.force) {
      // Force mode: always overwrite
      mergeResults.push({
        fileName: spec.fileName,
        status: 'safe-overwrite',
        newContent: theirs,
        previousContent: ours,
      });
      continue;
    }

    const result = mergeFile(base, ours, theirs, spec.fileName);
    mergeResults.push({ ...result, previousContent: ours });
  }

  // Handle no-snapshot-differ: prompt user
  const differFiles = mergeResults.filter(
    (r) => r.status === 'no-snapshot-differ'
  );
  if (differFiles.length > 0 && !options.dryRun) {
    const output = getOutput();
    output.warn(
      `  ${pc.yellow('!')} ${componentName}: no snapshot found, files differ from template`
    );
    output.info(
      `  ${pc.dim('Run')} kigumi add ${componentName.toLowerCase()} --force ${pc.dim('to reset, or update will create a snapshot for future merges.')}`
    );

    if (!options.yes) {
      const confirmed = await p.confirm({
        message: `Create snapshot for ${componentName}? (enables future three-way merges)`,
        initialValue: true,
      });

      if (p.isCancel(confirmed) || !confirmed) {
        return { name: componentName, files: mergeResults };
      }
    }

    // Create snapshot from current theirs so future updates work
    const snapshotFiles: Record<string, string> = {};
    for (const spec of fileSpecs) {
      if (await fs.pathExists(spec.oursPath)) {
        snapshotFiles[spec.fileName] = await spec.generateTheirs();
      }
    }
    await saveSnapshot(cwd, componentName, snapshotFiles);
  }

  // Apply results
  if (!options.dryRun) {
    const snapshotUpdates: Record<string, string> = {};
    let hasWrites = false;

    for (const result of mergeResults) {
      if (result.newContent !== null) {
        const spec = fileSpecs.find((s) => s.fileName === result.fileName);
        if (spec) {
          await fs.writeFile(spec.oursPath, result.newContent, 'utf-8');
          hasWrites = true;
        }
      }

      // Update snapshot for successful writes, already-current, and no-snapshot-match files
      if (
        result.status === 'safe-overwrite' ||
        result.status === 'clean-merge' ||
        result.status === 'already-current' ||
        result.status === 'no-snapshot-match'
      ) {
        const spec = fileSpecs.find((s) => s.fileName === result.fileName);
        if (spec) {
          snapshotUpdates[result.fileName] = await spec.generateTheirs();
        }
      }
    }

    // Save updated snapshot
    if (hasWrites || Object.keys(snapshotUpdates).length > 0) {
      // Merge with existing snapshot
      const existingSnapshot = (await loadSnapshot(cwd, componentName)) ?? {};
      await saveSnapshot(cwd, componentName, {
        ...existingSnapshot,
        ...snapshotUpdates,
      });
    }
  }

  return { name: componentName, files: mergeResults };
}

interface FileSpec {
  fileName: string;
  oursPath: string;
  generateTheirs: () => Promise<string>;
}

/**
 * Build the list of files to process for a component.
 */
async function buildFileSpecs(
  component: ComponentDefinition,
  config: KigumiConfig,
  componentDir: string,
  ext: string,
  testExt: string,
  cwd: string,
  tier: Tier,
  isNext: boolean,
  nextRouter: NextRouter | undefined
): Promise<FileSpec[]> {
  const specs: FileSpec[] = [];
  const fileBaseName = getFileBaseName(config.framework, component.name);

  // Component file
  const componentFileName = `${fileBaseName}.${ext}`;
  specs.push({
    fileName: componentFileName,
    oursPath: path.join(componentDir, componentFileName),
    generateTheirs: () =>
      generateComponent(
        component,
        config,
        config.typescript,
        cwd,
        tier,
        isNext,
        nextRouter
      ),
  });

  // CSS file
  const cssFileName =
    config.framework === 'angular'
      ? `${fileBaseName}.component.css`
      : `${component.name}.css`;
  specs.push({
    fileName: cssFileName,
    oursPath: path.join(componentDir, cssFileName),
    generateTheirs: () => generateComponentCSSContent(component, config),
  });

  // Test file
  const testFileName = `${fileBaseName}.${testExt}`;
  const testPath = path.join(componentDir, testFileName);
  if (await fs.pathExists(testPath)) {
    specs.push({
      fileName: testFileName,
      oursPath: testPath,
      generateTheirs: () => generateComponentTestContent(component, config),
    });
  }

  return specs;
}

/**
 * Format a file merge result as a status line.
 */
function formatFileStatus(result: FileMergeResult): string {
  const statusMap: Record<FileStatus, string> = {
    'up-to-date': `${pc.green('✓')} ${result.fileName} — up to date`,
    'safe-overwrite': `${pc.green('→')} ${result.fileName} — ${pc.green('safe overwrite (applied)')}`,
    'already-current': `${pc.green('✓')} ${result.fileName} — already current`,
    'clean-merge': `${pc.cyan('⚡')} ${result.fileName} — ${pc.cyan('clean merge (applied)')}`,
    conflict: `${pc.yellow('⚠')} ${result.fileName} — ${pc.yellow(`conflict${result.merge ? ` (${result.merge.conflictCount} region${result.merge.conflictCount !== 1 ? 's' : ''}, resolve manually)` : ' (resolve manually)'}`)}`,
    'no-snapshot-match': `${pc.green('✓')} ${result.fileName} — matches template (snapshot created)`,
    'no-snapshot-differ': `${pc.dim('○')} ${result.fileName} — ${pc.dim('skipped (no snapshot, files differ)')}`,
  };

  return statusMap[result.status];
}
