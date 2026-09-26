/**
 * Project package.json Reader
 *
 * PURPOSE: One place that reads the user's `package.json`, so every caller
 * reports an unreadable file the same way.
 *
 * Invalid JSON is rethrown as the original `SyntaxError`, because callers
 * disagree on what it means: tier detection treats it as "no tier signal"
 * and falls through to the token. Every other read failure (permissions, a
 * directory at that path) is the user's filesystem, not a bug in Kigumi, and
 * is thrown as `PackageJsonReadError`.
 *
 * Callers still check that the file exists first: a missing `package.json`
 * means something different to each of them.
 *
 * EXPORTS:
 * - readPackageJson() - Async read
 * - readPackageJsonSync() - Sync version, for detectTierSync
 */

import fs from 'fs-extra';
import { PackageJsonReadError } from '../errors/filesystem.js';

/** The parts of package.json Kigumi reads. */
export interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

export async function readPackageJson(filePath: string): Promise<PackageJson> {
  try {
    return await fs.readJson(filePath);
  } catch (error) {
    if (error instanceof SyntaxError) throw error;
    throw new PackageJsonReadError(filePath, error);
  }
}

export function readPackageJsonSync(filePath: string): PackageJson {
  try {
    return fs.readJsonSync(filePath);
  } catch (error) {
    if (error instanceof SyntaxError) throw error;
    throw new PackageJsonReadError(filePath, error);
  }
}
