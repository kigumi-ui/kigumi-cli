# Layout Archetypes

## A: App Shell

Sidebar navigation + main content area.

```
+--sidebar--+--------main---------+
|  Logo     |                     |
|  Nav 1    |    Page Content     |
|  Nav 2    |                     |
|  Nav 3    |                     |
+-----------+---------------------+
```

### React

```tsx
import { Button, Divider, Icon } from '@/components/ui';

interface AppShellProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function AppShell({ children, currentPage, onNavigate }: AppShellProps) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'chart-line' },
    { id: 'users', label: 'Users', icon: 'users' },
    { id: 'settings', label: 'Settings', icon: 'gear' },
  ];

  return (
    <div className="wa-flank wa-gap-0" style={{ minHeight: '100vh', '--flank-size': '240px' } as React.CSSProperties}>
      <nav className="wa-stack wa-gap-xs" style={{ padding: 'var(--wa-space-m)', backgroundColor: 'var(--wa-color-surface-lowered)' }} aria-label="Main navigation">
        <strong style={{ fontSize: 'var(--wa-font-size-l)' }}>My App</strong>
        <Divider />
        {navItems.map((item) => (
          <Button
            key={item.id}
            variant={currentPage === item.id ? 'brand' : 'neutral'}
            appearance="plain"
            onClick={() => onNavigate(item.id)}
            style={{ justifyContent: 'flex-start' }}
          >
            <Icon slot="start" name={item.icon} />
            {item.label}
          </Button>
        ))}
      </nav>
      <main style={{ padding: 'var(--wa-space-l)', flex: 1 }}>
        {children}
      </main>
    </div>
  );
}
```

### Vue

```vue
<script setup lang="ts">
import { Button, Divider, Icon } from '@/components/ui';

defineProps<{ currentPage: string }>();
const emit = defineEmits<{ navigate: [page: string] }>();

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: 'chart-line' },
  { id: 'users', label: 'Users', icon: 'users' },
  { id: 'settings', label: 'Settings', icon: 'gear' },
];
</script>

<template>
  <div class="wa-flank wa-gap-0" style="min-height: 100vh; --flank-size: 240px">
    <nav class="wa-stack wa-gap-xs" style="padding: var(--wa-space-m); background: var(--wa-color-surface-lowered)" aria-label="Main navigation">
      <strong style="font-size: var(--wa-font-size-l)">My App</strong>
      <Divider />
      <Button
        v-for="item in navItems"
        :key="item.id"
        :variant="currentPage === item.id ? 'brand' : 'neutral'"
        appearance="plain"
        style="justify-content: flex-start"
        @click="emit('navigate', item.id)"
      >
        <Icon slot="start" :name="item.icon" />
        {{ item.label }}
      </Button>
    </nav>
    <main style="padding: var(--wa-space-l); flex: 1">
      <slot />
    </main>
  </div>
</template>
```

---

## B: Dashboard

App Shell + metric card grid + sections.

```
+--sidebar--+--------main---------+
|           | [Card] [Card] [Card]|
|           | [Card] [Card] [Card]|
|           |                     |
|           | Recent Activity     |
|           | - item 1            |
|           | - item 2            |
+-----------+---------------------+
```

### React

```tsx
import { Card, FormatNumber, Icon } from '@/components/ui';

interface Metric {
  label: string;
  value: number;
  icon: string;
  type?: 'currency' | 'decimal' | 'percent';
}

export function DashboardContent({ metrics }: { metrics: Metric[] }) {
  return (
    <div className="wa-stack wa-gap-l">
      <h1>Dashboard</h1>

      <div className="wa-grid" style={{ '--min-column-size': '250px' } as React.CSSProperties}>
        {metrics.map((m) => (
          <Card key={m.label}>
            <div className="wa-split">
              <div className="wa-stack wa-gap-2xs">
                <span style={{ color: 'var(--wa-color-text-quiet)' }}>{m.label}</span>
                <strong style={{ fontSize: 'var(--wa-font-size-2xl)' }}>
                  <FormatNumber value={m.value} type={m.type || 'decimal'} currency={m.type === 'currency' ? 'USD' : undefined} />
                </strong>
              </div>
              <Icon name={m.icon} style={{ fontSize: '2rem', color: 'var(--wa-color-brand)' }} />
            </div>
          </Card>
        ))}
      </div>

      <section className="wa-stack wa-gap-m">
        <h2>Recent Activity</h2>
        {/* Activity list here */}
      </section>
    </div>
  );
}
```

---

## C: Settings Page

TabGroup + collapsible Details sections.

```
+---[General]---[Notifications]---[Security]---+
|                                               |
| > Profile                                     |
|   Name: [________]  Email: [________]        |
|                                               |
| > Preferences                                 |
|   Language: [Select]  Theme: (o)Light (o)Dark|
+-----------------------------------------------+
```

### Tab-Panel Linking Convention

Tab and TabPanel components are linked by matching string identifiers:

1. Each `<Tab>` needs `slot="nav"` (to place it in the tab bar) and `panel="panelName"`
2. Each `<TabPanel>` needs `name="panelName"` (must match the Tab's `panel` prop)

```tsx
<TabGroup>
  {/* Tabs in the nav slot, linked via panel prop */}
  <Tab slot="nav" panel="general">General</Tab>
  <Tab slot="nav" panel="security">Security</Tab>

  {/* Panels linked via name prop (must match panel above) */}
  <TabPanel name="general">General content</TabPanel>
  <TabPanel name="security">Security content</TabPanel>
</TabGroup>
```

**Common mistake:** Forgetting `slot="nav"` on Tab components, or mismatching `panel`/`name` strings.

### React

```tsx
import {
  Button, Details, Divider, Input, Option, Radio, RadioGroup,
  Select, Switch, Tab, TabGroup, TabPanel,
} from '@/components/ui';

export function SettingsPage() {
  return (
    <div className="wa-stack wa-gap-l" style={{ maxWidth: '800px' }}>
      <h1>Settings</h1>
      <TabGroup>
        <Tab slot="nav" panel="general">General</Tab>
        <Tab slot="nav" panel="notifications">Notifications</Tab>
        <Tab slot="nav" panel="security">Security</Tab>

        <TabPanel name="general">
          <div className="wa-stack wa-gap-m">
            <Details summary="Profile" open>
              <div className="wa-stack wa-gap-m">
                <div className="wa-grid" style={{ '--min-column-size': '200px' } as React.CSSProperties}>
                  <Input label="First name" name="firstName" />
                  <Input label="Last name" name="lastName" />
                </div>
                <Input label="Email" name="email" type="email" />
              </div>
            </Details>
            <Details summary="Preferences">
              <div className="wa-stack wa-gap-m">
                <Select label="Language"><Option value="en">English</Option><Option value="de">Deutsch</Option></Select>
                <RadioGroup label="Theme" value="system">
                  <Radio value="light">Light</Radio><Radio value="dark">Dark</Radio><Radio value="system">System</Radio>
                </RadioGroup>
              </div>
            </Details>
          </div>
        </TabPanel>

        <TabPanel name="notifications">
          <div className="wa-stack wa-gap-m">
            <Switch checked>Email notifications</Switch>
            <Switch>Push notifications</Switch>
          </div>
        </TabPanel>

        <TabPanel name="security">
          <div className="wa-stack wa-gap-m">
            <Input label="Current password" type="password" />
            <Input label="New password" type="password" />
            <Button variant="brand">Update password</Button>
          </div>
        </TabPanel>
      </TabGroup>
    </div>
  );
}
```

---

## D: Marketing / Landing Page

Full-width sections stacked vertically.

```
+------------------------------------------+
|          Hero: .wa-split                  |
|  [Text + CTA]     [Image/Demo]          |
+------------------------------------------+
|     Features: .wa-grid (3 cols)          |
|  [Card]  [Card]  [Card]                 |
+------------------------------------------+
|          Footer: .wa-split               |
+------------------------------------------+
```

### React

```tsx
import { Button, Card, Icon } from '@/components/ui';

export function LandingPage() {
  return (
    <div className="wa-stack wa-gap-3xl">
      {/* Hero */}
      <section className="wa-split" style={{ padding: 'var(--wa-space-3xl) var(--wa-space-l)', alignItems: 'center' }}>
        <div className="wa-stack wa-gap-m" style={{ maxWidth: '500px' }}>
          <h1>Build faster with Kigumi</h1>
          <p style={{ color: 'var(--wa-color-text-quiet)' }}>
            Ready-made Web Awesome components for React and Vue.
          </p>
          <div className="wa-cluster wa-gap-s">
            <Button variant="brand" size="large">Get Started</Button>
            <Button variant="neutral" size="large" appearance="outlined">View Docs</Button>
          </div>
        </div>
        <div className="wa-frame wa-frame:landscape" style={{ maxWidth: '500px' }}>
          <img src="/hero.png" alt="Product screenshot" />
        </div>
      </section>

      {/* Features */}
      <section className="wa-stack wa-gap-l" style={{ padding: 'var(--wa-space-2xl) var(--wa-space-l)' }}>
        <h2 style={{ textAlign: 'center' }}>Features</h2>
        <div className="wa-grid" style={{ '--min-column-size': '280px' } as React.CSSProperties}>
          {['bolt', 'palette', 'universal-access'].map((icon) => (
            <Card key={icon}>
              <div className="wa-stack wa-gap-s wa-align-items-center" style={{ textAlign: 'center', padding: 'var(--wa-space-m)' }}>
                <Icon name={icon} style={{ fontSize: '2rem', color: 'var(--wa-color-brand)' }} />
                <strong>Feature Title</strong>
                <p style={{ color: 'var(--wa-color-text-quiet)' }}>Feature description goes here.</p>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
```

---

## E: Data Browser

Filters sidebar + data content area.

```
+--filters--+--------content-------+
| Category  | [List] [Grid] [Map] |
| [x] A     |                      |
| [x] B     | Name | Status | Date|
| Price      | Row  | Active | 3/1 |
| [===--]    | Row  | Draft  | 2/28|
|            | < 1 2 3 >           |
+--filters--+----------------------+
```

### React

```tsx
import { Button, Checkbox, Divider, Input, Slider, Tab, TabGroup, TabPanel } from '@/components/ui';

export function DataBrowser() {
  return (
    <div className="wa-flank wa-gap-l" style={{ '--flank-size': '260px' } as React.CSSProperties}>
      {/* Filters sidebar */}
      <aside className="wa-stack wa-gap-m" aria-label="Filters">
        <Input label="Search" type="search" with-clear />
        <Divider />
        <fieldset className="wa-stack wa-gap-xs">
          <legend>Category</legend>
          <Checkbox checked>Electronics</Checkbox>
          <Checkbox checked>Clothing</Checkbox>
          <Checkbox>Books</Checkbox>
        </fieldset>
        <Divider />
        <Slider label="Max price" min={0} max={1000} value={500} with-tooltip />
        <Button variant="brand" size="small" style={{ width: '100%' }}>Apply Filters</Button>
      </aside>

      {/* Content area */}
      <main className="wa-stack wa-gap-m">
        <TabGroup>
          <Tab slot="nav" panel="list">List</Tab>
          <Tab slot="nav" panel="grid">Grid</Tab>
          <TabPanel name="list">
            {/* Data table or list here */}
            <p>Data table goes here</p>
          </TabPanel>
          <TabPanel name="grid">
            <div className="wa-grid" style={{ '--min-column-size': '200px' } as React.CSSProperties}>
              {/* Grid cards here */}
            </div>
          </TabPanel>
        </TabGroup>
      </main>
    </div>
  );
}
```

---

## F: Page Shell

Full-page layout using the `<Page>` component (Pro tier). Provides header, navigation (with automatic mobile hamburger), and main content slots.

```
+------------------------------------------+
|  [Logo]     Navigation Links    [Avatar] |  <- header slot
+------------------------------------------+
|  Main Content                            |  <- default slot
|                                          |
|                                          |
+------------------------------------------+
|  Footer                                  |  <- footer slot
+------------------------------------------+

Mobile:
+---------------------+
| [=] Logo   [Avatar] |
+---------------------+
|  Main Content       |
+---------------------+
|  Footer             |
+---------------------+
  v hamburger opens v
+--------+
| Nav 1  |  <- navigation slot (auto drawer)
| Nav 2  |
| Nav 3  |
+--------+
```

**Important:** React cannot forward the `slot` attribute on React components. You must use wrapper HTML elements (`<div slot="header">`, `<nav slot="navigation">`, `<div slot="footer">`).

### React

```tsx
import { Avatar, Button, Divider, Icon, Page } from '@/components/ui';

export function AppPageShell({ children }: { children: React.ReactNode }) {
  return (
    <Page mobile-breakpoint="768px">
      {/* Header slot -- must use wrapper element */}
      <div slot="header" className="wa-split wa-align-items-center" style={{ padding: 'var(--wa-space-s) var(--wa-space-m)' }}>
        <strong>My App</strong>
        <div className="wa-cluster wa-gap-s wa-align-items-center">
          <Button variant="neutral" appearance="plain" size="small">Docs</Button>
          <Avatar initials="M" shape="circle" />
        </div>
      </div>

      {/* Navigation slot -- auto hamburger on mobile */}
      <nav slot="navigation" className="wa-stack wa-gap-xs" style={{ padding: 'var(--wa-space-m)' }}>
        <Button variant="brand" appearance="plain" style={{ justifyContent: 'flex-start' }}>
          <Icon slot="start" name="house" />Dashboard
        </Button>
        <Button variant="neutral" appearance="plain" style={{ justifyContent: 'flex-start' }}>
          <Icon slot="start" name="users" />Users
        </Button>
        <Button variant="neutral" appearance="plain" style={{ justifyContent: 'flex-start' }}>
          <Icon slot="start" name="gear" />Settings
        </Button>
      </nav>

      {/* Default slot -> main content */}
      {children}

      {/* Footer slot */}
      <div slot="footer" className="wa-split wa-align-items-center" style={{ padding: 'var(--wa-space-s) var(--wa-space-m)' }}>
        <small style={{ color: 'var(--wa-color-text-quiet)' }}>2026 My App</small>
        <div className="wa-cluster wa-gap-s">
          <a href="/privacy" className="wa-link">Privacy</a>
          <a href="/terms" className="wa-link">Terms</a>
        </div>
      </div>
    </Page>
  );
}
```

### Vue

```vue
<script setup lang="ts">
import { Avatar, Button, Divider, Icon, Page } from '@/components/ui';
</script>

<template>
  <Page mobile-breakpoint="768px">
    <div slot="header" class="wa-split wa-align-items-center" style="padding: var(--wa-space-s) var(--wa-space-m)">
      <strong>My App</strong>
      <div class="wa-cluster wa-gap-s wa-align-items-center">
        <Button variant="neutral" appearance="plain" size="small">Docs</Button>
        <Avatar initials="M" shape="circle" />
      </div>
    </div>

    <nav slot="navigation" class="wa-stack wa-gap-xs" style="padding: var(--wa-space-m)">
      <Button variant="brand" appearance="plain" style="justify-content: flex-start">
        <Icon slot="start" name="house" />Dashboard
      </Button>
      <Button variant="neutral" appearance="plain" style="justify-content: flex-start">
        <Icon slot="start" name="users" />Users
      </Button>
      <Button variant="neutral" appearance="plain" style="justify-content: flex-start">
        <Icon slot="start" name="gear" />Settings
      </Button>
    </nav>

    <slot />

    <div slot="footer" class="wa-split wa-align-items-center" style="padding: var(--wa-space-s) var(--wa-space-m)">
      <small style="color: var(--wa-color-text-quiet)">2026 My App</small>
      <div class="wa-cluster wa-gap-s">
        <a href="/privacy" class="wa-link">Privacy</a>
        <a href="/terms" class="wa-link">Terms</a>
      </div>
    </div>
  </Page>
</template>
```

### Key Props

| Prop | Default | Purpose |
|------|---------|---------|
| `mobile-breakpoint` | `768px` | Viewport width for mobile/desktop switch |
| `disable-navigation-toggle` | `false` | Hide built-in hamburger (use for custom toggle) |
| `navigation-placement` | `start` | Navigation drawer position (`start` or `end`) |
| `nav-open` | `false` | Programmatic control of mobile nav drawer |

### Slot Reference

| Slot | Element | Purpose |
|------|---------|---------|
| `header` | `<div slot="header">` | Top bar (logo, user menu) |
| `navigation` | `<nav slot="navigation">` | Mobile drawer nav (auto hamburger) |
| `footer` | `<div slot="footer">` | Page footer |
| (default) | children | Main content area |
