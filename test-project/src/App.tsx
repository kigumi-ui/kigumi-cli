import React, { useState } from 'react';
import { Button, Input, Card } from '@/components/ui';
import '@/lib/webawesome';

export function App() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = () => {
    alert(`Submitted!\nName: ${name}\nEmail: ${email}`);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Kigumi CLI Test App</h1>
      <p>Testing Button, Input, and Card components from Web Awesome</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginTop: '2rem' }}>
        {/* Card with Form */}
        <Card appearance="outlined">
          <div slot="header">
            <h2 style={{ margin: 0 }}>User Information</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Input
              label="Your Name"
              placeholder="Enter your name"
              value={name}
              onInput={(e: any) => setName(e.target.value)}
              with-clear
            />

            <Input
              type="email"
              label="Email Address"
              placeholder="your@email.com"
              value={email}
              onInput={(e: any) => setEmail(e.target.value)}
              with-clear
            />
          </div>

          <div slot="footer" style={{ display: 'flex', gap: '1rem' }}>
            <Button variant="brand" appearance="filled" onClick={handleSubmit}>
              Submit
            </Button>
            <Button
              variant="neutral"
              appearance="outlined"
              onClick={() => {
                setName('');
                setEmail('');
              }}
            >
              Clear
            </Button>
          </div>
        </Card>

        {/* Button Variants Demo */}
        <Card appearance="filled-outlined">
          <div slot="header">
            <h3 style={{ margin: 0 }}>Button Variants</h3>
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Button variant="neutral" appearance="filled">
              Neutral
            </Button>
            <Button variant="brand" appearance="filled">
              Brand
            </Button>
            <Button variant="success" appearance="filled">
              Success
            </Button>
            <Button variant="warning" appearance="filled">
              Warning
            </Button>
            <Button variant="danger" appearance="filled">
              Danger
            </Button>
          </div>
        </Card>

        {/* Button Appearances Demo */}
        <Card appearance="accent">
          <div slot="header">
            <h3 style={{ margin: 0 }}>Button Appearances</h3>
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Button variant="brand" appearance="accent">
              Accent
            </Button>
            <Button variant="brand" appearance="filled-outlined">
              Filled-Outlined
            </Button>
            <Button variant="brand" appearance="filled">
              Filled
            </Button>
            <Button variant="brand" appearance="outlined">
              Outlined
            </Button>
            <Button variant="brand" appearance="plain">
              Plain
            </Button>
          </div>
        </Card>

        {/* Input Variants Demo */}
        <Card>
          <div slot="header">
            <h3 style={{ margin: 0 }}>Input Variants</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Input placeholder="Default (outlined)" />
            <Input appearance="filled" placeholder="Filled" />
            <Input appearance="filled-outlined" placeholder="Filled-Outlined" />
            <Input placeholder="With Clear Button" with-clear />
            <Input type="password" placeholder="Password with toggle" password-toggle />
          </div>
        </Card>
      </div>
    </div>
  );
}
