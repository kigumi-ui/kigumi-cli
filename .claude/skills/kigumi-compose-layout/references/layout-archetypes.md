# Layout Archetypes

## A: App Shell

Sidebar navigation + main content area with collapsible sidebar.

**Required components:** `npx kigumi add button divider icon`

```
+--sidebar--+--------main---------+
|  Logo     |                     |
|  Nav 1    |    Page Content     |
|  Nav 2    |                     |
|  Nav 3    |                     |
+-----------+---------------------+

Collapsed:
+--+--------main---------+
|<<|                      |
|  |    Page Content      |
|  |                      |
+--+----------------------+
```

### React

```tsx
import { useState } from 'react';
import { Button, Divider, Icon } from '@/components/ui';

interface AppShellProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function AppShell({ children, currentPage, onNavigate }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'chart-line' },
    { id: 'users', label: 'Users', icon: 'users' },
    { id: 'settings', label: 'Settings', icon: 'gear' },
  ];

  return (
    <div
      className="wa-flank wa-align-items-stretch wa-gap-0"
      style={
        {
          minHeight: '100vh',
          '--flank-size': sidebarOpen ? '240px' : '56px',
        } as React.CSSProperties
      }
    >
      <nav
        className="wa-stack wa-gap-xs"
        style={{
          padding: sidebarOpen ? 'var(--wa-space-m)' : 'var(--wa-space-s)',
          backgroundColor: 'var(--wa-color-surface-lowered)',
          transition: 'var(--wa-transition-fast)',
          overflow: 'hidden',
        }}
        aria-label="Main navigation"
      >
        <div className="wa-split wa-align-items-center">
          {sidebarOpen && <strong className="wa-heading-s">My App</strong>}
          <Button
            variant="neutral"
            appearance="plain"
            size="small"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            <Icon name={sidebarOpen ? 'chevron-left' : 'chevron-right'} />
          </Button>
        </div>
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
            {sidebarOpen && item.label}
          </Button>
        ))}
      </nav>

      {/* Content area - use react-router's Outlet for routing:
          import { Outlet } from 'react-router-dom';
          Replace the <main> children with <Outlet /> */}
      <main
        className="wa-stack wa-gap-l"
        style={{ padding: 'var(--wa-space-l)', flex: 1 }}
      >
        {/* <Outlet /> -- uncomment when using react-router */}
        {children}
      </main>
    </div>
  );
}
```

### Vue

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { Button, Divider, Icon } from '@/components/ui';

defineProps<{ currentPage: string }>();
const emit = defineEmits<{ navigate: [page: string] }>();

const sidebarOpen = ref(true);

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: 'chart-line' },
  { id: 'users', label: 'Users', icon: 'users' },
  { id: 'settings', label: 'Settings', icon: 'gear' },
];
</script>

<template>
  <div
    class="wa-flank wa-align-items-stretch wa-gap-0"
    :style="{
      minHeight: '100vh',
      '--flank-size': sidebarOpen ? '240px' : '56px',
    }"
  >
    <nav
      class="wa-stack wa-gap-xs"
      :style="{
        padding: sidebarOpen ? 'var(--wa-space-m)' : 'var(--wa-space-s)',
        background: 'var(--wa-color-surface-lowered)',
        transition: 'var(--wa-transition-fast)',
        overflow: 'hidden',
      }"
      aria-label="Main navigation"
    >
      <div class="wa-split wa-align-items-center">
        <strong v-if="sidebarOpen" class="wa-heading-s">My App</strong>
        <Button
          variant="neutral"
          appearance="plain"
          size="small"
          :aria-label="sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'"
          @click="sidebarOpen = !sidebarOpen"
        >
          <Icon :name="sidebarOpen ? 'chevron-left' : 'chevron-right'" />
        </Button>
      </div>
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
        <span v-if="sidebarOpen">{{ item.label }}</span>
      </Button>
    </nav>

    <!-- Content area - use vue-router's RouterView for routing:
         import { RouterView } from 'vue-router';
         Replace <slot /> with <RouterView /> -->
    <main class="wa-stack wa-gap-l" style="padding: var(--wa-space-l); flex: 1">
      <!-- <RouterView /> -- uncomment when using vue-router -->
      <slot />
    </main>
  </div>
</template>
```

---

## B: Dashboard

App Shell + metric card grid + sections.

**Required components:** `npx kigumi add card icon format-number`

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
      <h1 className="wa-heading-xl">Dashboard</h1>

      <div
        className="wa-grid"
        style={{ '--min-column-size': '250px' } as React.CSSProperties}
      >
        {metrics.map((m) => (
          <Card key={m.label}>
            <div className="wa-split">
              <div className="wa-stack wa-gap-2xs">
                <span
                  className="wa-body-s"
                  style={{ color: 'var(--wa-color-text-quiet)' }}
                >
                  {m.label}
                </span>
                <strong className="wa-heading-l">
                  <FormatNumber
                    value={m.value}
                    type={m.type || 'decimal'}
                    currency={m.type === 'currency' ? 'USD' : undefined}
                  />
                </strong>
              </div>
              <Icon
                name={m.icon}
                style={{ fontSize: '2rem', color: 'var(--wa-color-brand)' }}
              />
            </div>
          </Card>
        ))}
      </div>

      <section className="wa-stack wa-gap-m">
        <h2 className="wa-heading-m">Recent Activity</h2>
        {/* Activity list here -- use kigumi-compose-data skill for data tables */}
      </section>
    </div>
  );
}
```

### Vue

```vue
<script setup lang="ts">
import { Card, FormatNumber, Icon } from '@/components/ui';

interface Metric {
  label: string;
  value: number;
  icon: string;
  type?: 'currency' | 'decimal' | 'percent';
}

defineProps<{ metrics: Metric[] }>();
</script>

<template>
  <div class="wa-stack wa-gap-l">
    <h1 class="wa-heading-xl">Dashboard</h1>

    <div class="wa-grid" style="--min-column-size: 250px">
      <Card v-for="m in metrics" :key="m.label">
        <div class="wa-split">
          <div class="wa-stack wa-gap-2xs">
            <span class="wa-body-s" style="color: var(--wa-color-text-quiet)">{{
              m.label
            }}</span>
            <strong class="wa-heading-l">
              <FormatNumber
                :value="m.value"
                :type="m.type || 'decimal'"
                :currency="m.type === 'currency' ? 'USD' : undefined"
              />
            </strong>
          </div>
          <Icon
            :name="m.icon"
            style="font-size: 2rem; color: var(--wa-color-brand)"
          />
        </div>
      </Card>
    </div>

    <section class="wa-stack wa-gap-m">
      <h2 class="wa-heading-m">Recent Activity</h2>
      <!-- Activity list here -- use kigumi-compose-data skill for data tables -->
    </section>
  </div>
</template>
```

---

## C: Settings Page

TabGroup + collapsible Details sections.

**Required components:** `npx kigumi add button details divider input option radio radio-group select switch tab tab-group tab-panel`

For grouped panels where only one (or a limited number) should be open at a time, use `Accordion` + `AccordionItem` instead of standalone `Details` sections (`npx kigumi add accordion accordion-item`). The accordion coordinates expand/collapse across its items; independent `Details` panels stay open until closed individually.

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
  <Tab slot="nav" panel="general">
    General
  </Tab>
  <Tab slot="nav" panel="security">
    Security
  </Tab>

  {/* Panels linked via name prop (must match panel above) */}
  <TabPanel name="general">General content</TabPanel>
  <TabPanel name="security">Security content</TabPanel>
</TabGroup>
```

**Common mistake:** Forgetting `slot="nav"` on Tab components, or mismatching `panel`/`name` strings.

### React

```tsx
import {
  Button,
  Details,
  Divider,
  Input,
  Option,
  Radio,
  RadioGroup,
  Select,
  Switch,
  Tab,
  TabGroup,
  TabPanel,
} from '@/components/ui';

export function SettingsPage() {
  return (
    <div className="wa-stack wa-gap-l" style={{ maxWidth: '800px' }}>
      <h1 className="wa-heading-xl">Settings</h1>
      <TabGroup>
        <Tab slot="nav" panel="general">
          General
        </Tab>
        <Tab slot="nav" panel="notifications">
          Notifications
        </Tab>
        <Tab slot="nav" panel="security">
          Security
        </Tab>

        <TabPanel name="general">
          <div className="wa-stack wa-gap-m">
            <Details summary="Profile" open>
              <div className="wa-stack wa-gap-m">
                <div
                  className="wa-grid"
                  style={
                    { '--min-column-size': '200px' } as React.CSSProperties
                  }
                >
                  <Input label="First name" name="firstName" />
                  <Input label="Last name" name="lastName" />
                </div>
                <Input label="Email" name="email" type="email" />
              </div>
            </Details>
            <Details summary="Preferences">
              <div className="wa-stack wa-gap-m">
                <Select label="Language">
                  <Option value="en">English</Option>
                  <Option value="de">Deutsch</Option>
                </Select>
                <RadioGroup label="Theme" value="system">
                  <Radio value="light">Light</Radio>
                  <Radio value="dark">Dark</Radio>
                  <Radio value="system">System</Radio>
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
          {/* Use kigumi-compose-form skill for validated form submission */}
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

### Vue

```vue
<script setup lang="ts">
import {
  Button,
  Details,
  Divider,
  Input,
  Option,
  Radio,
  RadioGroup,
  Select,
  Switch,
  Tab,
  TabGroup,
  TabPanel,
} from '@/components/ui';
</script>

<template>
  <div class="wa-stack wa-gap-l" style="max-width: 800px">
    <h1 class="wa-heading-xl">Settings</h1>
    <TabGroup>
      <Tab slot="nav" panel="general">General</Tab>
      <Tab slot="nav" panel="notifications">Notifications</Tab>
      <Tab slot="nav" panel="security">Security</Tab>

      <TabPanel name="general">
        <div class="wa-stack wa-gap-m">
          <Details summary="Profile" open>
            <div class="wa-stack wa-gap-m">
              <div class="wa-grid" style="--min-column-size: 200px">
                <Input label="First name" name="firstName" />
                <Input label="Last name" name="lastName" />
              </div>
              <Input label="Email" name="email" type="email" />
            </div>
          </Details>
          <Details summary="Preferences">
            <div class="wa-stack wa-gap-m">
              <Select label="Language">
                <Option value="en">English</Option>
                <Option value="de">Deutsch</Option>
              </Select>
              <RadioGroup label="Theme" value="system">
                <Radio value="light">Light</Radio>
                <Radio value="dark">Dark</Radio>
                <Radio value="system">System</Radio>
              </RadioGroup>
            </div>
          </Details>
        </div>
      </TabPanel>

      <TabPanel name="notifications">
        <div class="wa-stack wa-gap-m">
          <Switch checked>Email notifications</Switch>
          <Switch>Push notifications</Switch>
        </div>
      </TabPanel>

      <TabPanel name="security">
        <!-- Use kigumi-compose-form skill for validated form submission -->
        <div class="wa-stack wa-gap-m">
          <Input label="Current password" type="password" />
          <Input label="New password" type="password" />
          <Button variant="brand">Update password</Button>
        </div>
      </TabPanel>
    </TabGroup>
  </div>
</template>
```

---

## D: Marketing / Landing Page

Full-width sections stacked vertically. Hero uses `.wa-dark` for a dark section demo.

```
+------------------------------------------+
|  .wa-dark  Hero: .wa-split               |
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
    <div className="wa-stack wa-gap-0">
      {/* Hero -- .wa-dark inverts all --wa-color-* tokens in this section */}
      <section
        className="wa-dark wa-split"
        style={{
          padding: 'var(--wa-space-3xl) var(--wa-space-l)',
          alignItems: 'center',
          background: 'var(--wa-color-surface-default)',
        }}
      >
        <div className="wa-stack wa-gap-m" style={{ maxWidth: '500px' }}>
          <h1
            className="wa-heading-2xl"
            style={{ color: 'var(--wa-color-text-normal)' }}
          >
            Build faster with Kigumi
          </h1>
          <p
            className="wa-body-l"
            style={{ color: 'var(--wa-color-text-quiet)' }}
          >
            Ready-made Web Awesome components for React and Vue.
          </p>
          <div className="wa-cluster wa-gap-s">
            <Button variant="brand" size="large">
              Get Started
            </Button>
            <Button variant="neutral" size="large" appearance="outlined">
              View Docs
            </Button>
          </div>
        </div>
        <div
          className="wa-frame wa-frame:landscape"
          style={{ maxWidth: '500px' }}
        >
          <img src="/hero.png" alt="Product screenshot" />
        </div>
      </section>

      {/* Features */}
      <section
        className="wa-stack wa-gap-l"
        style={{ padding: 'var(--wa-space-2xl) var(--wa-space-l)' }}
      >
        <h2 className="wa-heading-xl" style={{ textAlign: 'center' }}>
          Features
        </h2>
        <div
          className="wa-grid"
          style={{ '--min-column-size': '280px' } as React.CSSProperties}
        >
          {['bolt', 'palette', 'universal-access'].map((icon) => (
            <Card key={icon}>
              <div
                className="wa-stack wa-gap-s wa-align-items-center"
                style={{ textAlign: 'center', padding: 'var(--wa-space-m)' }}
              >
                <Icon
                  name={icon}
                  style={{ fontSize: '2rem', color: 'var(--wa-color-brand)' }}
                />
                <strong className="wa-heading-s">Feature Title</strong>
                <p
                  className="wa-body-m"
                  style={{ color: 'var(--wa-color-text-quiet)' }}
                >
                  Feature description goes here.
                </p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA -- another .wa-dark section */}
      <section
        className="wa-dark"
        style={{
          padding: 'var(--wa-space-2xl) var(--wa-space-l)',
          background: 'var(--wa-color-surface-default)',
        }}
      >
        <div
          className="wa-stack wa-gap-m wa-align-items-center"
          style={{ textAlign: 'center' }}
        >
          <h2
            className="wa-heading-xl"
            style={{ color: 'var(--wa-color-text-normal)' }}
          >
            Ready to get started?
          </h2>
          <p
            className="wa-body-l"
            style={{ color: 'var(--wa-color-text-quiet)' }}
          >
            Join thousands of developers building with Kigumi.
          </p>
          <Button variant="brand" size="large">
            Get Started Free
          </Button>
        </div>
      </section>
    </div>
  );
}
```

### Vue

```vue
<script setup lang="ts">
import { Button, Card, Icon } from '@/components/ui';

const features = [
  {
    icon: 'bolt',
    title: 'Fast',
    description: 'CLI generates components in seconds.',
  },
  {
    icon: 'palette',
    title: 'Themeable',
    description: 'CSS custom properties for full control.',
  },
  {
    icon: 'universal-access',
    title: 'Accessible',
    description: 'WCAG 2.1 AA built into every component.',
  },
];
</script>

<template>
  <div class="wa-stack wa-gap-0">
    <!-- Hero -- .wa-dark inverts all --wa-color-* tokens in this section -->
    <section
      class="wa-dark wa-split"
      style="padding: var(--wa-space-3xl) var(--wa-space-l); align-items: center; background: var(--wa-color-surface-default)"
    >
      <div class="wa-stack wa-gap-m" style="max-width: 500px">
        <h1 class="wa-heading-2xl" style="color: var(--wa-color-text-normal)">
          Build faster with Kigumi
        </h1>
        <p class="wa-body-l" style="color: var(--wa-color-text-quiet)">
          Ready-made Web Awesome components for React and Vue.
        </p>
        <div class="wa-cluster wa-gap-s">
          <Button variant="brand" size="large">Get Started</Button>
          <Button variant="neutral" size="large" appearance="outlined"
            >View Docs</Button
          >
        </div>
      </div>
      <div class="wa-frame wa-frame:landscape" style="max-width: 500px">
        <img src="/hero.png" alt="Product screenshot" />
      </div>
    </section>

    <!-- Features -->
    <section
      class="wa-stack wa-gap-l"
      style="padding: var(--wa-space-2xl) var(--wa-space-l)"
    >
      <h2 class="wa-heading-xl" style="text-align: center">Features</h2>
      <div class="wa-grid" style="--min-column-size: 280px">
        <Card v-for="f in features" :key="f.icon">
          <div
            class="wa-stack wa-gap-s wa-align-items-center"
            style="text-align: center; padding: var(--wa-space-m)"
          >
            <Icon
              :name="f.icon"
              style="font-size: 2rem; color: var(--wa-color-brand)"
            />
            <strong class="wa-heading-s">{{ f.title }}</strong>
            <p class="wa-body-m" style="color: var(--wa-color-text-quiet)">
              {{ f.description }}
            </p>
          </div>
        </Card>
      </div>
    </section>

    <!-- CTA -- another .wa-dark section -->
    <section
      class="wa-dark"
      style="padding: var(--wa-space-2xl) var(--wa-space-l); background: var(--wa-color-surface-default)"
    >
      <div
        class="wa-stack wa-gap-m wa-align-items-center"
        style="text-align: center"
      >
        <h2 class="wa-heading-xl" style="color: var(--wa-color-text-normal)">
          Ready to get started?
        </h2>
        <p class="wa-body-l" style="color: var(--wa-color-text-quiet)">
          Join thousands of developers building with Kigumi.
        </p>
        <Button variant="brand" size="large">Get Started Free</Button>
      </div>
    </section>
  </div>
</template>
```

---

## E: Data Browser

Filters sidebar + data content area.

**Required components:** `npx kigumi add button checkbox divider input slider tab tab-group tab-panel`

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
import {
  Button,
  Checkbox,
  Divider,
  Input,
  Slider,
  Tab,
  TabGroup,
  TabPanel,
} from '@/components/ui';

export function DataBrowser() {
  return (
    <div
      className="wa-flank wa-gap-l"
      style={{ '--flank-size': '260px' } as React.CSSProperties}
    >
      {/* Filters sidebar */}
      <aside className="wa-stack wa-gap-m" aria-label="Filters">
        <h2 className="wa-heading-s">Filters</h2>
        <Input label="Search" type="search" with-clear />
        <Divider />
        <fieldset className="wa-stack wa-gap-xs">
          <legend className="wa-body-s wa-font-weight-semibold">
            Category
          </legend>
          <Checkbox checked>Electronics</Checkbox>
          <Checkbox checked>Clothing</Checkbox>
          <Checkbox>Books</Checkbox>
        </fieldset>
        <Divider />
        <Slider label="Max price" min={0} max={1000} value={500} with-tooltip />
        <Button variant="brand" size="small" style={{ width: '100%' }}>
          Apply Filters
        </Button>
      </aside>

      {/* Content area -- use kigumi-compose-data skill for data tables */}
      <main className="wa-stack wa-gap-m">
        <h1 className="wa-heading-xl">Products</h1>
        <TabGroup>
          <Tab slot="nav" panel="list">
            List
          </Tab>
          <Tab slot="nav" panel="grid">
            Grid
          </Tab>
          <TabPanel name="list">
            {/* Data table or list here */}
            <p className="wa-body-m">Data table goes here</p>
          </TabPanel>
          <TabPanel name="grid">
            <div
              className="wa-grid"
              style={{ '--min-column-size': '200px' } as React.CSSProperties}
            >
              {/* Grid cards here */}
            </div>
          </TabPanel>
        </TabGroup>
      </main>
    </div>
  );
}
```

### Vue

```vue
<script setup lang="ts">
import {
  Button,
  Checkbox,
  Divider,
  Input,
  Slider,
  Tab,
  TabGroup,
  TabPanel,
} from '@/components/ui';
</script>

<template>
  <div class="wa-flank wa-gap-l" style="--flank-size: 260px">
    <!-- Filters sidebar -->
    <aside class="wa-stack wa-gap-m" aria-label="Filters">
      <h2 class="wa-heading-s">Filters</h2>
      <Input label="Search" type="search" with-clear />
      <Divider />
      <fieldset class="wa-stack wa-gap-xs">
        <legend class="wa-body-s wa-font-weight-semibold">Category</legend>
        <Checkbox checked>Electronics</Checkbox>
        <Checkbox checked>Clothing</Checkbox>
        <Checkbox>Books</Checkbox>
      </fieldset>
      <Divider />
      <Slider
        label="Max price"
        :min="0"
        :max="1000"
        :value="500"
        with-tooltip
      />
      <Button variant="brand" size="small" style="width: 100%"
        >Apply Filters</Button
      >
    </aside>

    <!-- Content area -- use kigumi-compose-data skill for data tables -->
    <main class="wa-stack wa-gap-m">
      <h1 class="wa-heading-xl">Products</h1>
      <TabGroup>
        <Tab slot="nav" panel="list">List</Tab>
        <Tab slot="nav" panel="grid">Grid</Tab>
        <TabPanel name="list">
          <p class="wa-body-m">Data table goes here</p>
        </TabPanel>
        <TabPanel name="grid">
          <div class="wa-grid" style="--min-column-size: 200px">
            <!-- Grid cards here -->
          </div>
        </TabPanel>
      </TabGroup>
    </main>
  </div>
</template>
```

---

## F: Page Shell (Pro)

Full-page layout using the `<Page>` component (Pro tier). Provides header, navigation (with automatic mobile hamburger), and main content slots. **This is the recommended approach for Pro users building app shells and dashboards.**

**Required components:** `npx kigumi add page avatar button divider icon`

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
      <div
        slot="header"
        className="wa-split wa-align-items-center"
        style={{ padding: 'var(--wa-space-s) var(--wa-space-m)' }}
      >
        <strong className="wa-heading-s">My App</strong>
        <div className="wa-cluster wa-gap-s wa-align-items-center">
          <Button variant="neutral" appearance="plain" size="small">
            Docs
          </Button>
          <Avatar initials="M" shape="circle" />
        </div>
      </div>

      {/* Navigation slot -- auto hamburger on mobile */}
      <nav
        slot="navigation"
        className="wa-stack wa-gap-xs"
        style={{ padding: 'var(--wa-space-m)' }}
      >
        <Button
          variant="brand"
          appearance="plain"
          style={{ justifyContent: 'flex-start' }}
        >
          <Icon slot="start" name="house" />
          Dashboard
        </Button>
        <Button
          variant="neutral"
          appearance="plain"
          style={{ justifyContent: 'flex-start' }}
        >
          <Icon slot="start" name="users" />
          Users
        </Button>
        <Button
          variant="neutral"
          appearance="plain"
          style={{ justifyContent: 'flex-start' }}
        >
          <Icon slot="start" name="gear" />
          Settings
        </Button>
      </nav>

      {/* Default slot -> main content */}
      {/* Use react-router's Outlet for routing:
          import { Outlet } from 'react-router-dom';
          Replace {children} with <Outlet /> */}
      {children}

      {/* Footer slot */}
      <div
        slot="footer"
        className="wa-split wa-align-items-center"
        style={{ padding: 'var(--wa-space-s) var(--wa-space-m)' }}
      >
        <small style={{ color: 'var(--wa-color-text-quiet)' }}>
          2026 My App
        </small>
        <div className="wa-cluster wa-gap-s">
          <a href="/privacy" className="wa-link">
            Privacy
          </a>
          <a href="/terms" className="wa-link">
            Terms
          </a>
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
    <div
      slot="header"
      class="wa-split wa-align-items-center"
      style="padding: var(--wa-space-s) var(--wa-space-m)"
    >
      <strong class="wa-heading-s">My App</strong>
      <div class="wa-cluster wa-gap-s wa-align-items-center">
        <Button variant="neutral" appearance="plain" size="small">Docs</Button>
        <Avatar initials="M" shape="circle" />
      </div>
    </div>

    <nav
      slot="navigation"
      class="wa-stack wa-gap-xs"
      style="padding: var(--wa-space-m)"
    >
      <Button
        variant="brand"
        appearance="plain"
        style="justify-content: flex-start"
      >
        <Icon slot="start" name="house" />Dashboard
      </Button>
      <Button
        variant="neutral"
        appearance="plain"
        style="justify-content: flex-start"
      >
        <Icon slot="start" name="users" />Users
      </Button>
      <Button
        variant="neutral"
        appearance="plain"
        style="justify-content: flex-start"
      >
        <Icon slot="start" name="gear" />Settings
      </Button>
    </nav>

    <!-- Use vue-router's RouterView for routing:
         Replace <slot /> with <RouterView /> -->
    <slot />

    <div
      slot="footer"
      class="wa-split wa-align-items-center"
      style="padding: var(--wa-space-s) var(--wa-space-m)"
    >
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

| Prop                        | Default | Purpose                                         |
| --------------------------- | ------- | ----------------------------------------------- |
| `mobile-breakpoint`         | `768px` | Viewport width for mobile/desktop switch        |
| `disable-navigation-toggle` | `false` | Hide built-in hamburger (use for custom toggle) |
| `navigation-placement`      | `start` | Navigation drawer position (`start` or `end`)   |
| `nav-open`                  | `false` | Programmatic control of mobile nav drawer       |

### Slot Reference

| Slot         | Element                   | Purpose                            |
| ------------ | ------------------------- | ---------------------------------- |
| `header`     | `<div slot="header">`     | Top bar (logo, user menu)          |
| `navigation` | `<nav slot="navigation">` | Mobile drawer nav (auto hamburger) |
| `footer`     | `<div slot="footer">`     | Page footer                        |
| (default)    | children                  | Main content area                  |
