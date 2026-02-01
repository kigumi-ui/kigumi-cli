import {
  Card,
  Comparison,
  CopyButton,
  Divider,
  Icon,
  Input,
  Scroller,
  Button,
} from '@/components/ui';

export function Hero() {
  return (
    <div slot="main-header" className="wa-grid wa-align-items-center">
      <div
        className="wa-flank:end"
        style={{ '--flank-size': '45%' } as React.CSSProperties}
      >
        <div className="wa-stack wa-gap-3xl">
          <h2 className="wa-heading-4xl">
            Make Your Design System’s Foundation <br />
            Truly Cross-Platform
          </h2>
          <div className="wa-cluster wa-gap-xs">
            <Button>Get Started</Button>
            <Button appearance="plain">
              Find out more <Icon name="arrow-right" slot="end" />
            </Button>
          </div>
        </div>
        <Comparison position={45} className="wa-dark">
          <Scroller slot="before" without-shadow orientation="vertical">
            <Card style={{ maxWidth: '45ch', margin: '0 auto' }}>
              <div className="wa-stack wa-justify-content-center wa-gap-xl wa-align-items-center">
                <h2 className="wa-heading-l">Login</h2>
                <Input label="Email" type="email" />
                <Input label="Password" type="password" />
                <a href="#">Having trouble signing in?</a>
                <Button>Sign in</Button>
                <Divider />
                <p>Or sign in with:</p>
                <div
                  className="wa-grid"
                  style={{ '--min-column-size': '12ch' } as React.CSSProperties}
                >
                  <Button appearance="outlined">
                    <Icon slot="start" name="google" family="brands" />
                    Google
                  </Button>
                  <Button appearance="outlined">
                    <Icon slot="start" name="apple" family="brands" />
                    Apple ID
                  </Button>
                  <Button appearance="outlined">
                    <Icon slot="start" name="facebook" family="brands" />
                    Facebook
                  </Button>
                </div>
                <p>
                  Don't have an account? <a href="#">Create one</a>
                </p>
              </div>
            </Card>
          </Scroller>
          <Scroller slot="after" without-shadow orientation="vertical">
            <CopyButton
              // value={codeContent}
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
                <span className="code-token code-attr-value">
                  "ring-bearer"
                </span>
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
                <span className="code-token code-tag">&gt;</span>{' '}
                <span className="code-token code-tag">&lt;li</span>{' '}
                <span className="code-token code-attr-name">data-race</span>
                <span className="code-token code-punctuation">=</span>
                <span className="code-token code-attr-value">"elf"</span>
                <span className="code-token code-tag">&gt;</span>{' '}
                <span className="code-token code-tag">&lt;li</span>{' '}
                <span className="code-token code-attr-name">data-race</span>
                <span className="code-token code-punctuation">=</span>
                <span className="code-token code-attr-value">"elf"</span>
                <span className="code-token code-tag">&gt;</span>{' '}
                <span className="code-token code-tag">&lt;li</span>{' '}
                <span className="code-token code-attr-name">data-race</span>
                <span className="code-token code-punctuation">=</span>
                <span className="code-token code-attr-value">"elf"</span>
                <span className="code-token code-tag">&gt;</span>{' '}
                <span className="code-token code-tag">&lt;li</span>{' '}
                <span className="code-token code-attr-name">data-race</span>
                <span className="code-token code-punctuation">=</span>
                <span className="code-token code-attr-value">"elf"</span>
                <span className="code-token code-tag">&gt;</span>{' '}
                <span className="code-token code-tag">&lt;li</span>{' '}
                <span className="code-token code-attr-name">data-race</span>
                <span className="code-token code-punctuation">=</span>
                <span className="code-token code-attr-value">"elf"</span>
                <span className="code-token code-tag">&gt;</span>{' '}
                <span className="code-token code-tag">&lt;li</span>{' '}
                <span className="code-token code-attr-name">data-race</span>
                <span className="code-token code-punctuation">=</span>
                <span className="code-token code-attr-value">"elf"</span>
                <span className="code-token code-tag">&gt;</span>{' '}
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
                {'\n  '} <span className="code-token code-tag">&lt;li</span>{' '}
                <span className="code-token code-attr-name">data-race</span>
                <span className="code-token code-punctuation">=</span>
                <span className="code-token code-attr-value">"dwarf"</span>
                <span className="code-token code-tag">&gt;</span>
                Gimli
                <span className="code-token code-tag">&lt;/li&gt;</span>
                {'\n  '} <span className="code-token code-tag">&lt;li</span>{' '}
                <span className="code-token code-attr-name">data-race</span>
                <span className="code-token code-punctuation">=</span>
                <span className="code-token code-attr-value">"dwarf"</span>
                <span className="code-token code-tag">&gt;</span>
                Gimli
                <span className="code-token code-tag">&lt;/li&gt;</span>
                {'\n  '} <span className="code-token code-tag">&lt;li</span>{' '}
                <span className="code-token code-attr-name">data-race</span>
                <span className="code-token code-punctuation">=</span>
                <span className="code-token code-attr-value">"dwarf"</span>
                <span className="code-token code-tag">&gt;</span>
                Gimli
                <span className="code-token code-tag">&lt;/li&gt;</span>
                {'\n  '} <span className="code-token code-tag">&lt;li</span>{' '}
                <span className="code-token code-attr-name">data-race</span>
                <span className="code-token code-punctuation">=</span>
                <span className="code-token code-attr-value">"dwarf"</span>
                <span className="code-token code-tag">&gt;</span>
                Gimli
                <span className="code-token code-tag">&lt;/li&gt;</span>
                {'\n  '} <span className="code-token code-tag">&lt;li</span>{' '}
                <span className="code-token code-attr-name">data-race</span>
                <span className="code-token code-punctuation">=</span>
                <span className="code-token code-attr-value">"dwarf"</span>
                <span className="code-token code-tag">&gt;</span>
                Gimli
                <span className="code-token code-tag">&lt;/li&gt;</span>
                {'\n  '} <span className="code-token code-tag">&lt;li</span>{' '}
                <span className="code-token code-attr-name">data-race</span>
                <span className="code-token code-punctuation">=</span>
                <span className="code-token code-attr-value">"dwarf"</span>
                <span className="code-token code-tag">&gt;</span>
                Gimli
                <span className="code-token code-tag">&lt;/li&gt;</span>
                {'\n  '} <span className="code-token code-tag">&lt;li</span>{' '}
                <span className="code-token code-attr-name">data-race</span>
                <span className="code-token code-punctuation">=</span>
                <span className="code-token code-attr-value">"dwarf"</span>
                <span className="code-token code-tag">&gt;</span>
                Gimli
                <span className="code-token code-tag">&lt;/li&gt;</span>
                {'\n  '} <span className="code-token code-tag">&lt;li</span>{' '}
                <span className="code-token code-attr-name">data-race</span>
                <span className="code-token code-punctuation">=</span>
                <span className="code-token code-attr-value">"dwarf"</span>
                <span className="code-token code-tag">&gt;</span>
                Gimli
                <span className="code-token code-tag">&lt;/li&gt;</span>
                {'\n  '} <span className="code-token code-tag">&lt;li</span>{' '}
                <span className="code-token code-attr-name">data-race</span>
                <span className="code-token code-punctuation">=</span>
                <span className="code-token code-attr-value">"dwarf"</span>
                <span className="code-token code-tag">&gt;</span>
                Gimli
                <span className="code-token code-tag">&lt;/li&gt;</span>
                {'\n  '} <span className="code-token code-tag">&lt;li</span>{' '}
                <span className="code-token code-attr-name">data-race</span>
                <span className="code-token code-punctuation">=</span>
                <span className="code-token code-attr-value">"dwarf"</span>
                <span className="code-token code-tag">&gt;</span>
                Gimli
                <span className="code-token code-tag">&lt;/li&gt;</span>
                {'\n  '} <span className="code-token code-tag">&lt;li</span>{' '}
                <span className="code-token code-attr-name">data-race</span>
                <span className="code-token code-punctuation">=</span>
                <span className="code-token code-attr-value">"dwarf"</span>
                <span className="code-token code-tag">&gt;</span>
                Gimli
                <span className="code-token code-tag">&lt;/li&gt;</span>
                {'\n  '} <span className="code-token code-tag">&lt;li</span>{' '}
                <span className="code-token code-attr-name">data-race</span>
                <span className="code-token code-punctuation">=</span>
                <span className="code-token code-attr-value">"dwarf"</span>
                <span className="code-token code-tag">&gt;</span>
                Gimli
                <span className="code-token code-tag">&lt;/li&gt;</span>
                {'\n  '} <span className="code-token code-tag">&lt;li</span>{' '}
                <span className="code-token code-attr-name">data-race</span>
                <span className="code-token code-punctuation">=</span>
                <span className="code-token code-attr-value">"dwarf"</span>
                <span className="code-token code-tag">&gt;</span>
                Gimli
                <span className="code-token code-tag">&lt;/li&gt;</span>
                {'\n  '} <span className="code-token code-tag">&lt;li</span>{' '}
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
          </Scroller>
        </Comparison>
      </div>
    </div>
  );
}
