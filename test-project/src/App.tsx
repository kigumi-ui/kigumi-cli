import React from 'react';
import { Button, Input, Card, Dialog } from '@/components/ui';
import type { DialogRef } from '@/components/ui/Dialog/Dialog';
import '@/lib/webawesome';

export function App() {
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const dialogRef = React.useRef<DialogRef>(null);
  const [controlledOpen, setControlledOpen] = React.useState(false);

  const handleSubmit = () => {
    alert(`Submitted!\nName: ${name}\nEmail: ${email}`);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Kigumi CLI Test App</h1>
      <p>Testing Web Awesome React Wrappers with full functionality</p>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '2rem',
          marginTop: '2rem',
        }}
      >
        {/* Card with Form */}
        <Card appearance="outlined">
          <div slot="header">
            <h2 style={{ margin: 0 }}>User Information</h2>
          </div>

          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
          >
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

        {/* Dialog Examples */}
        <Card appearance="outlined">
          <div slot="header">
            <h3 style={{ margin: 0 }}>Dialog Component</h3>
          </div>

          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
          >
            {/* Example 1: Using ref methods */}
            <div>
              <h4>Example 1: Using ref.show()</h4>
              <Button variant="brand" onClick={() => dialogRef.current?.show()}>
                Open Dialog (Ref Method)
              </Button>
            </div>

            {/* Example 2: Using controlled open prop */}
            <div>
              <h4>Example 2: Using open prop</h4>
              <Button variant="success" onClick={() => setControlledOpen(true)}>
                Open Controlled Dialog
              </Button>
            </div>
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

          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
          >
            <Input placeholder="Default (outlined)" />
            <Input appearance="filled" placeholder="Filled" />
            <Input appearance="filled-outlined" placeholder="Filled-Outlined" />
            <Input placeholder="With Clear Button" with-clear />
            <Input
              type="password"
              placeholder="Password with toggle"
              password-toggle
            />
          </div>
        </Card>
      </div>

      {/* Dialog 1: Using ref methods with data-dialog attribute */}
      <Dialog ref={dialogRef} label="Example Dialog (Ref Method)">
        <p>
          This dialog is opened using <code>dialogRef.current?.show()</code>
        </p>
        <p>
          The Close button uses <code>data-dialog="close"</code> to close
          automatically.
        </p>
        <p>The Confirm button closes via the ref method.</p>
        <div
          slot="footer"
          style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}
        >
          <Button variant="neutral" appearance="outlined" data-dialog="close">
            Close (data-dialog)
          </Button>
          <Button variant="brand" onClick={() => dialogRef.current?.hide()}>
            Confirm (ref.hide())
          </Button>
        </div>
      </Dialog>

      {/* Dialog 2: Using controlled open prop */}
      <Dialog
        open={controlledOpen}
        label="Controlled Dialog"
        onHide={() => setControlledOpen(false)}
      >
        <p>
          This dialog is controlled via the <code>open</code> prop.
        </p>
        <p>
          It closes by setting the state to false via <code>onHide</code> event.
        </p>
        <div
          slot="footer"
          style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}
        >
          <Button variant="neutral" appearance="outlined" data-dialog="close">
            Close
          </Button>
          <Button variant="brand" data-dialog="close">
            Confirm
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
