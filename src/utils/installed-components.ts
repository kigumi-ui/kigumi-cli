/**
 * Installed Component Resolution
 *
 * Shared by `kigumi diff` and `kigumi update`, which both need to answer the
 * same question: of the components sitting in the project, which ones can be
 * compared against a builtin template?
 *
 * Components installed from a community registry cannot: there is no builtin
 * template to diff against. They are returned separately rather than dropped
 * so the commands can say so instead of silently reporting success.
 */

import fs from 'fs-extra';
import path from 'path';
import { getComponent, normalizeComponentName } from './registry.js';
import { toKebabCase } from './naming.js';
import type { KigumiConfig } from '../schemas/config.js';
import type { OutputInterface } from '../output/types.js';

/** A component present in the project that has no builtin template */
export interface UnmanagedComponent {
  name: string;
  /** Registry it came from, when provenance recorded one */
  registryUrl?: string;
}

export interface ResolvedComponents {
  /** Components with a builtin template, in registry casing */
  components: string[];
  /** Components present but not comparable against a builtin template */
  unmanaged: UnmanagedComponent[];
}

function describeUnmanaged(
  name: string,
  config: KigumiConfig
): UnmanagedComponent {
  const provenance = config.installedComponents?.[name];
  return provenance?.registryUrl
    ? { name, registryUrl: provenance.registryUrl }
    : { name };
}

/**
 * Resolve which components a diff or update run should process.
 *
 * With explicit names, canonicalizes user input (kebab or PascalCase) to the
 * registry's casing. Without names, scans the components directory.
 */
export async function resolveComponents(
  names: string[],
  config: KigumiConfig,
  cwd: string
): Promise<ResolvedComponents> {
  if (names.length > 0) {
    const components: string[] = [];
    const unmanaged: UnmanagedComponent[] = [];

    for (const input of names) {
      const canonical = normalizeComponentName(input) ?? input;
      if (getComponent(toKebabCase(canonical)) !== null) {
        components.push(canonical);
      } else {
        unmanaged.push(describeUnmanaged(canonical, config));
      }
    }

    return { components, unmanaged };
  }

  const componentsDir = path.join(cwd, config.componentsDir);
  if (!(await fs.pathExists(componentsDir))) {
    return { components: [], unmanaged: [] };
  }

  const entries = await fs.readdir(componentsDir, { withFileTypes: true });
  const dirNames = entries
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();

  const components: string[] = [];
  const unmanaged: UnmanagedComponent[] = [];

  for (const name of dirNames) {
    if (getComponent(toKebabCase(name)) !== null) {
      components.push(name);
    } else {
      unmanaged.push(describeUnmanaged(name, config));
    }
  }

  return { components, unmanaged };
}

/**
 * Tell the user which components were left out, and why.
 *
 * @param verb - What the command would have done, e.g. "compared", "updated"
 */
export function reportUnmanagedComponents(
  unmanaged: UnmanagedComponent[],
  output: OutputInterface,
  verb: string
): void {
  if (unmanaged.length === 0) {
    return;
  }

  const names = unmanaged.map((u) => u.name).join(', ');
  output.warn(
    `${unmanaged.length} component(s) cannot be ${verb} against a built-in template: ${names}`
  );

  const fromRegistry = unmanaged.filter((u) => u.registryUrl);
  if (fromRegistry.length > 0) {
    const sources = [...new Set(fromRegistry.map((u) => u.registryUrl))];
    output.info(
      `  Installed from ${sources.join(', ')}. Reinstall with kigumi add --from <registry> to pick up changes.`
    );
  }
}
