/**
 * Snapshot Storage
 *
 * PURPOSE: Store a snapshot of generated template output at install time
 * so that `kigumi update` can perform three-way merges (base + ours + theirs).
 *
 * Storage: `.kigumi/snapshots/{ComponentName}/{files}` at project root.
 * Committed to git for team-wide consistent updates.
 *
 * EXPORTS:
 * - getSnapshotDir() - Get snapshot directory path for a component
 * - saveSnapshot() - Save generated file contents as snapshot
 * - loadSnapshot() - Load snapshot files for a component
 * - hasSnapshot() - Check if snapshot exists
 * - deleteSnapshot() - Remove snapshot for a component
 */

import fs from 'fs-extra';
import path from 'path';

const SNAPSHOT_ROOT = '.kigumi/snapshots';

/**
 * Get the snapshot directory for a component.
 */
export function getSnapshotDir(cwd: string, componentName: string): string {
  return path.join(cwd, SNAPSHOT_ROOT, componentName);
}

/**
 * Save a snapshot of generated template output.
 *
 * @param cwd - Project root directory
 * @param componentName - PascalCase component name (e.g. "Button")
 * @param files - Map of fileName → content (e.g. { "Button.tsx": "..." })
 */
export async function saveSnapshot(
  cwd: string,
  componentName: string,
  files: Record<string, string>
): Promise<void> {
  const dir = getSnapshotDir(cwd, componentName);
  await fs.ensureDir(dir);

  await Promise.all(
    Object.entries(files).map(([fileName, content]) =>
      fs.writeFile(path.join(dir, fileName), content, 'utf-8')
    )
  );
}

/**
 * Load snapshot files for a component.
 *
 * @returns Map of fileName → content, or null if no snapshot exists
 */
export async function loadSnapshot(
  cwd: string,
  componentName: string
): Promise<Record<string, string> | null> {
  const dir = getSnapshotDir(cwd, componentName);

  if (!(await fs.pathExists(dir))) {
    return null;
  }

  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files: Record<string, string> = {};

  await Promise.all(
    entries
      .filter((e) => e.isFile())
      .map(async (entry) => {
        files[entry.name] = await fs.readFile(
          path.join(dir, entry.name),
          'utf-8'
        );
      })
  );

  return Object.keys(files).length > 0 ? files : null;
}

/**
 * Check if a snapshot exists for a component.
 */
export async function hasSnapshot(
  cwd: string,
  componentName: string
): Promise<boolean> {
  return fs.pathExists(getSnapshotDir(cwd, componentName));
}

/**
 * Delete the snapshot for a component.
 */
export async function deleteSnapshot(
  cwd: string,
  componentName: string
): Promise<void> {
  const dir = getSnapshotDir(cwd, componentName);
  if (await fs.pathExists(dir)) {
    await fs.remove(dir);
  }
}
