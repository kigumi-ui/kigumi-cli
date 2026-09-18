/**
 * Registry Resolver
 *
 * Resolves a --from value to a GitHub URL.
 * Accepts either a full URL or a saved registry name from config.registries.
 */

import type { KigumiConfig } from '../schemas/config.js';
import { ValidationError } from '../errors/index.js';

/**
 * Resolve a --from value to a GitHub URL.
 *
 * @param from - A full GitHub URL or a connected registry name
 * @param config - Kigumi project configuration
 * @returns Resolved GitHub URL
 * @throws Error if name is not found in config.registries
 */
export function resolveRegistrySource(
  from: string,
  config: KigumiConfig
): string {
  // If it looks like a URL (contains "/" or "."), return as-is
  if (from.includes('/') || from.includes('.')) {
    return from;
  }

  // Otherwise, look up by name in config.registries
  const registries = config.registries || [];
  const match = registries.find(
    (r) => r.name?.toLowerCase() === from.toLowerCase()
  );

  if (!match) {
    const names = registries.map((r) => r.name).filter(Boolean);
    const available = names.join(', ');
    throw new ValidationError(
      'registry',
      from,
      names.length > 0 ? names : undefined,
      undefined,
      `Registry "${from}" not found.` +
        (available
          ? ` Connected registries: ${available}`
          : ' No registries are connected. Add one with "kigumi registry connect <url>".')
    );
  }

  return match.url;
}
