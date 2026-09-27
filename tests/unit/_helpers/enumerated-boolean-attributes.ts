/**
 * Boolean CEM attributes Web Awesome reads as enumerated attributes rather
 * than by presence, with the attribute value that means true and the one that
 * means false (issue #101). Keyed by attribute name: every Web Awesome element
 * that declares one of these parses it the same way.
 *
 * A presence attribute is true whenever it exists, so a Template drops it for
 * `false`. These are the opposite: `false` has to be written as its keyword.
 * Dropping it leaves the element's default, which for `spellcheck` is true,
 * and a bare attribute reads as false (`autocorrect=""` turns autocorrect off).
 *
 * Pinned as committed data, not read from the registry's `keywords` field:
 * the function harnesses check the generated Templates against it, and a
 * registry entry that lost its `keywords` must not also relax that check.
 * `enumerated-boolean-attributes.test.ts` proves the pin against the real
 * Free runtime in both directions, and that the registry agrees with it.
 */
export const ENUMERATED_BOOLEAN_ATTRIBUTES: Readonly<
  Record<string, { readonly true: string; readonly false: string }>
> = {
  autocorrect: { true: 'on', false: 'off' },
  spellcheck: { true: 'true', false: 'false' },
};
