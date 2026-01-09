import React from 'react';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { Card } from '@/components/ui/Card/Card';
import { Dialog } from '@/components/ui/Dialog/Dialog';
import '@/styles/theme.css';
import './App.css';

function App() {
  const [inputValue, setInputValue] = React.useState('');
  const dialogRef = React.useRef<any>(null);

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Kigumi CLI - Component Test</h1>
      <p>Testing Web Awesome components with brutalist theme and rudimentary palette</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginTop: '2rem' }}>

        {/* Button Component */}
        <section>
          <h2>Button Component</h2>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Button variant="default">Default Button</Button>
            <Button variant="primary">Primary Button</Button>
            <Button variant="success">Success Button</Button>
            <Button variant="danger">Danger Button</Button>
          </div>
        </section>

        {/* Input Component */}
        <section>
          <h2>Input Component</h2>
          <Input
            type="text"
            placeholder="Enter some text..."
            value={inputValue}
            onWaInput={(e: any) => setInputValue(e.target.value)}
            style={{ width: '300px' }}
          />
          <p>Input value: {inputValue}</p>
        </section>

        {/* Card Component */}
        <section>
          <h2>Card Component</h2>
          <Card style={{ maxWidth: '400px' }}>
            <h3 slot="header">Card Title</h3>
            <p>This is a card component with some content inside. Cards are useful for grouping related information.</p>
            <div slot="footer" style={{ display: 'flex', gap: '0.5rem' }}>
              <Button variant="primary" size="small">Action</Button>
              <Button variant="default" size="small">Cancel</Button>
            </div>
          </Card>
        </section>

        {/* Dialog Component */}
        <section>
          <h2>Dialog Component</h2>
          <Button variant="primary" onClick={() => dialogRef.current?.show()}>
            Open Dialog
          </Button>
          <Dialog
            ref={dialogRef}
            label="Example Dialog"
            onWaAfterHide={() => console.log('Dialog closed')}
          >
            <p>This is a dialog component. You can use it for modals, alerts, and confirmations.</p>
            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <Button variant="primary" onClick={() => dialogRef.current?.hide()}>
                Close
              </Button>
            </div>
          </Dialog>
        </section>

      </div>
    </div>
  );
}

export default App;
