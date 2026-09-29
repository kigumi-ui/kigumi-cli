/**
 * Environment that keeps a CLI run on the Free tier whatever this machine has.
 *
 * `init` switches to the Pro package when it finds a Web Awesome Pro token in
 * `WEBAWESOME_NPM_TOKEN`, the global `~/.npmrc` or the project's `.env`
 * (src/utils/token.ts). A developer's global token, or the one CI's e2e job
 * writes for the Pro consumer tsc suites, would otherwise move a Free suite
 * onto Pro and fail its `@awesome.me/webawesome` assertions. The projects
 * these suites scaffold have no `.env`, so blanking the other two is enough.
 */
export const FREE_TIER_ENV: Readonly<Record<string, string>> = {
  WEBAWESOME_NPM_TOKEN: '',
  KIGUMI_SKIP_GLOBAL_NPMRC: 'true',
};
