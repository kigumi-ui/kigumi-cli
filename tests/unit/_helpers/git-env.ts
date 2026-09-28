/**
 * An environment for spawning git against a temporary repository.
 *
 * Git exports `GIT_INDEX_FILE` to its hooks, and lint-staged runs
 * `vitest related` inside the pre-commit hook. A test that passes
 * `process.env` through then runs its `git add` against the real
 * repository's index instead of its temporary one. On issue #150 a commit
 * made that way kept only the staged files and deleted the rest of the
 * tree. Dropping every `GIT_*` variable points git back at the repository
 * in `cwd`.
 */
export function isolatedGitEnv(
  extra: Record<string, string> = {}
): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (!key.startsWith('GIT_')) env[key] = value;
  }
  return { ...env, ...extra };
}
