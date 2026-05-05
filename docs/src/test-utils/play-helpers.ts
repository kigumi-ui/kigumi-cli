import { expect, userEvent, waitFor, within } from 'storybook/test';

type Canvas = ReturnType<typeof within>;
type Spy = ((event: Event) => void) | undefined;

export async function clickTrigger(
  canvas: Canvas,
  text: RegExp | string
): Promise<void> {
  await userEvent.click(canvas.getByText(text));
}

// Storybook's portable stories pass a different spy reference into play() than
// the wrapper component captured at render-time, so wrappers that close over
// `args.onX` in a useEffect won't tick the spy that play() asserts on. Bridge
// by attaching a play-side listener to the underlying element that re-invokes
// the play-side spy whenever the component emits.
export function installEventProbe(
  el: Element | null | undefined,
  eventName: string,
  spy: Spy
): () => void {
  if (!el || !spy) return () => undefined;
  const probe = (event: Event): void => spy(event);
  el.addEventListener(eventName, probe);
  return () => el.removeEventListener(eventName, probe);
}

export async function waitForCalled<A extends Record<string, unknown>>(
  args: A,
  key: keyof A
): Promise<void> {
  await waitFor(() => expect(args[key]).toHaveBeenCalled());
}
