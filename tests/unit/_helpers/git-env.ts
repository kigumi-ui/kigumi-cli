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

/**
 * Removes every `GIT_*` variable from `process.env` and returns a function
 * that puts them back. For code under test that spawns git with the
 * inherited environment, which `isolatedGitEnv()` cannot reach: inside the
 * pre-commit hook, its `git fetch` or `update-ref` would otherwise follow
 * the hook's variables to the real repository.
 */
export function stripGitEnv(): () => void {
  const saved = Object.entries(process.env).filter(([key]) =>
    key.startsWith('GIT_')
  );
  for (const [key] of saved) delete process.env[key];
  return () => {
    for (const [key, value] of saved) process.env[key] = value;
  };
}
