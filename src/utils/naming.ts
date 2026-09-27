/**
 * Naming Convention Utilities
 *
 * PURPOSE: Converts between PascalCase, kebab-case, and other naming styles.
 * Used primarily for Angular's lowercase file naming convention and by the
 * template generators, which turn Web Awesome event names into per-framework
 * handler names.
 *
 * EXPORTS:
 * - toKebabCase() - PascalCase to kebab-case (e.g., ButtonGroup -> button-group)
 * - toPascalCase() - kebab-case to PascalCase (e.g., after-hide -> AfterHide)
 * - toCamelCase() - kebab-case to camelCase (e.g., after-hide -> afterHide)
 * - stripWaPrefix() - drops the leading 'wa-' from an event name
 * - toAngularOutputName() - the Angular @Output() name for an event
 *
 * The two directions are not mirror images. toKebabCase has to decide where a
 * run of capitals ends (QRCode -> qr-code); toPascalCase only ever joins parts
 * that are already separated by hyphens, so it needs no such rule.
 */

/**
 * Convert PascalCase to kebab-case
 *
 * The second replace handles consecutive capitals: without it QRCode becomes
 * 'qrcode' rather than 'qr-code', which silently misses registry and metadata
 * lookups keyed by the kebab name.
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

/**
 * Convert kebab-case to PascalCase
 *
 * Examples:
 * - after-hide -> AfterHide
 * - show -> Show
 * - qr-code -> QrCode
 */
export function toPascalCase(name: string): string {
  return name
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

/**
 * Convert kebab-case to camelCase
 *
 * Examples:
 * - after-hide -> afterHide
 * - show -> show
 */
export function toCamelCase(name: string): string {
  const pascal = toPascalCase(name);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

/**
 * Drop the leading 'wa-' from a Web Awesome event name.
 *
 * Kigumi wrappers expose simplified handler names, so the vendor prefix is
 * stripped before any casing conversion.
 *
 * Examples:
 * - wa-after-hide -> after-hide
 * - blur -> blur
 */
export function stripWaPrefix(eventName: string): string {
  return eventName.startsWith('wa-') ? eventName.slice(3) : eventName;
}

/**
 * The Angular @Output() name for a Web Awesome event.
 *
 * Strips 'wa-' and camelCases, then suffixes 'Event' where the plain name
 * cannot be used: 'input' always (it reads as the @Input() decorator), and any
 * name in `taken`, the component's public methods and @Input() names. Outputs
 * share one class namespace with both, so `blur()` forces `blurEvent`.
 *
 * Shared by the Angular generator and the Angular function harness, so the
 * name a Template declares and the name the harness binds cannot drift apart.
 *
 * Examples:
 * - wa-after-hide -> afterHide
 * - input -> inputEvent
 * - blur, with a blur() method -> blurEvent
 */
export function toAngularOutputName(
  eventName: string,
  taken: ReadonlySet<string>
): string {
  const camel = toCamelCase(stripWaPrefix(eventName));
  const name = camel === 'input' ? 'inputEvent' : camel;
  return taken.has(name) ? `${name}Event` : name;
}
