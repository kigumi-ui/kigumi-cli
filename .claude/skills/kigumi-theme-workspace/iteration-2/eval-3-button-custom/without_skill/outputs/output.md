# How to Customize a Specific Button Component in Kigumi

Kigumi generates a `Button` wrapper around the Web Awesome `<wa-button>` web component. Because the button's internals live in Shadow DOM, you cannot style them with regular CSS selectors. There are two official styling surfaces:

- **CSS Custom Properties** (`--wa-*` tokens) -- change values globally or scoped to a selector
- **CSS Parts** (`::part()`) -- target named shadow parts exposed by the component

---

## 1. Understand the generated files

When you run `kigumi add Button`, two files are generated:

- `src/components/ui/Button/Button.tsx` (or `.vue`) -- the wrapper component
- `src/components/ui/Button/Button.css` -- the placeholder for your customizations

The `.Button` class is applied to every `<wa-button>` element automatically. The CSS Parts available are:

| Part      | What it targets            |
| --------- | -------------------------- |
| `base`    | Root wrapper element       |
| `label`   | The button text label      |
| `start`   | Wrapper for the start slot |
| `end`     | Wrapper for the end slot   |
| `caret`   | The dropdown caret icon    |
| `spinner` | The loading spinner        |

---

## 2. Option A -- Customize all Button instances (global tokens)

Edit `src/styles/theme.css`. This file is imported into the `theme` cascade layer, which has higher priority than Web Awesome base styles, so your values always win.

```css
/* src/styles/theme.css */
:root {
  /* Change the brand color used by the filled/accent appearance */
  --wa-color-brand-60: #7c3aed;
}
```

This affects every `<Button>` that uses the `brand` variant across your entire app.

---

## 3. Option B -- Customize one specific Button instance

This is the recommended approach when you only want to change a single button. Edit `src/components/ui/Button/Button.css` and use the `.Button` class combined with `::part()` to scope your styles to that component.

### Change the background color

The `base` part is the root rendered element. Target it with `::part(base)`:

```css
/* src/components/ui/Button/Button.css */
.Button::part(base) {
  background-color: #7c3aed;
  border-color: #7c3aed;
  color: #ffffff;
}
```

### Add uppercase text

Text transform lives on the `label` part:

```css
.Button::part(label) {
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
```

### Combined example

```css
/* src/components/ui/Button/Button.css */
.Button {
  /* Host-level styles (e.g. display, margin) go here */
}

.Button::part(base) {
  background-color: #7c3aed;
  border-color: #7c3aed;
  color: #ffffff;
}

.Button::part(label) {
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
```

Then in your component (React example):

```tsx
import { Button } from '@/components/ui/Button/Button';

export function MyPage() {
  return (
    <Button variant="brand" appearance="filled">
      Submit
    </Button>
  );
}
```

No extra `className` is needed -- all `Button` instances automatically receive the `.Button` class, so your `Button.css` rules apply everywhere.

---

## 4. Scope styles to a single usage with a custom class

If you have multiple Button instances but only want to change one of them, pass a `className` (React) or `class` (Vue):

**React:**

```tsx
<Button className="btn-primary-custom" variant="brand" appearance="filled">
  Submit
</Button>
```

**Vue:**

```html
<button class="btn-primary-custom" variant="brand" appearance="filled">
  Submit
</button>
```

Then add the scoped rule in `Button.css` (or a local stylesheet):

```css
.btn-primary-custom::part(base) {
  background-color: #7c3aed;
  border-color: #7c3aed;
  color: #ffffff;
}

.btn-primary-custom::part(label) {
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
```

---

## 5. What NOT to do

- Do not use `!important` -- the cascade layer system in `layers.css` handles specificity correctly without it.
- Do not try to target shadow DOM internals directly (e.g. `.wa-button__label`) -- those are private and not part of the public API.
- Do not inline styles on the `<wa-button>` element to override shadow parts -- `::part()` in CSS is the only way to reach them.

---

## Summary

| Goal                                  | Where to put it                                                   |
| ------------------------------------- | ----------------------------------------------------------------- |
| Change all buttons globally           | `src/styles/theme.css` via `--wa-*` tokens at `:root`             |
| Change all Button component instances | `src/components/ui/Button/Button.css` via `.Button::part()`       |
| Change one specific button            | Add a custom `className`/`class`, target `::part()` on that class |
