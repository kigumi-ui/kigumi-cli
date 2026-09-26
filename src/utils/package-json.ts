/**
 * Project package.json Reader
 *
 * PURPOSE: Reads the dependency map from the user's `package.json` for tier
 * and project detection, and reports a broken file the same way everywhere.
 *
 * - Missing file: an empty map. Every caller treats "no package.json" the
 *   same as "no dependencies", so they need no existence check of their own.
 * - Unreadable (permissions, a directory at that path): PackageJsonReadError.
 * - Not a JSON object (syntax error, or valid JSON such as `null`):
 *   PackageJsonInvalidError. Tier detection catches it and falls through to
 *   the token; project detection lets it reach the user.
 *
 * EXPORTS:
 * - readDependencies() - `dependencies` and `devDependencies`, merged
 * - readDependenciesSync() - Sync version, for detectTierSync
 */

import fs from 'fs-extra';
import path from 'path';
import {
  PackageJsonInvalidError,
  PackageJsonReadError,
} from '../errors/filesystem.js';

/** Package name to version range. */
export type Dependencies = Record<string, string>;

interface PackageJson {
  dependencies?: Dependencies;
  devDependencies?: Dependencies;
}

function isPackageJson(value: unknown): value is PackageJson {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** devDependencies win on a name listed in both, as they always have. */
function toDependencies(filePath: string, value: unknown): Dependencies {
  if (!isPackageJson(value)) {
    const found = Array.isArray(value) ? 'an array' : String(value);
    throw new PackageJsonInvalidError(
      filePath,
      new Error(`Expected a JSON object, found ${found}`)
    );
  }
  return { ...value.dependencies, ...value.devDependencies };
}

function toReadError(
  filePath: string,
  error: unknown
): PackageJsonInvalidError | PackageJsonReadError {
  return error instanceof SyntaxError
    ? new PackageJsonInvalidError(filePath, error)
    : new PackageJsonReadError(filePath, error);
}

export async function readDependencies(cwd: string): Promise<Dependencies> {
  const filePath = path.join(cwd, 'package.json');
  if (!(await fs.pathExists(filePath))) return {};

  let value: unknown;
  try {
    value = await fs.readJson(filePath);
  } catch (error) {
    throw toReadError(filePath, error);
  }
  return toDependencies(filePath, value);
}

export function readDependenciesSync(cwd: string): Dependencies {
  const filePath = path.join(cwd, 'package.json');
  if (!fs.pathExistsSync(filePath)) return {};

  let value: unknown;
  try {
    value = fs.readJsonSync(filePath);
  } catch (error) {
    throw toReadError(filePath, error);
  }
  return toDependencies(filePath, value);
}
