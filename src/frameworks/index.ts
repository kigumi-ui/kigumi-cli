/**
 * Framework Registry
 *
 * Central registry for all framework plugins. Handles plugin discovery,
 * auto-detection, and plugin management.
 */

import type { FrameworkPlugin, DetectionResult } from './types.js';

/**
 * Framework plugin registry
 *
 * Note: Plugins are lazy-loaded to avoid circular dependencies and
 * reduce startup time. They're only loaded when needed.
 */
const FRAMEWORK_PLUGINS = new Map<string, () => Promise<FrameworkPlugin>>();

/**
 * Register a framework plugin
 *
 * @param name - Framework name
 * @param loader - Lazy loader function
 */
export function registerFrameworkPlugin(
  name: string,
  loader: () => Promise<FrameworkPlugin>
): void {
  FRAMEWORK_PLUGINS.set(name, loader);
}

/**
 * Framework Registry
 *
 * Provides methods to get plugins, detect frameworks, and list supported frameworks.
 */
export class FrameworkRegistry {
  /**
   * Get plugin for specific framework
   *
   * @param framework - Framework name
   * @returns Framework plugin
   * @throws Error if framework is not supported
   */
  static async getPlugin(framework: string): Promise<FrameworkPlugin> {
    const loader = FRAMEWORK_PLUGINS.get(framework);

    if (!loader) {
      const supported = Array.from(FRAMEWORK_PLUGINS.keys()).join(', ');
      throw new Error(
        `Unsupported framework: ${framework}. Supported frameworks: ${supported}`
      );
    }

    return await loader();
  }

  /**
   * Auto-detect framework in project
   *
   * Runs detection for all registered frameworks and returns the one
   * with the highest confidence. If multiple frameworks are detected,
   * picks the one with highest confidence score.
   *
   * @param cwd - Current working directory
   * @returns Framework plugin or null if no framework detected
   */
  static async detectFramework(cwd: string): Promise<FrameworkPlugin | null> {
    const results: Array<{ plugin: FrameworkPlugin; result: DetectionResult }> =
      [];

    // Load all plugins and run detection in parallel
    const detectionPromises = Array.from(FRAMEWORK_PLUGINS.entries()).map(
      async ([_name, loader]) => {
        try {
          const plugin = await loader();
          const result = await plugin.detect(cwd);
          if (result.detected) {
            results.push({ plugin, result });
          }
        } catch (_error) {
          // Detection errors are expected when a framework isn't present
        }
      }
    );

    await Promise.all(detectionPromises);

    // No frameworks detected
    if (results.length === 0) {
      return null;
    }

    // Single framework detected
    if (results.length === 1) {
      return results[0].plugin;
    }

    // Multiple frameworks - pick highest confidence
    const confidenceScore = { high: 3, medium: 2, low: 1 };
    results.sort((a, b) => {
      return (
        confidenceScore[b.result.confidence] -
        confidenceScore[a.result.confidence]
      );
    });

    return results[0].plugin;
  }

  /**
   * Get all supported frameworks
   *
   * @returns Array of framework names
   */
  static getSupportedFrameworks(): string[] {
    return Array.from(FRAMEWORK_PLUGINS.keys());
  }

  /**
   * Check if framework is supported
   *
   * @param framework - Framework name
   * @returns True if framework is supported
   */
  static isSupported(framework: string): boolean {
    return FRAMEWORK_PLUGINS.has(framework);
  }

  /**
   * Get detection results for all frameworks
   *
   * Useful for debugging or showing users what was detected.
   *
   * @param cwd - Current working directory
   * @returns Map of framework names to detection results
   */
  static async detectAll(cwd: string): Promise<Map<string, DetectionResult>> {
    const results = new Map<string, DetectionResult>();

    const detectionPromises = Array.from(FRAMEWORK_PLUGINS.entries()).map(
      async ([name, loader]) => {
        try {
          const plugin = await loader();
          const result = await plugin.detect(cwd);
          results.set(name, result);
        } catch (_error) {
          // Detection errors are expected when a framework isn't present
          results.set(name, {
            detected: false,
            confidence: 'low',
          });
        }
      }
    );

    await Promise.all(detectionPromises);

    return results;
  }
}

// Register framework plugins
// Note: These are lazy-loaded to avoid circular dependencies
registerFrameworkPlugin('react', async () => {
  const { ReactPlugin } = await import('./react/index.js');
  return new ReactPlugin();
});

registerFrameworkPlugin('vue', async () => {
  const { VuePlugin } = await import('./vue/index.js');
  return new VuePlugin();
});

registerFrameworkPlugin('angular', async () => {
  const { AngularPlugin } = await import('./angular/index.js');
  return new AngularPlugin();
});

registerFrameworkPlugin('svelte', async () => {
  const { SveltePlugin } = await import('./svelte/index.js');
  return new SveltePlugin();
});
