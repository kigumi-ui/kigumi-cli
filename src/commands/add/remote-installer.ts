/**
 * Remote Component Installer
 *
 * Installs components from a community registry by downloading
 * pre-rendered files from GitHub.
 */

import fs from 'fs-extra';
import path from 'path';
import pc from 'picocolors';
import * as p from '@clack/prompts';
import type {
  CommunityRegistry,
  CommunityComponent,
} from '../../schemas/community-registry.js';
import type { GitHubRegistrySource } from '../../utils/github-fetcher.js';
import { fetchFile } from '../../utils/github-fetcher.js';
import { getRegistryCache } from '../../utils/registry-cache.js';
import { saveSnapshot } from '../../utils/snapshot.js';
import { renderDiff } from '../../utils/diff-renderer.js';
import {
  checkFileModification,
  getModifiedFiles,
  type FileModificationCheck,
} from '../../utils/file-diff.js';
import type { OutputInterface, OutputSpinner } from '../../output/types.js';
import type { AddOptions } from '../../schemas/index.js';
import type { KigumiConfig, Framework } from '../../schemas/config.js';
import {
  CommunityComponentNotFoundError,
  CircularDependencyError,
} from '../../errors/community-registry.js';
import type { InstallResult } from './installer.js';

export class RemoteComponentInstaller {
  private cache = getRegistryCache();

  constructor(
    private cwd: string,
    private config: KigumiConfig,
    private source: GitHubRegistrySource,
    private registry: CommunityRegistry,
    private output: OutputInterface
  ) {}

  /**
   * Install multiple components from the remote registry
   */
  async installComponents(
    componentNames: string[],
    options: AddOptions
  ): Promise<InstallResult[]> {
    const framework = this.config.framework;
    const available = Object.keys(this.registry.components);

    // Validate all component names exist
    for (const name of componentNames) {
      if (!this.registry.components[name]) {
        throw new CommunityComponentNotFoundError(
          name,
          this.registry.name,
          available
        );
      }

      // Validate framework support
      const comp = this.registry.components[name];
      if (!(framework in comp.files)) {
        throw new Error(
          `Component "${name}" does not support ${framework}. ` +
            `Available: ${Object.keys(comp.files).join(', ')}`
        );
      }
    }

    // Resolve dependencies
    const resolved = this.resolveDependencies(componentNames);

    if (resolved.length > componentNames.length) {
      const deps = resolved.filter((n) => !componentNames.includes(n));
      this.output.info(
        `Resolving dependencies: ${deps.map((d) => pc.cyan(d)).join(', ')}`
      );
    }

    // Install each component
    const results: InstallResult[] = [];

    for (const componentKey of resolved) {
      const component = this.registry.components[componentKey];
      const spinner = this.output.spinner(
        `Adding ${pc.cyan(component.name)} from ${this.registry.name}...`
      );

      try {
        const wasSkipped = await this.installComponent(
          componentKey,
          component,
          framework,
          options,
          spinner
        );

        if (wasSkipped) {
          spinner.stop(
            `${pc.yellow('○')} Skipped ${pc.cyan(component.name)} (already exists)`
          );
          results.push({ name: component.name, success: true, skipped: true });
        } else {
          spinner.stop(`${pc.green('✓')} Added ${pc.cyan(component.name)}`);
          results.push({ name: component.name, success: true });
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        spinner.error(
          `${pc.red('✗')} Failed to add ${pc.cyan(component.name)}`
        );
        results.push({
          name: component.name,
          success: false,
          error: errorMessage,
        });
      }
    }

    return results;
  }

  /**
   * Install a single component from the remote registry
   * @returns true if skipped, false if installed
   */
  private async installComponent(
    key: string,
    component: CommunityComponent,
    framework: Framework,
    options: AddOptions,
    spinner: OutputSpinner
  ): Promise<boolean> {
    const files = component.files[framework];
    if (!files) {
      throw new Error(`No files for framework ${framework}`);
    }

    const componentDir = path.join(
      this.cwd,
      this.config.componentsDir,
      component.name
    );

    // Check if main component file exists
    const componentFileName = path.basename(files.component);
    const componentPath = path.join(componentDir, componentFileName);
    const componentExists = await fs.pathExists(componentPath);

    if (componentExists) {
      // --all without --force: silently skip
      if (options.all && !options.force) {
        return true;
      }

      // Download content first (without writing) for diff comparison
      const [newComponentContent, newCssContent, newTestContent] =
        await Promise.all([
          this.downloadContent(files.component),
          files.css ? this.downloadContent(files.css) : Promise.resolve(null),
          files.test ? this.downloadContent(files.test) : Promise.resolve(null),
        ]);

      // Compare all existing files against downloaded content
      const cssPath = files.css
        ? path.join(componentDir, path.basename(files.css))
        : null;
      const testPath = files.test
        ? path.join(componentDir, path.basename(files.test))
        : null;

      const checks = await Promise.all(
        [
          checkFileModification(componentPath, newComponentContent),
          newCssContent && cssPath
            ? checkFileModification(cssPath, newCssContent)
            : null,
          newTestContent && testPath
            ? checkFileModification(testPath, newTestContent)
            : null,
        ].filter((c): c is Promise<FileModificationCheck> => c !== null)
      );

      const modified = getModifiedFiles(checks);

      if (modified.length > 0) {
        spinner.stop(
          `${pc.yellow('!')} ${pc.cyan(component.name)} has local modifications`
        );

        // Map file paths to downloaded content for diff rendering
        const contentByPath = new Map<string, string>([
          [componentPath, newComponentContent],
        ]);
        if (newCssContent && cssPath) {
          contentByPath.set(cssPath, newCssContent);
        }
        if (newTestContent && testPath) {
          contentByPath.set(testPath, newTestContent);
        }

        // Show per-file status labels with diffs
        for (const check of checks) {
          if (check.modified) {
            this.output.warn(`  Modified:  ${pc.yellow(check.fileName)}`);
            const newContent = contentByPath.get(check.filePath);
            if (newContent && check.existingContent) {
              const diff = renderDiff(
                check.existingContent,
                newContent,
                check.fileName
              );
              if (diff) {
                this.output.info(diff);
              }
            }
          } else if (check.exists) {
            this.output.info(`  Unchanged: ${pc.dim(check.fileName)}`);
          }
        }

        // --force or --yes: skip prompt
        if (!options.force && !options.yes) {
          const confirmed = await p.confirm({
            message: `Overwrite all files for ${component.name}?`,
            initialValue: false,
          });

          if (p.isCancel(confirmed) || !confirmed) {
            return true;
          }
        }

        spinner.start(`Overwriting ${pc.cyan(component.name)}...`);
      } else {
        // All files identical -- skip regardless of flags
        return true;
      }

      // Write the already-downloaded content
      await fs.ensureDir(componentDir);
      await fs.writeFile(componentPath, newComponentContent);
      if (newCssContent && files.css) {
        await fs.writeFile(
          path.join(componentDir, path.basename(files.css)),
          newCssContent
        );
      }
      if (newTestContent && files.test) {
        await fs.writeFile(
          path.join(componentDir, path.basename(files.test)),
          newTestContent
        );
      }

      // Download extra files
      for (const extra of files.extras) {
        await this.downloadAndWrite(extra, componentDir);
      }

      // Save snapshot
      const snapshotFiles = this.buildSnapshotFiles(
        componentFileName,
        newComponentContent,
        files,
        newCssContent,
        newTestContent
      );
      await saveSnapshot(this.cwd, component.name, snapshotFiles);

      return false;
    }

    // Fresh install -- download and write directly
    await fs.ensureDir(componentDir);

    try {
      const [componentContent, cssContent, testContent] = await Promise.all([
        this.downloadAndWrite(files.component, componentDir),
        files.css
          ? this.downloadAndWrite(files.css, componentDir)
          : Promise.resolve(null),
        files.test
          ? this.downloadAndWrite(files.test, componentDir)
          : Promise.resolve(null),
      ]);

      // Download extra files (no snapshot needed)
      for (const extra of files.extras) {
        await this.downloadAndWrite(extra, componentDir);
      }

      // Save snapshot for three-way merge support (kigumi update)
      const snapshotFiles = this.buildSnapshotFiles(
        componentFileName,
        componentContent,
        files,
        cssContent,
        testContent
      );
      await saveSnapshot(this.cwd, component.name, snapshotFiles);
    } catch (error) {
      // Clean up partially written files to avoid broken state
      await fs.remove(componentDir);
      throw error;
    }

    return false;
  }

  /**
   * Download content from remote without writing to disk
   */
  private async downloadContent(remotePath: string): Promise<string> {
    let content = await this.cache.getFile(this.source, remotePath);

    if (!content) {
      content = await fetchFile(this.source, remotePath);
      await this.cache.setFile(this.source, remotePath, content);
    }

    return content;
  }

  /**
   * Download a file, write it to the component directory, and return the content
   */
  private async downloadAndWrite(
    remotePath: string,
    localDir: string
  ): Promise<string> {
    // Check cache first
    let content = await this.cache.getFile(this.source, remotePath);

    if (!content) {
      content = await fetchFile(this.source, remotePath);
      await this.cache.setFile(this.source, remotePath, content);
    }

    const fileName = path.basename(remotePath);
    const localPath = path.join(localDir, fileName);
    await fs.writeFile(localPath, content);

    return content;
  }

  /**
   * Build the snapshot file map for saving after install
   */
  private buildSnapshotFiles(
    componentFileName: string,
    componentContent: string,
    files: { css?: string; test?: string },
    cssContent: string | null,
    testContent: string | null
  ): Record<string, string> {
    const snapshotFiles: Record<string, string> = {};
    snapshotFiles[componentFileName] = componentContent;
    if (cssContent && files.css) {
      snapshotFiles[path.basename(files.css)] = cssContent;
    }
    if (testContent && files.test) {
      snapshotFiles[path.basename(files.test)] = testContent;
    }
    return snapshotFiles;
  }

  /**
   * Resolve internal dependencies via topological sort
   */
  resolveDependencies(componentNames: string[]): string[] {
    const resolved: string[] = [];
    const visiting = new Set<string>();
    const visited = new Set<string>();

    const visit = (name: string, chain: string[]) => {
      if (visited.has(name)) return;

      if (visiting.has(name)) {
        throw new CircularDependencyError([...chain, name]);
      }

      visiting.add(name);

      const component = this.registry.components[name];
      if (component) {
        for (const dep of component.dependencies) {
          if (this.registry.components[dep]) {
            visit(dep, [...chain, name]);
          }
        }
      }

      visiting.delete(name);
      visited.add(name);
      resolved.push(name);
    };

    for (const name of componentNames) {
      visit(name, []);
    }

    return resolved;
  }
}
