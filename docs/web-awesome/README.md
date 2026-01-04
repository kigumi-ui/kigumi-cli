# Web Awesome Documentation

This directory contains the Web Awesome component documentation in Markdown format.

## Required Documentation Files

Please add the following documentation from https://awesome.me/docs:

### Component Documentation

For each component, we need:

1. **Component API Reference** - Props, attributes, methods, events, CSS custom properties
2. **Component Examples** - Usage examples and code snippets
3. **Component Category** - Which category it belongs to (Form, Layout, Navigation, etc.)

### File Structure

Ideally, organize files like this:

```
docs/web-awesome/
├── components/
│   ├── button.md
│   ├── input.md
│   ├── card.md
│   ├── dialog.md
│   └── ... (all other components)
├── theming.md           # CSS custom properties and theming guide
├── getting-started.md   # Installation and setup
└── component-list.md    # Complete list of all available components
```

## What We'll Use This For

The CLI will parse these markdown files to:

1. **Build the Component Registry** - Extract component metadata, props, and descriptions
2. **Generate TypeScript Types** - Create accurate type definitions from prop documentation
3. **Auto-complete Documentation** - Add TSDoc comments to generated components
4. **Validate Components** - Ensure generated code matches the official API

## URLs Needed

If you have the complete markdown documentation, please provide URLs or files for:

- Component list/overview page
- Individual component documentation pages
- Theming/CSS variables documentation
- Component categories/grouping

## Alternative: Direct Copy

If you have access to the Web Awesome docs repository or can export the documentation, simply copy all markdown files into this directory.
