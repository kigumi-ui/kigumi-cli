import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { StudioConsoleContext, type ConsoleTabName } from './studio-console';

/** The console's open state, shared by its bar and by links into it. */
export function StudioConsoleProvider({ children }: { children: ReactNode }) {
  // Collapsed by default: the bar's counts say whether to look.
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<ConsoleTabName>('accessibility');
  const [focusRequest, setFocusRequest] = useState(0);

  const show = useCallback((tab: ConsoleTabName) => {
    setActive(tab);
    setOpen(true);
    setFocusRequest((request) => request + 1);
  }, []);

  const value = useMemo(
    () => ({ open, active, focusRequest, show, setOpen, setActive }),
    [open, active, focusRequest, show]
  );
  return (
    <StudioConsoleContext.Provider value={value}>
      {children}
    </StudioConsoleContext.Provider>
  );
}
