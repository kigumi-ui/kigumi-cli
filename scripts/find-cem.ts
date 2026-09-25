import fs from 'fs-extra';
import path from 'path';

const PRO_PACKAGE = '@awesome.me/webawesome-pro';
const FREE_PACKAGE = '@awesome.me/webawesome';
const PRO_STORE_PREFIX = '@awesome.me+webawesome-pro@';
const FREE_STORE_PREFIX = '@awesome.me+webawesome@';

/** Which Web Awesome package a resolved CEM came from. */
export type CemTier = 'pro' | 'free';

/**
 * The outcome of resolving a CEM: where it is, which package supplied it, and
 * how many components it describes.
 *
 * The component count is part of the result because callers must be able to
 * tell a complete CEM from a partial one. The free package describes only the
 * free components, and a guard that silently verified that subset while
 * printing an unqualified pass would repeat the defect in issue #43 at smaller
 * scale.
 */
export interface CemResolution {
  found: boolean;
  path: string | null;
  tier: CemTier | null;
  componentCount: number;
}

const NOT_FOUND: CemResolution = {
  found: false,
  path: null,
  tier: null,
  componentCount: 0,
};

/** Why Check A can or cannot run against the CEM that was resolved. */
export type CemOutcome = 'complete' | 'partial' | 'absent';

export interface CemVerdict {
  usable: boolean;
  outcome: CemOutcome;
  reason: string;
}

/**
 * Decide whether a resolved CEM is complete enough for Check A to run.
 *
 * Check A regenerates every template and diffs it against what is committed.
 * That is only honest against a CEM describing every component the registry
 * tracks: run against the free package it would verify the free subset and say
 * nothing about the remaining Pro components. Issue #43 is what happens when
 * "said nothing" gets printed as a pass, so the gate is all-or-nothing and a
 * partial CEM is refused rather than quietly narrowed.
 *
 * A CEM describing *more* components than the registry tracks is a superset,
 * not a gap: Web Awesome may ship a component Kigumi has not wrapped yet.
 */
export function assessCemCompleteness(
  resolution: CemResolution,
  registrySize: number
): CemVerdict {
  if (!resolution.found) {
    return {
      usable: false,
      outcome: 'absent',
      reason:
        'no Custom Elements Manifest found (Web Awesome Pro not installed)',
    };
  }

  if (resolution.componentCount < registrySize) {
    return {
      usable: false,
      outcome: 'partial',
      reason:
        `the ${resolution.tier} Custom Elements Manifest describes ` +
        `${resolution.componentCount} of ${registrySize} registry components`,
    };
  }

  return {
    usable: true,
    outcome: 'complete',
    reason:
      `${resolution.tier} Custom Elements Manifest, ` +
      `${resolution.componentCount} components`,
  };
}

/** Count the tagged custom elements a CEM describes. */
function countComponents(cem: unknown): number {
  const modules = (cem as { modules?: unknown[] })?.modules;
  if (!Array.isArray(modules)) return 0;

  const tags = new Set<string>();
  for (const mod of modules) {
    const declarations = (mod as { declarations?: unknown[] })?.declarations;
    if (!Array.isArray(declarations)) continue;
    for (const decl of declarations) {
      const tagName = (decl as { tagName?: unknown })?.tagName;
      if (typeof tagName === 'string' && tagName) tags.add(tagName);
    }
  }
  return tags.size;
}

/**
 * Candidate CEM locations under `root`, most-preferred first.
 *
 * Pro outranks free because it describes every component; within a tier, the
 * docs tree outranks the root tree because that is where the docs site installs
 * its dependencies.
 *
 * Every path is rooted at `root`. Resolution must never consult another
 * checkout: the skill-reference generator used to walk up to the main worktree
 * via `git rev-parse --git-common-dir`, which made local runs silently richer
 * than CI runs and produced 45% smaller output wherever that lookup failed
 * (issue #43).
 */
function candidatePaths(root: string): Array<{ path: string; tier: CemTier }> {
  const direct = (base: string, pkg: string) =>
    path.join(base, 'node_modules', pkg, 'dist', 'custom-elements.json');

  const docs = path.join(root, 'docs');
  return [
    { path: direct(docs, PRO_PACKAGE), tier: 'pro' },
    { path: direct(root, PRO_PACKAGE), tier: 'pro' },
    { path: direct(docs, FREE_PACKAGE), tier: 'free' },
    { path: direct(root, FREE_PACKAGE), tier: 'free' },
  ];
}

/** Locate a CEM in the pnpm store under `storeRoot` for one package prefix. */
async function findInPnpmStore(
  storeRoot: string,
  prefix: string,
  pkg: string,
  pinnedVersion: string | null
): Promise<string | null> {
  if (!(await fs.pathExists(storeRoot))) return null;

  const dirs = (await fs.readdir(storeRoot)).filter((dir) =>
    dir.startsWith(prefix)
  );
  const exact = pinnedVersion ? `${prefix}${pinnedVersion}` : null;
  const pinned = exact
    ? dirs.filter((dir) => dir === exact || dir.startsWith(`${exact}_`))
    : [];
  const ordered = pinned.length > 0 ? pinned : dirs.sort().reverse();

  for (const dir of ordered) {
    const jsonPath = path.join(
      storeRoot,
      dir,
      'node_modules',
      pkg,
      'dist',
      'custom-elements.json'
    );
    if (await fs.pathExists(jsonPath)) return jsonPath;
  }
  return null;
}

/**
 * Resolve a Custom Elements Manifest beneath `root`, reporting which package
 * supplied it and how many components it describes.
 *
 * Probes, in order: the Pro package (docs tree, then root tree, then either
 * pnpm store), then the free package in the same order. Only paths under
 * `root` are considered.
 *
 * `tier` narrows the probe to one package. A caller that must read the same
 * manifest locally and in CI, where only the free package is installed, asks
 * for `free` so a local Pro install cannot make its run richer (issue #74).
 */
export async function resolveCem(
  root: string,
  options: { tier?: CemTier } = {}
): Promise<CemResolution> {
  const wanted = (tier: CemTier) =>
    options.tier === undefined || options.tier === tier;
  const pinnedVersion = resolvePinnedProVersionAt(root);

  const describe = async (
    jsonPath: string,
    tier: CemTier
  ): Promise<CemResolution> => ({
    found: true,
    path: jsonPath,
    tier,
    componentCount: countComponents(await fs.readJson(jsonPath)),
  });

  for (const candidate of candidatePaths(root).filter((c) => wanted(c.tier))) {
    if (await fs.pathExists(candidate.path)) {
      return describe(candidate.path, candidate.tier);
    }
  }

  const stores = [
    path.join(root, 'docs', 'node_modules', '.pnpm'),
    path.join(root, 'node_modules', '.pnpm'),
  ];
  const tiers: Array<{ prefix: string; pkg: string; tier: CemTier }> = [
    { prefix: PRO_STORE_PREFIX, pkg: PRO_PACKAGE, tier: 'pro' },
    { prefix: FREE_STORE_PREFIX, pkg: FREE_PACKAGE, tier: 'free' },
  ];

  for (const { prefix, pkg, tier } of tiers.filter((t) => wanted(t.tier))) {
    for (const store of stores) {
      const hit = await findInPnpmStore(store, prefix, pkg, pinnedVersion);
      if (hit) return describe(hit, tier);
    }
  }

  return NOT_FOUND;
}

/** {@link resolvePinnedProVersion}, for an arbitrary root. */
function resolvePinnedProVersionAt(root: string): string | null {
  try {
    const pkg = fs.readJsonSync(path.join(root, 'docs/package.json'));
    const spec: unknown =
      pkg?.dependencies?.[PRO_PACKAGE] ?? pkg?.devDependencies?.[PRO_PACKAGE];
    if (typeof spec !== 'string') return null;
    const version = spec.replace(/^[\s^~>=<]+/, '').trim();
    return version || null;
  } catch {
    return null;
  }
}
