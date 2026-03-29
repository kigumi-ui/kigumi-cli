import { useState } from 'react';
import { Button, Card, Input, Switch } from '@/components/ui';

export function LoginForm() {
  const [rememberMe, setRememberMe] = useState(false);

  return (
    <div className="wa-stack wa-justify-content-center wa-align-items-center">
      <Card style={{ width: '400px', marginTop: '40px' }}>
        <div className="wa-stack wa-gap-l">
          <div className="wa-stack wa-gap-2xs">
            <h2 className="wa-heading-m" style={{ margin: 0 }}>Sign in</h2>
            <p className="wa-body-s" style={{ margin: 0, color: 'var(--wa-color-neutral-60)' }}>
              Welcome back. Enter your credentials to continue.
            </p>
          </div>

          <form className="wa-stack wa-gap-m">
            <Input
              label="Email"
              type="email"
              name="email"
              placeholder="you@example.com"
              autocomplete="email"
            />

            <Input
              label="Password"
              type="password"
              name="password"
              placeholder="Enter your password"
              autocomplete="current-password"
              password-toggle
            />

            <div className="wa-cluster wa-justify-content-space-between wa-align-items-center">
              <Switch
                name="remember"
                checked={rememberMe}
                onChange={() => setRememberMe(!rememberMe)}
              >
                Remember me
              </Switch>

              <a href="#" className="wa-caption-s">
                Forgot password?
              </a>
            </div>

            <Button variant="brand" size="medium" type="submit">
              Sign In
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
