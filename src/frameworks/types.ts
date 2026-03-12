/**
 * Framework Plugin System - Core Types
 *
 * This module defines the contract that all framework plugins must implement.
 * Each framework (React, Vue, Angular, Svelte) provides its own implementation.
 */

import type { KigumiConfig } from '../schemas/config.js';

/**
 * Detection result from framework.detect()
 */
export interface DetectionResult {
  detected: boolean;
  confidence: 'high' | 'medium' | 'low';
  version?: string;
  details?: {
    packageJsonDeps?: string[];
    configFiles?: string[];
  };
}

/**
 * Generated file from component generation
 */
export interface GeneratedFile {
  path: string;
  content: string;
  overwrite?: boolean;
}

/**
 * Options for component generation
 */
export interface GenerateOptions {
  overwrite: boolean;
  typescript: boolean;
  tests: boolean;
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors?: string[];
  warnings?: string[];
}

/**
 * Component definition from registry
 */
export interface ComponentDefinition {
  name: string;
  tagName: string;
  category: string;
  tier: 'free' | 'pro';
  props: ComponentProp[];
  description?: string;
}

/**
 * Component property definition
 */
export interface ComponentProp {
  name: string;
  type: string;
  description?: string;
  required?: boolean;
  default?: string | number | boolean;
}

/**
 * Framework Plugin Interface
 *
 * All framework plugins must implement this interface to ensure
 * consistent behavior across different frameworks.
 */
export interface FrameworkPlugin {
  /**
   * Framework identifier
   */
  readonly name: 'react' | 'vue' | 'angular' | 'svelte';

  /**
   * Detect if this framework is used in the project
   *
   * @param cwd - Current working directory
   * @returns Detection result with confidence level
   */
  detect(cwd: string): Promise<DetectionResult>;

  /**
   * Generate component files for this framework
   *
   * @param cwd - Current working directory
   * @param config - Kigumi configuration
   * @param component - Component definition from registry
   * @param options - Generation options
   * @returns Array of generated files
   */
  generateComponent(
    cwd: string,
    config: KigumiConfig,
    component: ComponentDefinition,
    options: GenerateOptions
  ): Promise<GeneratedFile[]>;

  /**
   * Generate framework-specific setup files
   *
   * Examples:
   * - React: kigumi.ts, vite-env.d.ts
   * - Vue: kigumi.ts, shims-vue.d.ts
   * - Angular: kigumi.module.ts
   *
   * @param cwd - Current working directory
   * @param config - Kigumi configuration
   * @returns Array of generated setup files
   */
  generateSetupFiles(
    cwd: string,
    config: KigumiConfig
  ): Promise<GeneratedFile[]>;

  /**
   * Install framework-specific dependencies
   *
   * @param cwd - Current working directory
   * @param packageManager - Package manager to use (npm, pnpm, yarn, bun)
   * @param additionalDeps - Additional dependencies to install
   */
  installDependencies(
    cwd: string,
    packageManager: string,
    additionalDeps?: string[]
  ): Promise<void>;

  /**
   * Validate framework-specific configuration
   *
   * @param config - Partial configuration to validate
   * @returns Validation result with errors/warnings
   */
  validateConfig(config: Partial<KigumiConfig>): ValidationResult;

  /**
   * Get framework-specific TypeScript configuration
   *
   * Optional: Only needed if framework has special TS requirements
   *
   * @returns Partial TypeScript config object
   */
  getTypeScriptConfig?(): Partial<Record<string, unknown>>;

  /**
   * Get framework-specific build configuration
   *
   * Optional: Only needed if framework has special build requirements
   *
   * @returns Build config object
   */
  getBuildConfig?(): Record<string, unknown>;
}
