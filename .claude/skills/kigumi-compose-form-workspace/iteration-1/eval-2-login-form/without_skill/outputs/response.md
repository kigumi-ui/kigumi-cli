# Login Form

## Install required components

```bash
npx kigumi add Input Button Switch Icon Card
```

## Component code

```tsx
// LoginForm.tsx
import { Button, Card, Icon, Input, Switch } from '@/components/ui';

export function LoginForm() {
  return (
    <div className="wa-stack wa-justify-content-center wa-align-items-center">
      <Card style={{ width: '400px', marginTop: '40px' }}>
        <div className="wa-stack wa-gap-l">
          <div className="wa-stack wa-gap-2xs" style={{ textAlign: 'center' }}>
            <h2 className="wa-heading-m">Sign in</h2>
            <p
              className="wa-body-s"
              style={{ color: 'var(--wa-color-neutral-60)' }}
            >
              Enter your credentials to access your account
            </p>
          </div>

          <form className="wa-stack wa-gap-m">
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              required
              autocomplete="email"
            >
              <Icon slot="prefix" name="envelope" />
            </Input>

            <Input
              label="Password"
              type="password"
              placeholder="Enter your password"
              password-toggle
              required
              autocomplete="current-password"
            >
              <Icon slot="prefix" name="lock" />
            </Input>

            <div className="wa-cluster wa-justify-content-space-between wa-align-items-center">
              <Switch size="small" name="remember">
                Remember me
              </Switch>

              <a
                href="#"
                className="wa-caption-s"
                style={{
                  color: 'var(--wa-color-brand-60)',
                  textDecoration: 'none',
                }}
              >
                Forgot password?
              </a>
            </div>

            <Button
              variant="brand"
              size="medium"
              type="submit"
              style={{ width: '100%' }}
            >
              Sign in
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
```

## Styling (optional)

```css
/* LoginForm.css */

/*
  No custom CSS needed. The form uses:
  - wa-stack / wa-cluster / wa-gap-* utility classes for layout
  - wa-heading-m / wa-body-s / wa-caption-s for typography
  - CSS custom properties for color tokens
  All spacing and alignment is handled by Web Awesome's built-in utility classes.
*/
```

## Features

- **Email field** with `type="email"`, envelope prefix icon, and `autocomplete="email"` for browser autofill.
- **Password field** with `type="password"`, lock prefix icon, and the built-in `password-toggle` prop that adds a show/hide visibility button.
- **Remember me** toggle using the `Switch` component at small size with a text label as its child content.
- **Forgot password?** link styled with brand color, placed on the same row as the switch using `wa-cluster` with `wa-justify-content-space-between`.
- Both fields are marked `required` for native form validation.
- The form uses `autocomplete` attributes for proper browser credential management.
- Layout uses `Card` as the container, `wa-stack` for vertical flow, and `wa-gap-*` tokens for consistent spacing.
