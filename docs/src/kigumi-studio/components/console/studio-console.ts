import { createContext, useContext, type ReactNode } from 'react';

/** A tab of the Studio console, by its panel name. */
export type ConsoleTabName = 'accessibility';

/**
 * One tab of the console and the findings it counts on the bar. A new tab
 * brings its own entry, count included; the bar and the other tabs stay.
 */
export interface ConsoleTab {
  name: ConsoleTabName;
  label: string;
  /** The icon beside its count on the bar. */
  icon: string;
  /** Findings waiting for the user; shown on the bar and on the tab. */
  count: number;
  /** What the count counts, for its accessible name: "3 failing contrast pairs". */
  countLabel: string;
  content: ReactNode;
}

export interface StudioConsoleState {
  open: boolean;
  /** The tab shown while open, kept while collapsed. */
  active: ConsoleTabName;
  /**
   * Bumped by `show()`, so the console moves focus into the tab it opened:
   * from a link elsewhere, the user lands where the link pointed.
   */
  focusRequest: number;
  /** Open the console on `tab`, and move focus into it. */
  show: (tab: ConsoleTabName) => void;
  setOpen: (open: boolean) => void;
  setActive: (tab: ConsoleTabName) => void;
}

export const StudioConsoleContext = createContext<
  StudioConsoleState | undefined
>(undefined);

/**
 * The Studio console's state, or `undefined` outside a console: a link into
 * it, such as the Theme Agent's accessibility warning, then shows nothing.
 */
export function useStudioConsole(): StudioConsoleState | undefined {
  return useContext(StudioConsoleContext);
}
