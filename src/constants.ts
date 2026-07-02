/**
 * Central Constants for Kigumi CLI
 *
 * PURPOSE: Single source of truth for magic strings and configuration values.
 * Changes here propagate to the entire codebase.
 *
 * @see AGENTS.md for usage context
 */

// =============================================================================
// Package Names
// =============================================================================

/** Free tier npm package name */
export const WEB_AWESOME_FREE_PACKAGE = '@awesome.me/webawesome';

/** Pro tier npm package name */
export const WEB_AWESOME_PRO_PACKAGE = '@awesome.me/webawesome-pro';

/** Scope for Web Awesome packages */
export const WEB_AWESOME_SCOPE = '@awesome.me';

// =============================================================================
// Web Component Configuration
// =============================================================================

/** Prefix for all Web Awesome custom elements (e.g., wa-button, wa-card) */
export const WEB_COMPONENT_PREFIX = 'wa-';

// =============================================================================
// Environment Variables
// =============================================================================

/** Environment variable key for Pro tier authentication token */
export const ENV_TOKEN_KEY = 'WEBAWESOME_NPM_TOKEN';

/**
 * Minimum valid token length for Pro tier
 *
 * WHY: Cloudsmith tokens are typically 40+ chars. 10 is a safety threshold
 * to avoid accepting malformed/empty values like "=" or "token".
 */
export const MIN_TOKEN_LENGTH = 10;

// =============================================================================
// File Names
// =============================================================================

/** Kigumi configuration file name */
export const CONFIG_FILE_NAME = 'kigumi.config.json';

/** Environment variables file name */
export const ENV_FILE_NAME = '.env';

/** NPM registry configuration file name */
export const NPMRC_FILE_NAME = '.npmrc';

/** Kigumi setup file (generated) */
export const KIGUMI_SETUP_FILE = 'kigumi.ts';

/** Theme CSS file (generated) */
export const THEME_CSS_FILE = 'theme.css';

/** Vite environment types file */
export const VITE_ENV_DTS_FILE = 'vite-env.d.ts';

// =============================================================================
// NPM Registry URLs
// =============================================================================

/** Public npm registry for Free tier */
export const NPM_PUBLIC_REGISTRY = 'https://registry.npmjs.org/';

/** Cloudsmith registry for Pro tier */
export const NPM_PRO_REGISTRY =
  'https://npm.cloudsmith.io/fortawesome/webawesome-pro';

// =============================================================================
// Regex Patterns
// =============================================================================

/**
 * Regex to match Free package imports
 * WHY: Matches @awesome.me/webawesome but NOT @awesome.me/webawesome-pro
 */
export const FREE_PACKAGE_REGEX = /@awesome\.me\/webawesome(?!-pro)/g;

/**
 * Regex to match Pro package imports
 */
export const PRO_PACKAGE_REGEX = /@awesome\.me\/webawesome-pro/g;

/**
 * Non-global patterns for .test() usage in loops.
 * WHY: The /g flag on module-level singletons causes lastIndex state to
 * persist between calls, making every other file in a loop silently skip.
 * Use these for .test(); use FREE_PACKAGE_REGEX / PRO_PACKAGE_REGEX for .replace().
 */
export const FREE_PACKAGE_PATTERN = /@awesome\.me\/webawesome(?!-pro)/;
export const PRO_PACKAGE_PATTERN = /@awesome\.me\/webawesome-pro/;

/**
 * Regex to extract token from .env file
 * WHY: Matches WEBAWESOME_NPM_TOKEN with optional whitespace around =
 */
export const ENV_TOKEN_REGEX = /^\s*WEBAWESOME_NPM_TOKEN\s*=\s*(.+?)\s*$/m;

// =============================================================================
// Default Paths
// =============================================================================

/** Default components directory */
export const DEFAULT_COMPONENTS_DIR = 'src/components/ui';

/** Default utils/lib directory */
export const DEFAULT_UTILS_DIR = 'src/lib';

/** Default styles directory */
export const DEFAULT_STYLES_DIR = 'src/styles';

// =============================================================================
// Exit Codes
// =============================================================================

/** Successful exit */
export const EXIT_SUCCESS = 0;

/** Error exit */
export const EXIT_ERROR = 1;

// =============================================================================
// Timeouts
// =============================================================================

/** Install command timeout in milliseconds (5 minutes) */
export const INSTALL_TIMEOUT_MS = 300_000;

// =============================================================================
// Web Awesome Version
// =============================================================================

/**
 * Default Web Awesome package version.
 *
 * Exact pin (no `^`/`~`): a kigumi release is conformant to one specific Web
 * Awesome version and must never auto-float. Used only as a fallback when the
 * version map has no entry for the running CLI version (see version-map.ts).
 */
export const DEFAULT_WEBAWESOME_VERSION = '3.10.0';

// =============================================================================
// Community Registry
// =============================================================================

/** GitHub raw content base URL */
export const GITHUB_RAW_BASE_URL = 'https://raw.githubusercontent.com';

/** Kigumi cache directory (relative to home dir) */
export const KIGUMI_CACHE_DIR = '.kigumi/cache';

/** Registry cache TTL in milliseconds (1 hour) */
export const REGISTRY_CACHE_TTL_MS = 3_600_000;

/** Community registry file name */
export const REGISTRY_FILE_NAME = 'registry.json';

// =============================================================================
// Update Check
// =============================================================================

/** NPM registry URL for checking latest CLI version */
export const NPM_REGISTRY_URL = 'https://registry.npmjs.org/kigumi/latest';

/** Update check cache TTL in milliseconds (24 hours) */
export const UPDATE_CHECK_CACHE_TTL_MS = 86_400_000;

/** Update check fetch timeout in milliseconds (3 seconds) */
export const UPDATE_CHECK_TIMEOUT_MS = 3_000;

/** Update check cache file name (within KIGUMI_CACHE_DIR) */
export const UPDATE_CHECK_CACHE_FILE = 'update-check.json';

// =============================================================================
// GitHub Repository
// =============================================================================

/** GitHub repository URL */
export const GITHUB_REPO_URL = 'https://github.com/Siregar/kigumi-cli';

/** GitHub issues URL for bug reports */
export const GITHUB_ISSUES_URL = `${GITHUB_REPO_URL}/issues`;

// =============================================================================
// CLI Version
// =============================================================================

import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __constants_filename = fileURLToPath(import.meta.url);
const __constants_dirname = dirname(__constants_filename);
const __cliPackageJson = JSON.parse(
  readFileSync(join(__constants_dirname, '..', 'package.json'), 'utf-8')
);

/** Current Kigumi CLI version (read from package.json) */
export const CLI_VERSION: string = __cliPackageJson.version;
