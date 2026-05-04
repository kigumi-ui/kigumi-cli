import * as fc from 'fast-check';

// Pin the seed in CI for reproducible runs; allow local discovery via FC_SEED.
// Resolves the initiative-level Open Question on fast-check seed strategy.
//
// FC_SEED parsing fails loudly on non-numeric input rather than silently
// falling back to NaN (which would still configure fast-check, but with a
// non-reproducible seed - the worst of both worlds).
function resolveSeed(): number {
  const raw = process.env.FC_SEED;
  if (raw === undefined || raw === '') return 1;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    throw new Error(
      `FC_SEED must be a finite number; got ${JSON.stringify(raw)}`
    );
  }
  return parsed;
}

fc.configureGlobal({
  seed: resolveSeed(),
  numRuns: 100,
});
