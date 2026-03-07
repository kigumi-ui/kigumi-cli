/**
 * File Modification Detection
 *
 * PURPOSE: Compares existing component files against freshly generated
 * template output to detect local modifications before overwriting.
 *
 * EXPORTS:
 * - FileModificationCheck - Result type for a single file check
 * - checkFileModification() - Compare existing file against generated content
 * - getModifiedFiles() - Filter to only modified files
 */

import fs from 'fs-extra';
import path from 'path';

export interface FileModificationCheck {
  /** Absolute path to the file */
  filePath: string;
  /** File name only (e.g. "Button.css") */
  fileName: string;
  /** Whether the file exists on disk */
  exists: boolean;
  /** Whether existing content differs from generated content */
  modified: boolean;
}

/**
 * Check if an existing file differs from freshly generated content.
 *
 * Trims both contents before comparison to avoid false positives
 * from trailing newline/whitespace differences.
 */
export async function checkFileModification(
  filePath: string,
  generatedContent: string
): Promise<FileModificationCheck> {
  const fileName = path.basename(filePath);
  const exists = await fs.pathExists(filePath);

  if (!exists) {
    return { filePath, fileName, exists: false, modified: false };
  }

  const existingContent = await fs.readFile(filePath, 'utf-8');
  const modified = existingContent.trim() !== generatedContent.trim();

  return { filePath, fileName, exists, modified };
}

/**
 * Filter a list of checks to only those with local modifications.
 */
export function getModifiedFiles(
  checks: FileModificationCheck[]
): FileModificationCheck[] {
  return checks.filter((check) => check.modified);
}
