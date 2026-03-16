/**
 * Three-Way Merge Logic
 *
 * PURPOSE: Pure function module for merging component file changes.
 * Uses `node-diff3` to perform Git-style three-way merges with
 * base (snapshot) + ours (user's file) + theirs (fresh template).
 *
 * EXPORTS:
 * - FileStatus - Union type of all possible merge outcomes
 * - MergeResult - Result from node-diff3 merge
 * - FileMergeResult - Per-file merge result with status and content
 * - mergeFile() - Determine merge status for a single file
 * - threeWayMerge() - Perform the actual three-way merge
 */

import { diff3Merge } from 'node-diff3';

/**
 * All possible outcomes of a per-file merge.
 */
export type FileStatus =
  | 'up-to-date' // base === theirs → template unchanged
  | 'safe-overwrite' // base === ours → user didn't edit
  | 'already-current' // ours === theirs → already matches
  | 'clean-merge' // all differ, merge clean
  | 'conflict' // all differ, has conflicts
  | 'no-snapshot-match' // no snapshot, ours === theirs
  | 'no-snapshot-differ'; // no snapshot, ours !== theirs

/**
 * Result of a three-way merge operation.
 */
export interface MergeResult {
  /** The merged content (includes conflict markers if any) */
  content: string;
  /** Whether the merge has conflicts */
  hasConflicts: boolean;
  /** Number of conflict regions */
  conflictCount: number;
}

/**
 * Per-file merge result.
 */
export interface FileMergeResult {
  fileName: string;
  status: FileStatus;
  /** New file content to write, or null if no write needed */
  newContent: string | null;
  /** Merge details (only for clean-merge/conflict statuses) */
  merge?: MergeResult;
}

/**
 * Determine the merge status for a single file.
 *
 * Decision tree:
 * ```
 * No snapshot (base=null)?
 * ├── ours === theirs → 'no-snapshot-match'
 * └── ours !== theirs → 'no-snapshot-differ'
 *
 * Snapshot exists:
 * ├── base === theirs → 'up-to-date'
 * ├── base === ours   → 'safe-overwrite'
 * ├── ours === theirs → 'already-current'
 * └── all differ      → node-diff3 merge
 *     ├── clean → 'clean-merge'
 *     └── conflicts → 'conflict'
 * ```
 */
export function mergeFile(
  base: string | null,
  ours: string,
  theirs: string,
  fileName: string
): FileMergeResult {
  const oursNorm = ours.trim();
  const theirsNorm = theirs.trim();

  // No snapshot → legacy component
  if (base === null) {
    if (oursNorm === theirsNorm) {
      return { fileName, status: 'no-snapshot-match', newContent: null };
    }
    return { fileName, status: 'no-snapshot-differ', newContent: null };
  }

  const baseNorm = base.trim();

  // Template unchanged since install
  if (baseNorm === theirsNorm) {
    return { fileName, status: 'up-to-date', newContent: null };
  }

  // User didn't edit → safe to overwrite with new template
  if (baseNorm === oursNorm) {
    return { fileName, status: 'safe-overwrite', newContent: theirs };
  }

  // Already matches new template
  if (oursNorm === theirsNorm) {
    return { fileName, status: 'already-current', newContent: null };
  }

  // All three differ → perform three-way merge
  const merge = threeWayMerge(base, ours, theirs);

  if (merge.hasConflicts) {
    return { fileName, status: 'conflict', newContent: merge.content, merge };
  }

  return { fileName, status: 'clean-merge', newContent: merge.content, merge };
}

/**
 * Perform a three-way merge using node-diff3.
 *
 * Uses standard Git-style conflict markers:
 * ```
 * <<<<<<< yours
 * your changes
 * =======
 * template changes
 * >>>>>>> theirs
 * ```
 */
export function threeWayMerge(
  base: string,
  ours: string,
  theirs: string
): MergeResult {
  const baseLines = base.split('\n');
  const oursLines = ours.split('\n');
  const theirsLines = theirs.split('\n');

  const regions = diff3Merge(oursLines, baseLines, theirsLines);

  const outputLines: string[] = [];
  let conflictCount = 0;

  for (const region of regions) {
    if ('ok' in region && region.ok) {
      outputLines.push(...region.ok);
    } else if ('conflict' in region && region.conflict) {
      conflictCount++;
      outputLines.push('<<<<<<< yours');
      outputLines.push(...region.conflict.a);
      outputLines.push('=======');
      outputLines.push(...region.conflict.b);
      outputLines.push('>>>>>>> theirs');
    }
  }

  return {
    content: outputLines.join('\n'),
    hasConflicts: conflictCount > 0,
    conflictCount,
  };
}
