import { createElement } from 'react';
import { useContrastResults } from '../../lib/use-contrast-results';
import { ContrastView } from './ContrastView';
import type { ConsoleTab } from './studio-console';

/** The Accessibility tab: every checked contrast pair, its count the failing ones. */
export function useAccessibilityTab(): ConsoleTab {
  const results = useContrastResults();
  const failing = results.filter((result) => !result.passes).length;
  return {
    name: 'accessibility',
    label: 'Accessibility',
    icon: 'universal-access',
    count: failing,
    countLabel:
      failing === 1 ? 'failing contrast pair' : 'failing contrast pairs',
    content: createElement(ContrastView, { results, failing }),
  };
}
