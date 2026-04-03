import { Card, CopyButton, Details } from '@/components/ui';

export function Troubleshooting() {
  return (
    <section className="troubleshooting section">
      <div className="wa-stack wa-gap-xl">
        <h2 className="wa-heading-2xl" id="troubleshooting">
          Troubleshooting
        </h2>

        <div className="wa-stack wa-gap-m">
          {/* Q1: Doctor — NEW */}
          <Details
            name="faq"
            appearance="outlined"
            summary="Something looks broken? Run the doctor"
          >
            <div className="wa-stack wa-gap-m">
              <p>
                The <code>doctor</code> command checks your project for common
                issues — wrong imports, missing components, version mismatches —
                and offers to fix them automatically.
              </p>
              <Card appearance="outlined" style={{ '--spacing': '0' }}>
                <div
                  className="wa-flank:end wa-align-items-center wa-gap-xs"
                  style={{ position: 'relative' }}
                >
                  <pre>
                    <code>npx kigumi doctor</code>
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
                    <CopyButton value="npx kigumi doctor" />
                  </span>
                </div>
              </Card>
              <p>
                To preview what would be fixed without making changes, use the
                dry-run flag:
              </p>
              <Card appearance="outlined" style={{ '--spacing': '0' }}>
                <div
                  className="wa-flank:end wa-align-items-center wa-gap-xs"
                  style={{ position: 'relative' }}
                >
                  <pre>
                    <code>npx kigumi doctor --dry-run</code>
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
                    <CopyButton value="npx kigumi doctor --dry-run" />
                  </span>
                </div>
              </Card>
            </div>
          </Details>

          {/* Q2: Pro token 401 (existing) */}
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

          {/* Q3: Config not found — NEW */}
          <Details
            name="faq"
            appearance="outlined"
            summary="Command fails with 'Configuration file not found'"
          >
            <div className="wa-stack wa-gap-m">
              <p>
                This error means Kigumi can't find{' '}
                <code>kigumi-components.json</code> or <code>kigumi.json</code>{' '}
                in your project. You need to initialize your project first:
              </p>
              <Card appearance="outlined" style={{ '--spacing': '0' }}>
                <div
                  className="wa-flank:end wa-align-items-center wa-gap-xs"
                  style={{ position: 'relative' }}
                >
                  <pre>
                    <code>npx kigumi init</code>
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
                    <CopyButton value="npx kigumi init" />
                  </span>
                </div>
              </Card>
              <p>
                This will create the config file and set up your project
                structure. After that, you can run <code>kigumi add</code> to
                install components.
              </p>
            </div>
          </Details>

          {/* Q4: Import errors (existing) */}
          <Details
            name="faq"
            appearance="outlined"
            summary="Cannot find module '@/lib/kigumi'"
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

          {/* Q5: Styles not loading (existing) */}
          <Details
            name="faq"
            appearance="outlined"
            summary="Component styles not loading"
          >
            <div className="wa-stack wa-gap-m">
              <p>
                Import Kigumi setup in your entry file (e.g.{' '}
                <code>src/main.tsx</code>):
              </p>
              <Card appearance="outlined" style={{ '--spacing': '0' }}>
                <div
                  className="wa-flank:end wa-align-items-center wa-gap-xs"
                  style={{ position: 'relative' }}
                >
                  <pre>
                    <code>import '@/lib/kigumi';</code>
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
                    <CopyButton value="import '@/lib/kigumi';" />
                  </span>
                </div>
              </Card>
              <p>
                This import must come <strong>before</strong> any component
                imports.
              </p>
            </div>
          </Details>

          {/* Q6: Tier restriction — NEW */}
          <Details
            name="faq"
            appearance="outlined"
            summary="Tried to add a component but got a tier restriction error"
          >
            <div className="wa-stack wa-gap-m">
              <p>
                Some components (like <code>toast</code>, <code>data-grid</code>
                , <code>date-picker</code>) require Web Awesome Pro. If you see{' '}
                <em>"Feature requires Pro tier"</em>, you need to set up your
                Pro token:
              </p>
              <p>
                <strong>
                  1. Add your token to <code>.env</code>:
                </strong>
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
                <strong>2. Re-run the add command:</strong>
              </p>
              <Card appearance="outlined" style={{ '--spacing': '0' }}>
                <div
                  className="wa-flank:end wa-align-items-center wa-gap-xs"
                  style={{ position: 'relative' }}
                >
                  <pre>
                    <code>npx kigumi add toast</code>
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
                    <CopyButton value="npx kigumi add toast" />
                  </span>
                </div>
              </Card>
              <p>
                To see which components are available for your current tier,
                run:
              </p>
              <Card appearance="outlined" style={{ '--spacing': '0' }}>
                <div
                  className="wa-flank:end wa-align-items-center wa-gap-xs"
                  style={{ position: 'relative' }}
                >
                  <pre>
                    <code>npx kigumi list</code>
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
                    <CopyButton value="npx kigumi list" />
                  </span>
                </div>
              </Card>
            </div>
          </Details>

          {/* Q7: Version mismatch — NEW */}
          <Details
            name="faq"
            appearance="outlined"
            summary="CLI version mismatch after update"
          >
            <div className="wa-stack wa-gap-m">
              <p>
                If you see <em>"CLI version does not match project version"</em>
                , your CLI and project config are out of sync. You have two
                options:
              </p>
              <p>
                <strong>Option 1: Upgrade your project to match the CLI</strong>
              </p>
              <Card appearance="outlined" style={{ '--spacing': '0' }}>
                <div
                  className="wa-flank:end wa-align-items-center wa-gap-xs"
                  style={{ position: 'relative' }}
                >
                  <pre>
                    <code>npx kigumi upgrade</code>
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
                    <CopyButton value="npx kigumi upgrade" />
                  </span>
                </div>
              </Card>
              <p>Preview what would change without modifying anything:</p>
              <Card appearance="outlined" style={{ '--spacing': '0' }}>
                <div
                  className="wa-flank:end wa-align-items-center wa-gap-xs"
                  style={{ position: 'relative' }}
                >
                  <pre>
                    <code>npx kigumi upgrade --dry-run</code>
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
                    <CopyButton value="npx kigumi upgrade --dry-run" />
                  </span>
                </div>
              </Card>
              <p>
                <strong>Option 2: Pin the CLI to your project's version</strong>
              </p>
              <p>
                If you're not ready to upgrade, use the version that matches
                your config:
              </p>
              <Card appearance="outlined" style={{ '--spacing': '0' }}>
                <div
                  className="wa-flank:end wa-align-items-center wa-gap-xs"
                  style={{ position: 'relative' }}
                >
                  <pre>
                    <code>npx kigumi@YOUR_CONFIG_VERSION add button</code>
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
                    <CopyButton value="npx kigumi@YOUR_CONFIG_VERSION add button" />
                  </span>
                </div>
              </Card>
            </div>
          </Details>

          {/* Q8: Package manager store/cache errors (existing + Bun) */}
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

              <p>
                <strong>bun:</strong>
              </p>
              <Card appearance="outlined" style={{ '--spacing': '0' }}>
                <div
                  className="wa-flank:end wa-align-items-center wa-gap-xs"
                  style={{ position: 'relative' }}
                >
                  <pre>
                    <code>rm -rf node_modules bun.lockb && bun install</code>
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
                    <CopyButton value="rm -rf node_modules bun.lockb && bun install" />
                  </span>
                </div>
              </Card>
            </div>
          </Details>

          {/* Q9: TypeScript errors on wa-* elements — NEW */}
          <Details
            name="faq"
            appearance="outlined"
            summary="TypeScript errors on wa-* elements"
          >
            <div className="wa-stack wa-gap-m">
              <p>
                If you see{' '}
                <em>
                  "Property 'wa-button' does not exist on type
                  'JSX.IntrinsicElements'"
                </em>
                , the type declarations for Web Awesome components are missing.
                Re-add the component to regenerate them:
              </p>
              <Card appearance="outlined" style={{ '--spacing': '0' }}>
                <div
                  className="wa-flank:end wa-align-items-center wa-gap-xs"
                  style={{ position: 'relative' }}
                >
                  <pre>
                    <code>npx kigumi add button</code>
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
                    <CopyButton value="npx kigumi add button" />
                  </span>
                </div>
              </Card>
              <p>
                Also verify that <code>src/types/web-awesome.d.ts</code> is
                included in your <code>tsconfig.json</code>:
              </p>
              <Card appearance="outlined" style={{ '--spacing': '0' }}>
                <div
                  className="wa-flank:end wa-align-items-center wa-gap-xs"
                  style={{ position: 'relative' }}
                >
                  <pre>
                    <code>{`"include": ["src"]`}</code>
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
                    <CopyButton value='"include": ["src"]' />
                  </span>
                </div>
              </Card>
            </div>
          </Details>

          {/* Q10: Customizations overwritten — NEW */}
          <Details
            name="faq"
            appearance="outlined"
            summary="My customizations got overwritten by kigumi add"
          >
            <div className="wa-stack wa-gap-m">
              <p>
                If you've customized a generated component and then ran{' '}
                <code>kigumi add --force</code>, your changes may have been
                replaced. Before overwriting, use <code>kigumi diff</code> to
                preview what would change:
              </p>
              <Card appearance="outlined" style={{ '--spacing': '0' }}>
                <div
                  className="wa-flank:end wa-align-items-center wa-gap-xs"
                  style={{ position: 'relative' }}
                >
                  <pre>
                    <code>npx kigumi diff button</code>
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
                    <CopyButton value="npx kigumi diff button" />
                  </span>
                </div>
              </Card>
              <p>
                This shows a line-by-line comparison of your local file against
                the current template output.
              </p>
              <p>
                <strong>Tip:</strong> Back up your changes before running{' '}
                <code>--force</code>. We're working on a smarter merge flow —
                for now, <code>kigumi diff</code> is the best way to check
                before you overwrite.
              </p>
            </div>
          </Details>
        </div>
      </div>
    </section>
  );
}
