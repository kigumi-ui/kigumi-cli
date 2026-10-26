/**
 * Which declaration of a custom property wins the cascade in a built
 * stylesheet, judged by cascade layers alone (issue #194). The React
 * consumer suite uses it on Vite's output to prove that a rule in
 * overrides.css beats the same rule in theme.css.
 *
 * It assumes the competing rules share a selector, as the suite's probes
 * do (`:root`), so specificity never decides. What it models:
 * - layers rank by the first appearance of their top-level name, in an
 *   `@layer a, b;` statement or an `@layer a { … }` block, and a later layer
 *   beats an earlier one;
 * - a declaration outside every layer beats every layered one;
 * - within the same rank, the later declaration wins.
 *
 * A brace-depth scan rather than a regex, so nesting, comments and quoted
 * strings cannot fool it.
 */

export interface CascadeWinner {
  value: string;
  /** The top-level layer the declaration sits in, `null` when unlayered. */
  layer: string | null;
}

interface Declaration {
  value: string;
  /** Enclosing layer names, outermost first. */
  layers: string[];
}

export function cascadeWinner(
  css: string,
  property: string
): CascadeWinner | undefined {
  const source = css.replace(/\/\*[\s\S]*?\*\//g, '');
  // Top-level layer names in order of first appearance.
  const order: string[] = [];
  const declarations: Declaration[] = [];
  // One entry per open block: the layer it opens, or null for any other.
  const stack: (string | null)[] = [];
  let segmentStart = 0;

  const layersOpen = () => stack.filter((l): l is string => l !== null);
  const register = (names: string[]) => {
    const top = [...layersOpen(), ...names][0];
    if (top && !order.includes(top)) order.push(top);
  };
  const readSegment = (end: number) => {
    const segment = source.slice(segmentStart, end).trim();
    const statement = /^@layer\s+([^{]+)$/.exec(segment);
    if (statement) {
      for (const name of statement[1].split(',')) register([name.trim()]);
      return;
    }
    const colon = segment.indexOf(':');
    if (colon > 0 && segment.slice(0, colon).trim() === property) {
      declarations.push({
        value: segment.slice(colon + 1).trim(),
        layers: layersOpen(),
      });
    }
  };

  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    if (char === '"' || char === "'") {
      const close = source.indexOf(char, i + 1);
      i = close === -1 ? source.length : close;
      continue;
    }
    if (char === '{') {
      const prelude = source.slice(segmentStart, i).trim();
      const block = /^@layer\s+([\w.-]+)$/.exec(prelude);
      if (block) register([block[1]]);
      stack.push(block ? block[1] : null);
      segmentStart = i + 1;
    } else if (char === ';') {
      readSegment(i);
      segmentStart = i + 1;
    } else if (char === '}') {
      readSegment(i);
      stack.pop();
      segmentStart = i + 1;
    }
  }

  // Unlayered ranks above every layer; later wins within a rank.
  const rank = (d: Declaration) =>
    d.layers.length === 0 ? order.length : order.indexOf(d.layers[0]);
  let winner: Declaration | undefined;
  for (const declaration of declarations) {
    if (!winner || rank(declaration) >= rank(winner)) winner = declaration;
  }
  return winner && { value: winner.value, layer: winner.layers[0] ?? null };
}
