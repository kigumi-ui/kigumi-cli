/**
 * Naming Convention Utilities
 *
 * PURPOSE: Converts between PascalCase, kebab-case, and other naming styles.
 * Used primarily for Angular's lowercase file naming convention.
 *
 * EXPORTS:
 * - toKebabCase() - PascalCase to kebab-case (e.g., ButtonGroup -> button-group)
 */

/**
 * Convert PascalCase to kebab-case
 *
 * Examples:
 * - Button -> button
 * - ButtonGroup -> button-group
 * - QRCode -> qr-code
 * - AnimatedImage -> animated-image
 * - Icon -> icon
 */
export function toKebabCase(name: string): string {
  return name
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase();
}
