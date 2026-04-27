/**
 * Community Registry Schema
 *
 * Zod schema for validating community registry.json files.
 * A community registry is a GitHub repo containing components and/or themes
 * that can be installed via `kigumi add --from <url>`.
 */

import semver from 'semver';
import { z } from 'zod';
import { CommunityRegistryInvalidError } from '../errors/community-registry.js';
import { frameworkSchema } from './config.js';

/**
 * Schema for a registry-supplied file path. Rejects absolute paths, parent
 * traversal segments, single-dot segments, empty segments, and Windows-style
 * backslashes so a malicious registry.json cannot escape the registry root
 * at validation time. Single-dot segments would be silently collapsed by
 * `path.resolve`, so rejecting them keeps the schema honest about the paths
 * it accepts.
 */
const safePathSchema = z
  .string()
  .min(1)
  .refine(
    (value) => {
      if (value.startsWith('/')) return false;
      if (value.includes('\\')) return false;
      return value
        .split('/')
        .every(
          (segment) => segment !== '..' && segment !== '.' && segment !== ''
        );
    },
    {
      message:
        "Path may not be absolute, contain '.', '..', empty segments, or backslashes",
    }
  );

/**
 * Component file references for a specific framework
 */
export const componentFilesSchema = z.object({
  /** Path to main component file, relative to registry root */
  component: safePathSchema,
  /** Path to CSS file */
  css: safePathSchema.optional(),
  /** Path to test file */
  test: safePathSchema.optional(),
  /** Additional files (utils, hooks, types) */
  extras: z.array(safePathSchema).default([]),
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
      const validFrameworks = ['react', 'vue', 'angular'];
      return Object.keys(files).every((k) => validFrameworks.includes(k));
    },
    {
      message: 'File keys must be valid framework names (react, vue, angular)',
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
  /** Semver version (no ranges); pre-release and build metadata permitted */
  version: z.string().refine((value) => semver.valid(value) !== null, {
    message: 'Must be a valid semver version (e.g., 1.0.0 or 1.0.0-beta.1)',
  }),
  /** Frameworks this registry provides components for */
  frameworks: z.array(frameworkSchema).min(1),
  /** Minimum Kigumi CLI version required (semver, no ranges) */
  kigumiVersion: z
    .string()
    .refine((value) => semver.valid(value) !== null, {
      message:
        'kigumiVersion must be a valid semver string (e.g., 0.19.0 or 1.0.0-beta.1)',
    })
    .optional(),
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
 * Validate a community registry object.
 *
 * @param data - Raw registry data to validate
 * @param url - Source URL of the registry, used for the typed error context
 * @returns Validated registry
 * @throws CommunityRegistryInvalidError with the failing issues
 */
export function validateCommunityRegistry(
  data: unknown,
  url: string
): CommunityRegistry {
  const result = communityRegistrySchema.safeParse(data);

  if (!result.success) {
    const errors = result.error.issues.map((issue) => {
      const path = issue.path.join('.');
      return path ? `${path}: ${issue.message}` : issue.message;
    });
    throw new CommunityRegistryInvalidError(url, errors);
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
