/**
 * Community Registry Schema
 *
 * Zod schema for validating community registry.json files.
 * A community registry is a GitHub repo containing components and/or themes
 * that can be installed via `kigumi add --from <url>`.
 */

import { z } from 'zod';
import { frameworkSchema } from './config.js';

/**
 * Component file references for a specific framework
 */
export const componentFilesSchema = z.object({
  /** Path to main component file, relative to registry root */
  component: z.string().min(1),
  /** Path to CSS file */
  css: z.string().optional(),
  /** Path to test file */
  test: z.string().optional(),
  /** Additional files (utils, hooks, types) */
  extras: z.array(z.string()).default([]),
});

export type ComponentFiles = z.infer<typeof componentFilesSchema>;

/**
 * Community component definition
 */
export const communityComponentSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.string().optional(),
  /** Keys of other components in this registry that this component depends on */
  dependencies: z.array(z.string()).default([]),
  /** Framework-specific file paths (keyed by framework name) */
  files: z.record(z.string(), componentFilesSchema).refine(
    (files) => {
      const validFrameworks = ['react', 'vue', 'svelte', 'angular'];
      return Object.keys(files).every((k) => validFrameworks.includes(k));
    },
    {
      message:
        'File keys must be valid framework names (react, vue, svelte, angular)',
    }
  ),
  /** npm packages this component needs (not Web Awesome packages) */
  peerDependencies: z.record(z.string(), z.string()).optional(),
});

export type CommunityComponent = z.infer<typeof communityComponentSchema>;

/**
 * Community theme definition
 */
export const communityThemeSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  /** URL to a preview screenshot */
  preview: z.string().url().optional(),
  /** Theme files */
  files: z.object({
    /** Main theme CSS file */
    css: z.string().min(1),
    /** Optional CSS variables file */
    variables: z.string().optional(),
  }),
  /** Built-in theme this extends */
  extends: z.string().optional(),
});

export type CommunityTheme = z.infer<typeof communityThemeSchema>;

/**
 * Community registry.json schema
 */
export const communityRegistrySchema = z.object({
  /** JSON Schema URL for editor support */
  $schema: z.string().optional(),
  /** Registry name */
  name: z.string().min(1),
  /** Registry description */
  description: z.string().optional(),
  /** Author name or handle */
  author: z.string().optional(),
  /** License identifier */
  license: z.string().optional(),
  /** Homepage URL */
  homepage: z.string().url().optional(),
  /** Semver version (no ranges) */
  version: z
    .string()
    .regex(/^\d+\.\d+\.\d+$/, 'Must be a valid semver version (e.g., 1.0.0)'),
  /** Frameworks this registry provides components for */
  frameworks: z.array(frameworkSchema).min(1),
  /** Minimum Kigumi CLI version required */
  kigumiVersion: z.string().optional(),
  /** Component definitions keyed by slug */
  components: z
    .record(z.string(), communityComponentSchema)
    .optional()
    .default({}),
  /** Theme definitions keyed by slug */
  themes: z.record(z.string(), communityThemeSchema).optional().default({}),
});

export type CommunityRegistry = z.infer<typeof communityRegistrySchema>;

/**
 * Validate a community registry object
 *
 * @param data - Raw registry data to validate
 * @returns Validated registry
 * @throws Error with formatted validation messages
 */
export function validateCommunityRegistry(data: unknown): CommunityRegistry {
  const result = communityRegistrySchema.safeParse(data);

  if (!result.success) {
    const errors = result.error.issues.map((issue) => {
      const path = issue.path.join('.');
      return path ? `${path}: ${issue.message}` : issue.message;
    });
    throw new Error(`Invalid registry.json:\n${errors.join('\n')}`);
  }

  return result.data;
}

/**
 * Validate that component dependencies reference valid keys within the registry
 *
 * @param registry - Validated registry
 * @returns Array of validation error messages (empty if valid)
 */
export function validateRegistryDependencies(
  registry: CommunityRegistry
): string[] {
  const errors: string[] = [];
  const componentKeys = new Set(Object.keys(registry.components));

  for (const [key, component] of Object.entries(registry.components)) {
    for (const dep of component.dependencies) {
      if (!componentKeys.has(dep)) {
        errors.push(
          `Component "${key}" depends on "${dep}" which is not defined in this registry`
        );
      }
    }
  }

  return errors;
}
