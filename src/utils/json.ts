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
 * Uses a state-machine parser to skip string literals, avoiding corruption
 * of glob patterns like `src/**\/*.ts` that contain `/*` sequences.
 *
 * @param content - JSON content with comments
 * @returns JSON content without comments
 */
export function stripJSONComments(content: string): string {
  let result = '';
  let i = 0;
  const len = content.length;

  while (i < len) {
    const ch = content[i];
    const next = content[i + 1];

    // String literal — copy verbatim (including any /* or // inside)
    if (ch === '"') {
      let j = i + 1;
      while (j < len) {
        if (content[j] === '\\') {
          j += 2; // skip escaped character
        } else if (content[j] === '"') {
          j++;
          break;
        } else {
          j++;
        }
      }
      result += content.slice(i, j);
      i = j;
      continue;
    }

    // Single-line comment — skip to end of line
    if (ch === '/' && next === '/') {
      i += 2;
      while (i < len && content[i] !== '\n') i++;
      continue;
    }

    // Multi-line comment — skip to closing */
    if (ch === '/' && next === '*') {
      i += 2;
      while (i < len && !(content[i] === '*' && content[i + 1] === '/')) i++;
      i += 2; // skip closing */
      continue;
    }

    result += ch;
    i++;
  }

  return result;
}
