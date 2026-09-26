/**
 * Decide whether a script module is the process entry point.
 *
 * Scripts that are also imported (by tests, or by other scripts) must only run
 * their `main()` when executed directly. The obvious check,
 * `process.argv[1] === fileURLToPath(import.meta.url)`, breaks on symlinks:
 * Node resolves `import.meta.url` to the real path but leaves `argv[1]` as
 * typed. Invoking a script by an absolute path through a symlinked directory
 * then skips `main()` and exits 0 without a word. Comparing real paths on both
 * sides closes that gap.
 */

import { realpathSync } from 'fs';
import { fileURLToPath } from 'url';

export function isEntryPoint(
  importMetaUrl: string,
  argv1: string | undefined = process.argv[1]
): boolean {
  if (!argv1) return false;
  try {
    return realpathSync(argv1) === realpathSync(fileURLToPath(importMetaUrl));
  } catch {
    // argv[1] names no file on disk (e.g. `node -e`), so this module is not it.
    return false;
  }
}
