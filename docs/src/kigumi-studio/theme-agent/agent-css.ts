import {
  splitStylesheet,
  splitTopLevel,
  validateCustomCSS,
  type CssNode,
} from '../lib/custom-css';

// Shared by the browser and the trigger.dev task (docs/trigger), like
// proposal.ts. Custom CSS the Theme Agent proposes is accepted only from a
// checked subset (ADR 0009); custom CSS the user writes by hand is not
// restricted, so a proposal keeps the user's rules unchecked when it carries
// them as they are. Loosening a rule here loosens what model output can do
// to the page.

/** The most custom CSS one proposal may carry, in characters. */
export const MAX_AGENT_CSS_LENGTH = 6000;

/**
 * The only at-rules allowed: they hold rules or keyframe blocks, which are
 * checked too.
 */
const ALLOWED_AT_RULES = new Set([
  'media',
  'supports',
  'container',
  'keyframes',
]);

const KEYFRAMES = /^@keyframes(?![\w-])\s*([\s\S]*)$/i;

/**
 * A plain identifier: no string, no escape (refused as script-like anyway),
 * and none of the keywords an animation-name reads as something else.
 */
const KEYFRAMES_NAME = /^[a-z][\w-]*$/i;
const NOT_A_KEYFRAMES_NAME =
  /^(?:none|initial|inherit|unset|revert|revert-layer|default)$/i;

/** A keyframe block's selector: from, to or a percentage. */
const KEYFRAME_SELECTOR = /^(?:from|to|\d+(?:\.\d+)?%)$/i;

/** Functions that load something from outside the page, vendor-prefixed too. */
const RESOURCE =
  /(?<![\w-])((?:-[a-z]+-)?(?:url|src|image-set|image|cross-fade|element))\s*\(/gi;

/** What reads as script or markup, or hides a name behind an escape. */
const SCRIPT_LIKE = [
  /expression\s*\(/i,
  /(?:java|vb)script\s*:/i,
  /-moz-binding/i,
  /(?<![\w-])behavior\s*:/i,
  /<\/?[a-z!]/i,
  /\\/,
];

/**
 * Functions that make a colour of their own, also from --wa- values:
 * color-mix(var(--wa-a), var(--wa-b)) paints a colour the contrast check on
 * the theme's values never sees (ADR 0009).
 */
const COLOUR_FUNCTION =
  /(?<![\w-])(rgba?|hsla?|hwb|lab|lch|oklab|oklch|color|color-mix|light-dark|device-cmyk|contrast-color)\s*\(/i;

const HEX_COLOUR = /#[0-9a-f]{3,8}(?![\w-])/i;

// The CSS named colours and system colours, lower case. `transparent` and
// `currentcolor` are allowed: they paint nothing of their own.
const NAMED_COLOURS = new Set(
  (
    'aliceblue antiquewhite aqua aquamarine azure beige bisque black ' +
    'blanchedalmond blue blueviolet brown burlywood cadetblue chartreuse ' +
    'chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan ' +
    'darkgoldenrod darkgray darkgreen darkgrey darkkhaki darkmagenta ' +
    'darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen ' +
    'darkslateblue darkslategray darkslategrey darkturquoise darkviolet ' +
    'deeppink deepskyblue dimgray dimgrey dodgerblue firebrick floralwhite ' +
    'forestgreen fuchsia gainsboro ghostwhite gold goldenrod gray green ' +
    'greenyellow grey honeydew hotpink indianred indigo ivory khaki lavender ' +
    'lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan ' +
    'lightgoldenrodyellow lightgray lightgreen lightgrey lightpink ' +
    'lightsalmon lightseagreen lightskyblue lightslategray lightslategrey ' +
    'lightsteelblue lightyellow lime limegreen linen magenta maroon ' +
    'mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen ' +
    'mediumslateblue mediumspringgreen mediumturquoise mediumvioletred ' +
    'midnightblue mintcream mistyrose moccasin navajowhite navy oldlace ' +
    'olive olivedrab orange orangered orchid palegoldenrod palegreen ' +
    'paleturquoise palevioletred papayawhip peachpuff peru pink plum ' +
    'powderblue purple rebeccapurple red rosybrown royalblue saddlebrown ' +
    'salmon sandybrown seagreen seashell sienna silver skyblue slateblue ' +
    'slategray slategrey snow springgreen steelblue tan teal thistle tomato ' +
    'turquoise violet wheat white whitesmoke yellow yellowgreen ' +
    'accentcolor accentcolortext activetext buttonborder buttonface ' +
    'buttontext canvas canvastext field fieldtext graytext highlight ' +
    'highlighttext linktext mark marktext selecteditem selecteditemtext ' +
    'visitedtext activeborder activecaption appworkspace background ' +
    'buttonhighlight buttonshadow captiontext inactiveborder ' +
    'inactivecaption inactivecaptiontext infobackground infotext menu ' +
    'menutext scrollbar threeddarkshadow threedface threedhighlight ' +
    'threedlightshadow threedshadow window windowframe windowtext'
  ).split(/\s+/)
);

const IDENTIFIER = /(?<![\w-])[a-z][\w-]*/gi;

// Vendor-prefixed keywords include colours of their own (-webkit-link,
// -moz-default-color), and no list of them is complete: none is allowed.
const VENDOR_IDENTIFIER = /(?<![\w-])-(?:webkit|moz|ms|o)-[\w-]+/i;

/** A string, quoted either way, escapes included. */
const STRING = /"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'/g;

const VAR_REFERENCE = /var\(\s*(--[\w-]*)/g;

const TAKE_WA_COLOURS = 'take every colour from a var(--wa-*) value';

/**
 * Classes of Studio's own preview and UI. They exist in no project, so a
 * rule on them does nothing there, and the preview scopes it to nothing.
 */
const STUDIO_CLASS = /\.(?:studio-|component-showcase|showcase-|theme-agent)/;

const NESTED_RULE =
  'a nested rule is not allowed; write each rule at the top level or inside @media, @supports or @container';

/** Why one declaration's value is refused, one sentence each. */
function declarationErrors(selector: string, declaration: string): string[] {
  const colon = declaration.indexOf(':');
  if (colon === -1) {
    return [`${selector}: "${declaration}" is not a declaration`];
  }
  const where = `${selector} ${declaration.slice(0, colon).trim()}`;
  // A colour name in a string is text, not a colour.
  const value = declaration.slice(colon + 1).replace(STRING, '""');
  const literal =
    HEX_COLOUR.exec(value)?.[0] ??
    value.match(IDENTIFIER)?.find((id) => NAMED_COLOURS.has(id.toLowerCase()));
  const mixed = COLOUR_FUNCTION.exec(value)?.[0].replace(/\s+/g, '');
  const errors: string[] = [];
  if (literal) {
    errors.push(
      `${where}: "${literal}" is a colour literal; ${TAKE_WA_COLOURS}`
    );
  }
  if (mixed) {
    errors.push(
      `${where}: "${mixed}" makes a colour of its own, which the contrast check does not see; ${TAKE_WA_COLOURS} as it is`
    );
  }
  const vendor = VENDOR_IDENTIFIER.exec(value)?.[0];
  if (vendor) {
    errors.push(
      `${where}: "${vendor}" is a vendor-prefixed value, which may be a colour; ${TAKE_WA_COLOURS}`
    );
  }
  for (const [, name] of value.matchAll(VAR_REFERENCE)) {
    if (!name.startsWith('--wa-')) {
      errors.push(
        `${where}: var(${name}) is not a --wa- value; ${TAKE_WA_COLOURS}`
      );
    }
  }
  return errors;
}

/** The declarations of one rule or keyframe block, comments as spaces. */
function declarations(body: string): string[] {
  // A comment reads as a space: removed outright it would join the words
  // around it (solid/**/red) into one the colour check does not know.
  return splitTopLevel(body.replace(/\/\*[\s\S]*?\*\//g, ' '), ';').map(
    (declaration) => declaration.replace(/\s+/g, ' ')
  );
}

/** Why the declarations of one rule or keyframe block are refused. */
function bodyErrors(selector: string, body: string): string[] {
  return declarations(body).flatMap((declaration) =>
    declarationErrors(selector, declaration)
  );
}

/** A property that starts an animation, vendor-prefixed too. */
const STARTS_ANIMATION = /^(?:-(?:webkit|moz|o)-)?animation(?:-name)?$/i;

const REDUCED_MOTION_FEATURE = '(prefers-reduced-motion:no-preference)';

/**
 * Whether `prelude` is an @media that holds only when the user has not asked
 * for reduced motion: every query in its list is a conjunction (no `not`,
 * no `or`) with (prefers-reduced-motion: no-preference) as one of its terms.
 */
function onlyWithoutReducedMotion(prelude: string): boolean {
  const media = /^@media\s+([\s\S]*)$/i.exec(prelude);
  if (!media) return false;
  const queries = splitTopLevel(media[1], ',');
  return (
    queries.length > 0 &&
    queries.every((query) => {
      const terms = splitTopLevel(query, ' ').map((term) =>
        term.replace(/\s+/g, '').toLowerCase()
      );
      return (
        !terms.includes('not') &&
        !terms.includes('or') &&
        terms.includes(REDUCED_MOTION_FEATURE)
      );
    })
  );
}

/** Why a rule outside the reduced-motion query may not start an animation. */
function motionErrors(selector: string, body: string): string[] {
  return declarations(body).flatMap((declaration) => {
    const colon = declaration.indexOf(':');
    if (colon === -1) return [];
    const property = declaration.slice(0, colon).trim();
    const value = declaration.slice(colon + 1).trim();
    if (!STARTS_ANIMATION.test(property) || /^none$/i.test(value)) return [];
    return [
      `${selector} ${property}: an animation must sit inside @media (prefers-reduced-motion: no-preference), so it stops for users who ask for reduced motion`,
    ];
  });
}

/**
 * Why one @keyframes block is refused. Its name is a plain identifier (the
 * preview prefixes it, so it cannot redefine one of Studio's own), it holds
 * only from, to and percentage blocks, and those are checked like rules.
 */
function keyframesErrors(prelude: string, body: string): string[] {
  const name = KEYFRAMES.exec(prelude)?.[1] ?? '';
  const where = `@keyframes ${name}`.trim();
  if (!KEYFRAMES_NAME.test(name) || NOT_A_KEYFRAMES_NAME.test(name)) {
    return [
      `${where}: a keyframes name is a plain identifier, such as skeleton-shimmer`,
    ];
  }
  const structure = validateCustomCSS(body);
  if (structure.length > 0) {
    return structure.map((error) => `${where}: ${error}`);
  }
  return splitStylesheet(body).flatMap((node) => {
    if (node.kind === 'comment') return [];
    if (node.kind !== 'rule') {
      return [`${where}: holds only from, to and percentage blocks`];
    }
    if (
      !splitTopLevel(node.selector, ',').every((s) => KEYFRAME_SELECTOR.test(s))
    ) {
      return [
        `${where} ${node.selector}: a keyframe block is from, to or a percentage`,
      ];
    }
    if (/[{}]/.test(node.body)) {
      return [`${where} ${node.selector}: ${NESTED_RULE}`];
    }
    return bodyErrors(`${where} ${node.selector}`, node.body);
  });
}

/**
 * Why `nodes` are refused. `withoutReducedMotion` is set inside an @media
 * that holds only when the user has not asked for reduced motion, where a
 * rule may start an animation.
 */
function nodeErrors(nodes: CssNode[], withoutReducedMotion = false): string[] {
  return nodes.flatMap((node) => {
    if (node.kind === 'at-rule' && KEYFRAMES.test(node.prelude)) {
      return keyframesErrors(node.prelude, node.body);
    }
    if (node.kind === 'at-rule') {
      return nodeErrors(
        splitStylesheet(node.body),
        withoutReducedMotion || onlyWithoutReducedMotion(node.prelude)
      );
    }
    if (node.kind !== 'rule') return [];
    if (STUDIO_CLASS.test(node.selector)) {
      return [
        `${node.selector}: names Studio's own class, in no project; select the page as body, html or :root, and components by Kigumi wrapper class or wa-* tag`,
      ];
    }
    if (/[{}]/.test(node.body)) {
      return [`${node.selector}: ${NESTED_RULE}`];
    }
    return [
      ...bodyErrors(node.selector, node.body),
      ...(withoutReducedMotion ? [] : motionErrors(node.selector, node.body)),
    ];
  });
}

/** A top-level node as written, comments included. */
function nodeText(node: CssNode): string {
  const comments = node.comments.join('\n');
  switch (node.kind) {
    case 'rule':
      return `${comments}\n${node.selector} {${node.body}}`;
    case 'at-rule':
      return `${comments}\n${node.prelude} {${node.body}}`;
    case 'statement':
      return `${comments}\n${node.text}`;
    case 'comment':
      return comments;
  }
}

/** One node's text with its whitespace collapsed, to compare kept rules. */
function nodeKey(node: CssNode): string {
  return nodeText(node).replace(/\s+/g, ' ').trim();
}

/**
 * Why the Theme Agent's custom CSS is refused, written for the model to
 * correct it; empty when it may be applied. It must parse, use no at-rule
 * beyond @media, @supports, @container and @keyframes (so no @import or
 * @font-face), start an animation only inside
 * @media (prefers-reduced-motion: no-preference),
 * load nothing (no url()), hold nothing script-like, stay under
 * `MAX_AGENT_CSS_LENGTH`, and take every colour from a var(--wa-*) value,
 * so the contrast check on the custom theme's values covers what it paints.
 * Rules carried over unchanged from `kept`, the custom CSS the answer was
 * written for, are the user's: they are not checked and do not count
 * toward the size.
 */
export function validateAgentCSS(css: string, kept = ''): string[] {
  const structure = validateCustomCSS(css);
  if (structure.length > 0) {
    return structure.map((error) => `customCSS: ${error}`);
  }
  const keptKeys = new Set(
    validateCustomCSS(kept).length > 0 ? [] : splitStylesheet(kept).map(nodeKey)
  );
  const nodes = splitStylesheet(css).filter(
    (node) => !keptKeys.has(nodeKey(node))
  );
  const text = nodes.map(nodeText).join('\n');
  if (text.length > MAX_AGENT_CSS_LENGTH) {
    return [
      `customCSS: ${text.length} characters, more than the ${MAX_AGENT_CSS_LENGTH} allowed`,
    ];
  }

  const errors: string[] = [];
  for (const [, name] of text.matchAll(/@([\w-]+)/g)) {
    if (!ALLOWED_AT_RULES.has(name.toLowerCase())) {
      errors.push(
        `customCSS: @${name} is not allowed; only @media, @supports, @container and @keyframes`
      );
    }
  }
  for (const [, name] of text.matchAll(RESOURCE)) {
    errors.push(`customCSS: ${name}() loads a resource and is not allowed`);
  }
  for (const pattern of SCRIPT_LIKE) {
    const match = pattern.exec(text);
    if (match) {
      errors.push(`customCSS: "${match[0]}" is script-like and is not allowed`);
    }
  }
  if (errors.length > 0) return [...new Set(errors)];
  return nodeErrors(nodes);
}
