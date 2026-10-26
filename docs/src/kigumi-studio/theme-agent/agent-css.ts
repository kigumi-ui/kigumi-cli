import {
  splitStylesheet,
  splitTopLevel,
  validateCustomCSS,
  type CssNode,
} from '../lib/custom-css';

// Shared by the browser and the trigger.dev task (docs/trigger), like
// proposal.ts. Custom CSS the Theme Agent proposes is accepted only from a
// checked subset (ADR 0009); custom CSS the user writes by hand is not
// restricted. Loosening a rule here loosens what model output can do to the
// page.

/** The most custom CSS one proposal may carry, in characters. */
export const MAX_AGENT_CSS_LENGTH = 6000;

/** The only at-rules allowed: they hold rules, which are checked too. */
const ALLOWED_AT_RULES = new Set(['media', 'supports', 'container']);

/** Functions that load something from outside the page. */
const RESOURCE =
  /(?<![\w-])(url|src|image-set|-webkit-image-set|image|cross-fade|element)\s*\(/gi;

/** What reads as script or markup, or hides a name behind an escape. */
const SCRIPT_LIKE = [
  /expression\s*\(/i,
  /(?:java|vb)script\s*:/i,
  /-moz-binding/i,
  /(?<![\w-])behavior\s*:/i,
  /<\/?[a-z!]/i,
  /\\/,
];

/** Functions that make a colour of their own. */
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

const VAR_REFERENCE = /var\(\s*(--[\w-]*)/g;

const TAKE_WA_COLOURS = 'take every colour from a var(--wa-*) value';

/** Why one declaration's value is refused, one sentence each. */
function declarationErrors(selector: string, declaration: string): string[] {
  const colon = declaration.indexOf(':');
  if (colon === -1) {
    return [`${selector}: "${declaration}" is not a declaration`];
  }
  const where = `${selector} ${declaration.slice(0, colon).trim()}`;
  // A colour name in a string is text, not a colour.
  const value = declaration.slice(colon + 1).replace(/(["'])[^"']*\1/g, '""');
  const literal =
    HEX_COLOUR.exec(value)?.[0] ??
    COLOUR_FUNCTION.exec(value)?.[0].replace(/\s+/g, '') ??
    value.match(IDENTIFIER)?.find((id) => NAMED_COLOURS.has(id.toLowerCase()));
  const errors: string[] = [];
  if (literal) {
    errors.push(
      `${where}: "${literal}" is a colour literal; ${TAKE_WA_COLOURS}`
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

function nodeErrors(nodes: CssNode[]): string[] {
  return nodes.flatMap((node) => {
    if (node.kind === 'at-rule') {
      return nodeErrors(splitStylesheet(node.body));
    }
    if (node.kind !== 'rule') return [];
    if (/[{}]/.test(node.body)) {
      return [
        `${node.selector}: a nested rule is not allowed; write each rule at the top level or inside @media, @supports or @container`,
      ];
    }
    return splitTopLevel(node.body.replace(/\/\*[\s\S]*?\*\//g, ''), ';')
      .map((declaration) => declaration.replace(/\s+/g, ' '))
      .flatMap((declaration) => declarationErrors(node.selector, declaration));
  });
}

/**
 * Why the Theme Agent's custom CSS is refused, written for the model to
 * correct it; empty when it may be applied. It must parse, use no at-rule
 * beyond @media, @supports and @container (so no @import or @font-face),
 * load nothing (no url()), hold nothing script-like, stay under
 * `MAX_AGENT_CSS_LENGTH`, and take every colour from a var(--wa-*) value,
 * so the contrast check on the custom theme's values covers what it paints.
 */
export function validateAgentCSS(css: string): string[] {
  if (css.length > MAX_AGENT_CSS_LENGTH) {
    return [
      `customCSS: ${css.length} characters, more than the ${MAX_AGENT_CSS_LENGTH} allowed`,
    ];
  }
  const structure = validateCustomCSS(css);
  if (structure.length > 0) {
    return structure.map((error) => `customCSS: ${error}`);
  }

  const errors: string[] = [];
  for (const [, name] of css.matchAll(/@([\w-]+)/g)) {
    if (!ALLOWED_AT_RULES.has(name.toLowerCase())) {
      errors.push(
        `customCSS: @${name} is not allowed; only @media, @supports and @container`
      );
    }
  }
  for (const [, name] of css.matchAll(RESOURCE)) {
    errors.push(`customCSS: ${name}() loads a resource and is not allowed`);
  }
  for (const pattern of SCRIPT_LIKE) {
    const match = pattern.exec(css);
    if (match) {
      errors.push(`customCSS: "${match[0]}" is script-like and is not allowed`);
    }
  }
  if (errors.length > 0) return [...new Set(errors)];
  return nodeErrors(splitStylesheet(css));
}
