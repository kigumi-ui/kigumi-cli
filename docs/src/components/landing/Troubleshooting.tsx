import { useState, useMemo, useEffect, type ReactNode } from 'react';
import Fuse, { type FuseResult } from 'fuse.js';
import { Details, Icon, Input } from '@/components/ui';
import { CodeBlock } from '@/components/CodeBlock';

interface FaqItem {
  id: string;
  summary: string;
  searchText: string;
  content: ReactNode;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'doctor',
    summary: 'Something looks broken? Run the doctor',
    searchText:
      'doctor broken fix issues wrong imports missing components version mismatch dry-run',
    content: (
      <div className="wa-stack wa-gap-m">
        <p>
          The <code>doctor</code> command checks your project for common issues
          — wrong imports, missing components, version mismatches — and offers
          to fix them automatically.
        </p>
        <CodeBlock value="npx kigumi doctor" />
        <p>
          To preview what would be fixed without making changes, use the dry-run
          flag:
        </p>
        <CodeBlock value="npx kigumi doctor --dry-run" />
      </div>
    ),
  },
  {
    id: 'pro-token-401',
    summary: 'Pro token authentication fails (401 error)',
    searchText:
      'pro token 401 authentication npm install pnpm fail webawesome cloudsmith .env CI GitHub Actions',
    content: (
      <div className="wa-stack wa-gap-m">
        <p>
          If <code>npm install</code> or <code>pnpm install</code> fails with
          401 when installing packages,{' '}
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
        <CodeBlock value="npx kigumi init --token YOUR_TOKEN" />
        <p>
          <strong>Option 2: Set globally (once per machine)</strong>
        </p>
        <CodeBlock value="npm config set //npm.cloudsmith.io/fortawesome/webawesome-pro/:_authToken YOUR_TOKEN" />
        <p>
          <strong>Option 3: In project .env file</strong>
        </p>
        <p>
          Add to your project's <code>.env</code> file:
        </p>
        <CodeBlock value="WEBAWESOME_NPM_TOKEN=your_token_here" />
        <p>
          <strong>Option 4: CI/CD environments</strong>
        </p>
        <p>Set the environment variable in your CI/CD config:</p>
        <CodeBlock value="WEBAWESOME_NPM_TOKEN=your_token_here" />
        <p>GitHub Actions example:</p>
        <CodeBlock
          multiline
          value={`env:\n  WEBAWESOME_NPM_TOKEN: \${{ secrets.WEBAWESOME_NPM_TOKEN }}`}
          copyValue="env:\n  WEBAWESOME_NPM_TOKEN: ${{ secrets.WEBAWESOME_NPM_TOKEN }}"
        />
      </div>
    ),
  },
  {
    id: 'config-not-found',
    summary: "Command fails with 'Configuration file not found'",
    searchText:
      'configuration file not found kigumi.config.json kigumi.json init',
    content: (
      <div className="wa-stack wa-gap-m">
        <p>
          This error means Kigumi can't find <code>kigumi.config.json</code> or{' '}
          <code>kigumi.json</code> in your project. You need to initialize your
          project first:
        </p>
        <CodeBlock value="npx kigumi init" />
        <p>
          This will create the config file and set up your project structure.
          After that, you can run <code>kigumi add</code> to install components.
        </p>
      </div>
    ),
  },
  {
    id: 'import-alias',
    summary: "Cannot find module '@/lib/kigumi'",
    searchText:
      'cannot find module @/lib/kigumi path alias vite.config tsconfig resolve',
    content: (
      <div className="wa-stack wa-gap-m">
        <p>Configure path aliases in your project:</p>
        <p>
          <strong>vite.config.ts:</strong>
        </p>
        <CodeBlock
          multiline
          value={`resolve: {\n  alias: { '@': path.resolve(__dirname, './src') }\n}`}
          copyValue="resolve: {\n  alias: { '@': path.resolve(__dirname, './src') }\n}"
        />
        <p>
          <strong>tsconfig.json:</strong>
        </p>
        <CodeBlock value={`"paths": { "@/*": ["./src/*"] }`} />
      </div>
    ),
  },
  {
    id: 'styles-not-loading',
    summary: 'Component styles not loading',
    searchText:
      'styles not loading import kigumi setup entry file main.tsx css',
    content: (
      <div className="wa-stack wa-gap-m">
        <p>
          Import Kigumi setup in your entry file (e.g. <code>src/main.tsx</code>
          ):
        </p>
        <CodeBlock value="import '@/lib/kigumi';" />
        <p>
          This import must come <strong>before</strong> any component imports.
        </p>
      </div>
    ),
  },
  {
    id: 'tier-restriction',
    summary: 'Tried to add a component but got a tier restriction error',
    searchText:
      'tier restriction pro feature requires toast data-grid date-picker WEBAWESOME_NPM_TOKEN',
    content: (
      <div className="wa-stack wa-gap-m">
        <p>
          Some components (like <code>toast</code>, <code>data-grid</code>,{' '}
          <code>date-picker</code>) require Web Awesome Pro. If you see{' '}
          <em>"Feature requires Pro tier"</em>, you need to set up your Pro
          token:
        </p>
        <p>
          <strong>
            1. Add your token to <code>.env</code>:
          </strong>
        </p>
        <CodeBlock value="WEBAWESOME_NPM_TOKEN=your_token_here" />
        <p>
          <strong>2. Re-run the add command:</strong>
        </p>
        <CodeBlock value="npx kigumi add toast" />
        <p>To see which components are available for your current tier, run:</p>
        <CodeBlock value="npx kigumi list" />
      </div>
    ),
  },
  {
    id: 'version-mismatch',
    summary: 'CLI version mismatch after update',
    searchText: 'version mismatch CLI project config out of sync upgrade pin',
    content: (
      <div className="wa-stack wa-gap-m">
        <p>
          If you see <em>"CLI version does not match project version"</em>, your
          CLI and project config are out of sync. You have two options:
        </p>
        <p>
          <strong>Option 1: Upgrade your project to match the CLI</strong>
        </p>
        <CodeBlock value="npx kigumi upgrade" />
        <p>Preview what would change without modifying anything:</p>
        <CodeBlock value="npx kigumi upgrade --dry-run" />
        <p>
          <strong>Option 2: Pin the CLI to your project's version</strong>
        </p>
        <p>
          If you're not ready to upgrade, use the version that matches your
          config:
        </p>
        <CodeBlock value="npx kigumi@YOUR_CONFIG_VERSION add button" />
      </div>
    ),
  },
  {
    id: 'cache-errors',
    summary: 'Package manager store or cache errors',
    searchText:
      'UNEXPECTED_STORE REGISTRIES_MISMATCH cache lockfile node_modules pnpm npm yarn bun reinstall',
    content: (
      <div className="wa-stack wa-gap-m">
        <p>
          If you see <code>UNEXPECTED_STORE, REGISTRIES_MISMATCH</code>, or
          cache errors, delete your lockfile and reinstall:
        </p>
        <p>
          <strong>pnpm:</strong>
        </p>
        <CodeBlock value="rm -rf node_modules pnpm-lock.yaml && pnpm install" />
        <p>
          <strong>npm:</strong>
        </p>
        <CodeBlock value="rm -rf node_modules package-lock.json && npm install" />
        <p>
          <strong>yarn:</strong>
        </p>
        <CodeBlock value="rm -rf node_modules yarn.lock && yarn install" />
        <p>
          <strong>bun:</strong>
        </p>
        <CodeBlock value="rm -rf node_modules bun.lockb && bun install" />
      </div>
    ),
  },
  {
    id: 'typescript-wa-elements',
    summary: 'TypeScript errors on wa-* elements',
    searchText:
      'TypeScript wa-button JSX.IntrinsicElements type declarations web-awesome.d.ts tsconfig include',
    content: (
      <div className="wa-stack wa-gap-m">
        <p>
          If you see{' '}
          <em>
            "Property 'wa-button' does not exist on type
            'JSX.IntrinsicElements'"
          </em>
          , the type declarations for Web Awesome components are missing. Re-add
          the component to regenerate them:
        </p>
        <CodeBlock value="npx kigumi add button" />
        <p>
          Also verify that <code>src/types/web-awesome.d.ts</code> is included
          in your <code>tsconfig.json</code>:
        </p>
        <CodeBlock value={`"include": ["src"]`} />
      </div>
    ),
  },
  {
    id: 'kigumi-directory',
    summary: 'What is the .kigumi/ directory?',
    searchText: '.kigumi snapshots directory commit git three-way merge update',
    content: (
      <div className="wa-stack wa-gap-m">
        <p>
          The <code>.kigumi/snapshots/</code> directory stores a copy of the
          template output at install time. It should be committed to git so your
          whole team gets consistent update behavior.
        </p>
      </div>
    ),
  },
  {
    id: 'legacy-components',
    summary: 'I installed components before the update feature existed',
    searchText:
      'legacy components no snapshot installed before update three-way merge',
    content: (
      <div className="wa-stack wa-gap-m">
        <p>
          Legacy components without a snapshot still work. If the file matches
          the current template, a snapshot is created automatically. If it
          differs, you'll be prompted to create one — this enables three-way
          merges for all future updates.
        </p>
      </div>
    ),
  },
  {
    id: 'community-update',
    summary: 'Can I update community registry components?',
    searchText:
      'community registry components update --from snapshots three-way merge',
    content: (
      <div className="wa-stack wa-gap-m">
        <p>
          Yes. Community components installed via <code>--from</code> get
          snapshots just like built-in components. You can update them with{' '}
          <code>kigumi update</code> and the three-way merge works the same way.
        </p>
      </div>
    ),
  },
  {
    id: 'regenerate',
    summary: 'Can I regenerate a component from scratch?',
    searchText: 'regenerate component scratch --force fresh template output',
    content: (
      <div className="wa-stack wa-gap-m">
        <p>
          Use <code>npx kigumi update --force</code> or{' '}
          <code>npx kigumi add button --force --yes</code> to replace with a
          fresh template output. Kigumi shows a diff of your changes before
          asking for confirmation, so you can review what will be replaced.
        </p>
      </div>
    ),
  },
  {
    id: 'customizations-overwritten',
    summary: 'My customizations got overwritten by kigumi add',
    searchText:
      'customizations overwritten kigumi add --force diff backup merge',
    content: (
      <div className="wa-stack wa-gap-m">
        <p>
          If you've customized a generated component and then ran{' '}
          <code>kigumi add --force</code>, your changes may have been replaced.
          Before overwriting, use <code>kigumi diff</code> to preview what would
          change:
        </p>
        <CodeBlock value="npx kigumi diff button" />
        <p>
          This shows a line-by-line comparison of your local file against the
          current template output.
        </p>
        <p>
          <strong>Tip:</strong> Back up your changes before running{' '}
          <code>--force</code>. We're working on a smarter merge flow — for now,{' '}
          <code>kigumi diff</code> is the best way to check before you
          overwrite.
        </p>
      </div>
    ),
  },
];

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

export function Troubleshooting() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 150);

  const fuse = useMemo(
    () =>
      new Fuse(FAQ_ITEMS, {
        keys: [
          { name: 'summary', weight: 2 },
          { name: 'searchText', weight: 1 },
        ],
        threshold: 0.35,
        includeScore: false,
        minMatchCharLength: 2,
      }),
    []
  );

  const filteredItems = useMemo(() => {
    const q = debouncedQuery.trim();
    if (q.length < 2) return FAQ_ITEMS;
    return fuse.search(q).map((r: FuseResult<FaqItem>) => r.item);
  }, [debouncedQuery, fuse]);

  const isSearching = debouncedQuery.trim().length >= 2;
  const showEmpty = isSearching && filteredItems.length === 0;

  return (
    <section className="troubleshooting section">
      <div className="wa-stack wa-gap-xl">
        <h2 className="wa-heading-2xl" id="faq">
          FAQ
        </h2>

        <Input
          type="search"
          placeholder="Search FAQ..."
          value={query}
          onInput={(e: Event) => setQuery((e.target as HTMLInputElement).value)}
          with-clear
          onClear={() => setQuery('')}
        >
          <Icon slot="start" name="magnifying-glass" />
        </Input>

        {showEmpty ? (
          <p className="wa-body-m" style={{ opacity: 0.6 }}>
            No results for &quot;{debouncedQuery.trim()}&quot;
          </p>
        ) : (
          <div className="wa-stack wa-gap-m">
            {filteredItems.map((item) => (
              <Details
                key={item.id}
                name="faq"
                appearance="outlined"
                summary={item.summary}
              >
                {item.content}
              </Details>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
