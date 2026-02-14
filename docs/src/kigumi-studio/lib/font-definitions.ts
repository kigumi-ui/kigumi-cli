export interface FontOption {
  name: string;
  value: string;
  category: 'System' | 'Sans-Serif' | 'Serif' | 'Monospace';
  bunnyUrl?: string;
}

export const FONT_CATEGORIES = [
  'System',
  'Sans-Serif',
  'Serif',
  'Monospace',
] as const;

export const AVAILABLE_FONTS: FontOption[] = [
  // System Defaults (3)
  {
    name: 'OS Default (sans-serif)',
    value: 'ui-sans-serif, system-ui, sans-serif',
    category: 'System',
  },
  {
    name: 'OS Default (serif)',
    value: 'ui-serif, serif',
    category: 'System',
  },
  {
    name: 'OS Default (monospace)',
    value: 'ui-monospace, monospace',
    category: 'System',
  },

  // Sans-Serif Fonts (11)
  {
    name: 'Inter',
    value: "'Inter', ui-sans-serif, system-ui, sans-serif",
    category: 'Sans-Serif',
    bunnyUrl:
      'https://fonts.bunny.net/css2?family=Inter:ital,wght@0,100..900;1,100..900&display=swap',
  },
  {
    name: 'Poppins',
    value: "'Poppins', ui-sans-serif, system-ui, sans-serif",
    category: 'Sans-Serif',
    bunnyUrl:
      'https://fonts.bunny.net/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap',
  },
  {
    name: 'Manrope',
    value: "'Manrope', ui-sans-serif, system-ui, sans-serif",
    category: 'Sans-Serif',
    bunnyUrl:
      'https://fonts.bunny.net/css2?family=Manrope:wght@200..800&display=swap',
  },
  {
    name: 'Plus Jakarta Sans',
    value: "'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif",
    category: 'Sans-Serif',
    bunnyUrl:
      'https://fonts.bunny.net/css2?family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&display=swap',
  },
  {
    name: 'Montserrat',
    value: "'Montserrat', ui-sans-serif, system-ui, sans-serif",
    category: 'Sans-Serif',
    bunnyUrl:
      'https://fonts.bunny.net/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap',
  },
  {
    name: 'Source Sans 3',
    value: "'Source Sans 3', ui-sans-serif, system-ui, sans-serif",
    category: 'Sans-Serif',
    bunnyUrl:
      'https://fonts.bunny.net/css2?family=Source+Sans+3:ital,wght@0,200..900;1,200..900&display=swap',
  },
  {
    name: 'DM Sans',
    value: "'DM Sans', ui-sans-serif, system-ui, sans-serif",
    category: 'Sans-Serif',
    bunnyUrl:
      'https://fonts.bunny.net/css2?family=DM+Sans:ital,wght@0,100..1000;1,100..1000&display=swap',
  },
  {
    name: 'Space Grotesk',
    value: "'Space Grotesk', ui-sans-serif, system-ui, sans-serif",
    category: 'Sans-Serif',
    bunnyUrl:
      'https://fonts.bunny.net/css2?family=Space+Grotesk:wght@300..700&display=swap',
  },
  {
    name: 'Figtree',
    value: "'Figtree', ui-sans-serif, system-ui, sans-serif",
    category: 'Sans-Serif',
    bunnyUrl:
      'https://fonts.bunny.net/css2?family=Figtree:ital,wght@0,300..900;1,300..900&display=swap',
  },
  {
    name: 'Mulish',
    value: "'Mulish', ui-sans-serif, system-ui, sans-serif",
    category: 'Sans-Serif',
    bunnyUrl:
      'https://fonts.bunny.net/css2?family=Mulish:ital,wght@0,200..1000;1,200..1000&display=swap',
  },
  {
    name: 'Nunito',
    value: "'Nunito', ui-sans-serif, system-ui, sans-serif",
    category: 'Sans-Serif',
    bunnyUrl:
      'https://fonts.bunny.net/css2?family=Nunito:ital,wght@0,200..1000;1,200..1000&display=swap',
  },

  // Serif Fonts (8)
  {
    name: 'Playfair Display',
    value: "'Playfair Display', ui-serif, serif",
    category: 'Serif',
    bunnyUrl:
      'https://fonts.bunny.net/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap',
  },
  {
    name: 'Playfair',
    value: "'Playfair', ui-serif, serif",
    category: 'Serif',
    bunnyUrl:
      'https://fonts.bunny.net/css2?family=Playfair:ital,wght@0,300..900;1,300..900&display=swap',
  },
  {
    name: 'Lora',
    value: "'Lora', ui-serif, serif",
    category: 'Serif',
    bunnyUrl:
      'https://fonts.bunny.net/css2?family=Lora:ital,wght@0,400..700;1,400..700&display=swap',
  },
  {
    name: 'Merriweather',
    value: "'Merriweather', ui-serif, serif",
    category: 'Serif',
    bunnyUrl:
      'https://fonts.bunny.net/css2?family=Merriweather:ital,wght@0,300;0,400;0,700;0,900;1,300;1,400;1,700;1,900&display=swap',
  },
  {
    name: 'Crimson Pro',
    value: "'Crimson Pro', ui-serif, serif",
    category: 'Serif',
    bunnyUrl:
      'https://fonts.bunny.net/css2?family=Crimson+Pro:ital,wght@0,200..900;1,200..900&display=swap',
  },
  {
    name: 'Fraunces',
    value: "'Fraunces', ui-serif, serif",
    category: 'Serif',
    bunnyUrl:
      'https://fonts.bunny.net/css2?family=Fraunces:ital,wght@0,100..900;1,100..900&display=swap',
  },
  {
    name: 'Roboto Serif',
    value: "'Roboto Serif', ui-serif, serif",
    category: 'Serif',
    bunnyUrl:
      'https://fonts.bunny.net/css2?family=Roboto+Serif:ital,wght@0,100..900;1,100..900&display=swap',
  },
  {
    name: 'Aleo',
    value: "'Aleo', ui-serif, serif",
    category: 'Serif',
    bunnyUrl:
      'https://fonts.bunny.net/css2?family=Aleo:ital,wght@0,100..900;1,100..900&display=swap',
  },

  // Monospace Fonts (4)
  {
    name: 'JetBrains Mono',
    value: "'JetBrains Mono', ui-monospace, monospace",
    category: 'Monospace',
    bunnyUrl:
      'https://fonts.bunny.net/css2?family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&display=swap',
  },
  {
    name: 'Roboto Mono',
    value: "'Roboto Mono', ui-monospace, monospace",
    category: 'Monospace',
    bunnyUrl:
      'https://fonts.bunny.net/css2?family=Roboto+Mono:ital,wght@0,100..700;1,100..700&display=swap',
  },
  {
    name: 'Space Mono',
    value: "'Space Mono', ui-monospace, monospace",
    category: 'Monospace',
    bunnyUrl:
      'https://fonts.bunny.net/css2?family=Space+Mono:ital,wght@0,400;0,700;1,400;1,700&display=swap',
  },
  {
    name: 'Geist Mono',
    value: "'Geist Mono', ui-monospace, monospace",
    category: 'Monospace',
    bunnyUrl:
      'https://fonts.bunny.net/css2?family=Geist+Mono:wght@100..900&display=swap',
  },
];

export const FONT_WEIGHTS = [
  { label: '100', value: '100' },
  { label: '200', value: '200' },
  { label: '300', value: '300' },
  { label: '400', value: '400' },
  { label: '500', value: '500' },
  { label: '600', value: '600' },
  { label: '700', value: '700' },
  { label: '800', value: '800' },
  { label: '900', value: '900' },
];
