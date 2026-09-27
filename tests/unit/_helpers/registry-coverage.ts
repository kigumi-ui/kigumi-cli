/**
 * The fail-closed coverage block every registry function harness registers
 * (issues #75, #76, #77).
 *
 * Each loop proves its Templates against `COMPONENT_METADATA`, so a registry
 * component whose metadata is missing or emptied would leave nothing to
 * prove. These tests reject that state, and keep the eventless / methodless
 * pins honest in both directions. Registered by each loop, not only one, so
 * running any single framework's suite still fails closed.
 */

import { describe, expect, it } from 'vitest';
import { LOCAL_REGISTRY } from '../../../src/utils/registry.js';
import { COMPONENT_METADATA } from '../../../src/utils/component-metadata.js';
import { METHODLESS_COMPONENTS } from './methodless-components.js';
import { EVENTLESS_COMPONENTS } from './eventless-components.js';

export function describeRegistryCoverage(): void {
  const METHODLESS = new Set(METHODLESS_COMPONENTS);
  const EVENTLESS = new Set(EVENTLESS_COMPONENTS);

  describe('registry coverage (fail closed)', () => {
    it('has a COMPONENT_METADATA entry for every registry component', () => {
      const missing = Object.keys(LOCAL_REGISTRY).filter(
        (slug) => !(slug in COMPONENT_METADATA)
      );
      expect(missing).toEqual([]);
    });

    it('has a non-empty attribute list for every registry component', () => {
      const empty = Object.keys(LOCAL_REGISTRY).filter(
        (slug) => (COMPONENT_METADATA[slug]?.attributes.length ?? 0) === 0
      );
      expect(empty).toEqual([]);
    });

    it('keeps public CEM methods for every component not pinned as methodless', () => {
      const gutted = Object.keys(LOCAL_REGISTRY)
        .filter((slug) => !METHODLESS.has(slug))
        .filter(
          (slug) => (COMPONENT_METADATA[slug]?.methods.length ?? 0) === 0
        );
      expect(gutted).toEqual([]);
    });

    it('pins only components that really have no public CEM methods', () => {
      const stale = METHODLESS_COMPONENTS.filter(
        (slug) => (COMPONENT_METADATA[slug]?.methods.length ?? 0) > 0
      );
      expect(stale).toEqual([]);
    });

    it('keeps CEM events for every component not pinned as eventless', () => {
      const gutted = Object.keys(LOCAL_REGISTRY)
        .filter((slug) => !EVENTLESS.has(slug))
        .filter((slug) => (COMPONENT_METADATA[slug]?.events.length ?? 0) === 0);
      expect(gutted).toEqual([]);
    });

    it('pins only components that really have no CEM events', () => {
      const stale = EVENTLESS_COMPONENTS.filter(
        (slug) => (COMPONENT_METADATA[slug]?.events.length ?? 0) > 0
      );
      expect(stale).toEqual([]);
    });
  });
}
