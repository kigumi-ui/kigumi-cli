/**
 * Foreign-Files Staging
 *
 * When `kigumi add --cross-framework` is used to install a component
 * from a registry that does not support the consumer's framework, the
 * source-framework files are staged into `<cwd>/.kigumi/foreign/<slug>/`
 * for an agent-driven conversion. This module owns the on-disk layout
 * of that staging directory and the `_meta.json` provenance file that
 * lives alongside the staged sources.
 *
 * The staging directory is treated as a transient cache: existing
 * contents are removed before each fresh stage. Users who want to
 * preserve the staged files can copy them out before re-running the
 * command.
 */

import fs from 'fs-extra';
import path from 'path';
import type { ComponentFiles } from '../schemas/community-registry.js';
import type { Framework } from '../schemas/config.js';
import type { RegistrySource } from './github-fetcher.js';
import { fetchFile } from './github-fetcher.js';

/**
 * The provenance metadata written to `_meta.json` alongside the
 * staged source files. The `kigumi-cross-framework` agent skill
 * reads this to know which framework to convert from and where the
 * sources came from.
 */
export interface ForeignFilesMeta {
  componentSlug: string;
  componentName: string;
  sourceFramework: Framework;
  targetFramework: Framework;
  sourceRegistryName: string;
  sourceRegistryUrl: string;
  fetchedAt: string;
}

export interface StageForeignFilesArgs {
  /** Project root (typically the consumer's cwd) */
  cwd: string;
  /** Registry slug for the component (key in registry.components) */
  componentSlug: string;
  /** Display name of the component */
  componentName: string;
  /** The registry source we're fetching from */
  source: RegistrySource;
  /** The framework whose files we're staging (one of registry.frameworks) */
  sourceFramework: Framework;
  /** The consumer's framework (target of the eventual conversion) */
  targetFramework: Framework;
  /** The file references for the source framework */
  files: ComponentFiles;
  /** Display name of the source registry */
  registryName: string;
}

export interface StageForeignFilesResult {
  /** Absolute path to the staging directory */
  stagedDir: string;
  /** Path relative to the cwd, suitable for display in CLI output */
  relativeStagedPath: string;
}

/**
 * Compute the on-disk staging directory for a given component slug.
 *
 * Exposed so tests and the hand-off message can build the same path
 * without re-deriving the convention.
 */
export function getForeignStagingDir(
  cwd: string,
  componentSlug: string
): string {
  return path.join(cwd, '.kigumi', 'foreign', componentSlug);
}

/**
 * Download a component's source-framework files into the staging
 * directory and write a `_meta.json` provenance file.
 *
 * Any pre-existing contents at the target staging directory are
 * removed (silent overwrite — the directory is treated as a
 * transient cache).
 */
export async function stageForeignFiles(
  args: StageForeignFilesArgs
): Promise<StageForeignFilesResult> {
  const stagedDir = getForeignStagingDir(args.cwd, args.componentSlug);

  // Treat the staging directory as transient: remove any prior contents
  // so a stale download from a previous attempt doesn't linger.
  await fs.remove(stagedDir);
  await fs.ensureDir(stagedDir);

  const downloads: Promise<void>[] = [];

  // Component file (always present)
  downloads.push(downloadInto(args.source, args.files.component, stagedDir));

  // CSS (optional)
  if (args.files.css) {
    downloads.push(downloadInto(args.source, args.files.css, stagedDir));
  }

  // Test file (optional)
  if (args.files.test) {
    downloads.push(downloadInto(args.source, args.files.test, stagedDir));
  }

  // Extras (any additional helpers)
  for (const extra of args.files.extras ?? []) {
    downloads.push(downloadInto(args.source, extra, stagedDir));
  }

  await Promise.all(downloads);

  const meta: ForeignFilesMeta = {
    componentSlug: args.componentSlug,
    componentName: args.componentName,
    sourceFramework: args.sourceFramework,
    targetFramework: args.targetFramework,
    sourceRegistryName: args.registryName,
    sourceRegistryUrl: args.source.url,
    fetchedAt: new Date().toISOString(),
  };

  await fs.writeJSON(path.join(stagedDir, '_meta.json'), meta, { spaces: 2 });

  return {
    stagedDir,
    relativeStagedPath: path.relative(args.cwd, stagedDir),
  };
}

/**
 * Build the agent hand-off prompt the CLI prints after staging
 * succeeds. A single canonical phrasing keeps users from inventing
 * variants the agent skill might miss.
 */
export function buildHandoffPrompt(
  componentSlug: string,
  targetFramework: Framework
): string {
  return (
    `Convert .kigumi/foreign/${componentSlug}/ to ${targetFramework} ` +
    `using the kigumi-cross-framework skill`
  );
}

async function downloadInto(
  source: RegistrySource,
  remotePath: string,
  stagedDir: string
): Promise<void> {
  const content = await fetchFile(source, remotePath);
  const fileName = path.basename(remotePath);
  await fs.writeFile(path.join(stagedDir, fileName), content);
}
