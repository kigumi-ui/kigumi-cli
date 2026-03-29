// Install missing components:
// npx kigumi add input switch button callout

import { useState, type FormEvent } from 'react';
import { Button, Callout, Input, Switch } from '@/components/ui';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, remember }),
      });
      if (!res.ok) throw new Error('Invalid email or password');
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      className="wa-stack wa-gap-l"
      style={{ maxWidth: '400px', margin: '0 auto' }}
      onSubmit={handleSubmit}
    >
      <h1 style={{ textAlign: 'center' }}>Sign In</h1>

      {error && <Callout variant="danger">{error}</Callout>}

      <Input
        label="Email"
        name="email"
        type="email"
        required
        onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
      />

      <Input
        label="Password"
        name="password"
        type="password"
        required
        password-toggle
        onInput={(e) => setPassword((e.target as HTMLInputElement).value)}
      />

      <div className="wa-cluster wa-justify-content-space-between wa-align-items-center">
        <Switch
          onChange={(e) => setRemember((e.target as HTMLInputElement).checked)}
        >
          Remember me
        </Switch>
        <a href="/forgot-password" style={{ fontSize: 'var(--wa-font-size-s)' }}>
          Forgot password?
        </a>
      </div>

      <Button variant="brand" type="submit" loading={loading} style={{ width: '100%' }}>
        Sign In
      </Button>
    </form>
  );
}
