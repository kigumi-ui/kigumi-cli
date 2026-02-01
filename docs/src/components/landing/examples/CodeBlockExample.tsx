import { Card } from '@/components/ui/Card/Card';
import { CopyButton } from '@/components/ui/CopyButton/CopyButton';

export function CodeBlockExample() {
  const codeContent = `<div class="fellowship">
  <p class="ring-bearer">
    Frodo carries the <span id="one-ring">One Ring</span>
  </p>
  <ul class="companions">
    <li data-race="wizard">Gandalf the Grey</li>
    <li data-race="elf">Legolas</li>
    <li data-race="dwarf">Gimli</li>
  </ul>
</div>`;

  return (
    <Card
      appearance="outlined"
      style={
        {
          '--spacing': '0',
          overflow: 'hidden',
          position: 'relative',
        } as React.CSSProperties
      }
    >
      <CopyButton
        value={codeContent}
        className="copy-button wa-dark"
        style={{
          position: 'absolute',
          top: 'var(--wa-spacing-xs)',
          right: 'var(--wa-spacing-xs)',
          zIndex: 10,
        }}
      />
      <pre
        className="code-block"
        style={{
          margin: 0,
          padding: 'var(--wa-spacing-m)',
          backgroundColor: 'var(--wa-color-neutral-10)',
          color: 'var(--wa-color-neutral-95)',
          fontSize: '0.875rem',
          lineHeight: '1.5',
          overflow: 'auto',
        }}
      >
        <code>
          <span className="code-token code-tag">&lt;div</span>{' '}
          <span className="code-token code-attr-name">class</span>
          <span className="code-token code-punctuation">=</span>
          <span className="code-token code-attr-value">"fellowship"</span>
          <span className="code-token code-tag">&gt;</span>
          {'\n  '}
          <span className="code-token code-tag">&lt;p</span>{' '}
          <span className="code-token code-attr-name">class</span>
          <span className="code-token code-punctuation">=</span>
          <span className="code-token code-attr-value">"ring-bearer"</span>
          <span className="code-token code-tag">&gt;</span>
          {'\n    '}
          Frodo carries the{' '}
          <span className="code-token code-tag">&lt;span</span>{' '}
          <span className="code-token code-attr-name">id</span>
          <span className="code-token code-punctuation">=</span>
          <span className="code-token code-attr-value">"one-ring"</span>
          <span className="code-token code-tag">&gt;</span>
          One Ring
          <span className="code-token code-tag">&lt;/span&gt;</span>
          {'\n  '}
          <span className="code-token code-tag">&lt;/p&gt;</span>
          {'\n  '}
          <span className="code-token code-tag">&lt;ul</span>{' '}
          <span className="code-token code-attr-name">class</span>
          <span className="code-token code-punctuation">=</span>
          <span className="code-token code-attr-value">"companions"</span>
          <span className="code-token code-tag">&gt;</span>
          {'\n    '}
          <span className="code-token code-tag">&lt;li</span>{' '}
          <span className="code-token code-attr-name">data-race</span>
          <span className="code-token code-punctuation">=</span>
          <span className="code-token code-attr-value">"wizard"</span>
          <span className="code-token code-tag">&gt;</span>
          Gandalf the Grey
          <span className="code-token code-tag">&lt;/li&gt;</span>
          {'\n    '}
          <span className="code-token code-tag">&lt;li</span>{' '}
          <span className="code-token code-attr-name">data-race</span>
          <span className="code-token code-punctuation">=</span>
          <span className="code-token code-attr-value">"elf"</span>
          <span className="code-token code-tag">&gt;</span>
          Legolas
          <span className="code-token code-tag">&lt;/li&gt;</span>
          {'\n    '}
          <span className="code-token code-tag">&lt;li</span>{' '}
          <span className="code-token code-attr-name">data-race</span>
          <span className="code-token code-punctuation">=</span>
          <span className="code-token code-attr-value">"dwarf"</span>
          <span className="code-token code-tag">&gt;</span>
          Gimli
          <span className="code-token code-tag">&lt;/li&gt;</span>
          {'\n  '}
          <span className="code-token code-tag">&lt;/ul&gt;</span>
          {'\n'}
          <span className="code-token code-tag">&lt;/div&gt;</span>
        </code>
      </pre>
    </Card>
  );
}
