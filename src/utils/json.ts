/**
 * JSON Utilities
 *
 * Helper functions for parsing JSON files with comments (like Vite's tsconfig.app.json)
 */

import fs from 'fs-extra';

/**
 * Read and parse a JSON file that may contain comments
 *
 * Vite's tsconfig.app.json contains comments which are invalid JSON.
 * This function strips comments before parsing.
 *
 * @param filePath - Absolute path to JSON file
 * @returns Parsed JSON content
 */
export async function readJSONWithComments(filePath: string): Promise<unknown> {
  const content = await fs.readFile(filePath, 'utf-8');
  const stripped = stripJSONComments(content);
  return JSON.parse(stripped);
}

/**
 * Strip comments from JSON-like content
 *
 * Removes both single-line (//) and multi-line (/* *\/) comments
 *
 * @param content - JSON content with comments
 * @returns JSON content without comments
 */
export function stripJSONComments(content: string): string {
  return content
    .replace(/\/\/.*/g, '') // Remove single-line comments
    .replace(/\/\*[\s\S]*?\*\//g, ''); // Remove multi-line comments
}
