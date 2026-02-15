import { Card, CopyButton, Details } from '@/components/ui';

export function Troubleshooting() {
  return (
    <section id="troubleshooting" className="troubleshooting section">
      <div className="wa-stack wa-gap-xl">
        <h2 className="wa-heading-2xl">Troubleshooting</h2>

        <div className="wa-stack wa-gap-m">
          {/* Q1: Pro token 401 (CLI users) */}
          <Details
            name="faq"
            appearance="outlined"
            summary="Pro token authentication fails (401 error)"
          >
            <div className="wa-stack wa-gap-m">
              <p>
                If <code>npm install</code> or <code>pnpm install</code> fails
                with 401 when installing packages,{' '}
                <a
                  href="https://webawesome.com/login"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  get your token here
                </a>
                , then choose one of the following options:
              </p>

              <p>
                <strong>Option 1: Pass token during init (recommended)</strong>
              </p>
              <Card appearance="outlined" style={{ '--spacing': '0' }}>
                <div
                  className="wa-flank:end wa-align-items-center wa-gap-xs"
                  style={{ position: 'relative' }}
                >
                  <pre>
                    <code>npx kigumi init --token YOUR_TOKEN</code>
                  </pre>
                  <span
                    style={{
                      position: 'absolute',
                      right: 'var(--wa-space-xs)',
                      top: '0',
                      bottom: '0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <CopyButton value="npx kigumi init --token YOUR_TOKEN" />
                  </span>
                </div>
              </Card>

              <p>
                <strong>Option 2: Set globally (once per machine)</strong>
              </p>
              <Card appearance="outlined" style={{ '--spacing': '0' }}>
                <div
                  className="wa-flank:end wa-align-items-center wa-gap-xs"
                  style={{ position: 'relative' }}
                >
                  <pre>
                    <code>
                      npm config set
                      //npm.cloudsmith.io/fortawesome/webawesome-pro/:_authToken
                      YOUR_TOKEN
                    </code>
                  </pre>
                  <span
                    style={{
                      position: 'absolute',
                      right: 'var(--wa-space-xs)',
                      top: '0',
                      bottom: '0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <CopyButton value="npm config set //npm.cloudsmith.io/fortawesome/webawesome-pro/:_authToken YOUR_TOKEN" />
                  </span>
                </div>
              </Card>

              <p>
                <strong>Option 3: In project .env file</strong>
              </p>
              <p>
                Add to your project's <code>.env</code> file:
              </p>
              <Card appearance="outlined" style={{ '--spacing': '0' }}>
                <div
                  className="wa-flank:end wa-align-items-center wa-gap-xs"
                  style={{ position: 'relative' }}
                >
                  <pre>
                    <code>WEBAWESOME_NPM_TOKEN=your_token_here</code>
                  </pre>
                  <span
                    style={{
                      position: 'absolute',
                      right: 'var(--wa-space-xs)',
                      top: '0',
                      bottom: '0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <CopyButton value="WEBAWESOME_NPM_TOKEN=your_token_here" />
                  </span>
                </div>
              </Card>

              <p>
                <strong>Option 4: CI/CD environments</strong>
              </p>
              <p>Set the environment variable in your CI/CD config:</p>
              <Card appearance="outlined" style={{ '--spacing': '0' }}>
                <div
                  className="wa-flank:end wa-align-items-center wa-gap-xs"
                  style={{ position: 'relative' }}
                >
                  <pre>
                    <code>WEBAWESOME_NPM_TOKEN=your_token_here</code>
                  </pre>
                  <span
                    style={{
                      position: 'absolute',
                      right: 'var(--wa-space-xs)',
                      top: '0',
                      bottom: '0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <CopyButton value="WEBAWESOME_NPM_TOKEN=your_token_here" />
                  </span>
                </div>
              </Card>
              <p>GitHub Actions example:</p>
              <Card appearance="outlined" style={{ '--spacing': '0' }}>
                <div
                  className="wa-flank:end wa-align-items-start wa-gap-xs"
                  style={{ position: 'relative' }}
                >
                  <pre>
                    <code>{`env:
  WEBAWESOME_NPM_TOKEN: \${{ secrets.WEBAWESOME_NPM_TOKEN }}`}</code>
                  </pre>
                  <span
                    style={{
                      position: 'absolute',
                      right: 'var(--wa-space-xs)',
                      top: 'var(--wa-space-xs)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <CopyButton value="env:\n  WEBAWESOME_NPM_TOKEN: ${{ secrets.WEBAWESOME_NPM_TOKEN }}" />
                  </span>
                </div>
              </Card>
            </div>
          </Details>

          {/* Q2: Import errors */}
          <Details
            name="faq"
            appearance="outlined"
            summary="Cannot find module '@/lib/webawesome'"
          >
            <div className="wa-stack wa-gap-m">
              <p>Configure path aliases in your project:</p>

              <p>
                <strong>vite.config.ts:</strong>
              </p>
              <Card appearance="outlined" style={{ '--spacing': '0' }}>
                <div
                  className="wa-flank:end wa-align-items-start wa-gap-xs"
                  style={{ position: 'relative' }}
                >
                  <pre>
                    <code>{`resolve: {
  alias: { '@': path.resolve(__dirname, './src') }
}`}</code>
                  </pre>
                  <span
                    style={{
                      position: 'absolute',
                      right: 'var(--wa-space-xs)',
                      top: 'var(--wa-space-xs)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <CopyButton value="resolve: {\n  alias: { '@': path.resolve(__dirname, './src') }\n}" />
                  </span>
                </div>
              </Card>

              <p>
                <strong>tsconfig.json:</strong>
              </p>
              <Card appearance="outlined" style={{ '--spacing': '0' }}>
                <div
                  className="wa-flank:end wa-align-items-center wa-gap-xs"
                  style={{ position: 'relative' }}
                >
                  <pre>
                    <code>{`"paths": { "@/*": ["./src/*"] }`}</code>
                  </pre>
                  <span
                    style={{
                      position: 'absolute',
                      right: 'var(--wa-space-xs)',
                      top: '0',
                      bottom: '0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <CopyButton value='"paths": { "@/*": ["./src/*"] }' />
                  </span>
                </div>
              </Card>
            </div>
          </Details>

          {/* Q3: Styles not loading */}
          <Details
            name="faq"
            appearance="outlined"
            summary="Component styles not loading"
          >
            <div className="wa-stack wa-gap-m">
              <p>
                Import Web Awesome setup in your entry file (e.g.{' '}
                <code>src/main.tsx</code>):
              </p>
              <Card appearance="outlined" style={{ '--spacing': '0' }}>
                <div
                  className="wa-flank:end wa-align-items-center wa-gap-xs"
                  style={{ position: 'relative' }}
                >
                  <pre>
                    <code>import '@/lib/webawesome';</code>
                  </pre>
                  <span
                    style={{
                      position: 'absolute',
                      right: 'var(--wa-space-xs)',
                      top: '0',
                      bottom: '0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <CopyButton value="import '@/lib/webawesome';" />
                  </span>
                </div>
              </Card>
              <p>
                This import must come <strong>before</strong> any component
                imports.
              </p>
            </div>
          </Details>

          {/* Q4: Package manager store/cache errors */}
          <Details
            name="faq"
            appearance="outlined"
            summary="Package manager store or cache errors"
          >
            <div className="wa-stack wa-gap-m">
              <p>
                If you see <code>UNEXPECTED_STORE, REGISTRIES_MISMATCH</code>,
                or cache errors, delete your lockfile and reinstall:
              </p>

              <p>
                <strong>pnpm:</strong>
              </p>
              <Card appearance="outlined" style={{ '--spacing': '0' }}>
                <div
                  className="wa-flank:end wa-align-items-center wa-gap-xs"
                  style={{ position: 'relative' }}
                >
                  <pre>
                    <code>
                      rm -rf node_modules pnpm-lock.yaml && pnpm install
                    </code>
                  </pre>
                  <span
                    style={{
                      position: 'absolute',
                      right: 'var(--wa-space-xs)',
                      top: '0',
                      bottom: '0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <CopyButton value="rm -rf node_modules pnpm-lock.yaml && pnpm install" />
                  </span>
                </div>
              </Card>

              <p>
                <strong>npm:</strong>
              </p>
              <Card appearance="outlined" style={{ '--spacing': '0' }}>
                <div
                  className="wa-flank:end wa-align-items-center wa-gap-xs"
                  style={{ position: 'relative' }}
                >
                  <pre>
                    <code>
                      rm -rf node_modules package-lock.json && npm install
                    </code>
                  </pre>
                  <span
                    style={{
                      position: 'absolute',
                      right: 'var(--wa-space-xs)',
                      top: '0',
                      bottom: '0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <CopyButton value="rm -rf node_modules package-lock.json && npm install" />
                  </span>
                </div>
              </Card>

              <p>
                <strong>yarn:</strong>
              </p>
              <Card appearance="outlined" style={{ '--spacing': '0' }}>
                <div
                  className="wa-flank:end wa-align-items-center wa-gap-xs"
                  style={{ position: 'relative' }}
                >
                  <pre>
                    <code>rm -rf node_modules yarn.lock && yarn install</code>
                  </pre>
                  <span
                    style={{
                      position: 'absolute',
                      right: 'var(--wa-space-xs)',
                      top: '0',
                      bottom: '0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <CopyButton value="rm -rf node_modules yarn.lock && yarn install" />
                  </span>
                </div>
              </Card>
            </div>
          </Details>
        </div>
      </div>
    </section>
  );
}
