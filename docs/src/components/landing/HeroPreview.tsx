import React from 'react';
import { useFrameworkSync } from '@/hooks/useFrameworkSync';
import {
  Badge,
  Button,
  Card,
  Checkbox,
  Comparison,
  Input,
  Option,
  Radio,
  RadioGroup,
  Select,
  Tab,
  TabGroup,
  TabPanel,
} from '@/components/ui';
import reactLogo from '@/assets/react-logo.svg';
import vueLogo from '@/assets/vuejs-logo.svg';
import angularLogo from '@/assets/angular-logo.svg';
import svelteLogo from '@/assets/svelte-logo.svg';

function ExampleCard() {
  return (
    <div style={{ width: '100%', maxWidth: '300px' }}>
      <Card with-header with-footer>
        <div slot="header">
          <h3 className="wa-heading-m">New project</h3>
        </div>
        <div className="wa-stack wa-gap-l">
          <Input label="Project name" placeholder="my-kigumi-project" />
          <Select label="Framework" value="react">
            <Option value="none">None</Option>
            <Option value="react">React</Option>
            <Option value="vue">Vue</Option>
            <Option value="angular">Angular</Option>
            <Option value="svelte">Svelte</Option>
          </Select>
          <RadioGroup
            label="Visibility"
            value="public"
            orientation="horizontal"
          >
            <Radio value="public" appearance="button">
              Public
            </Radio>
            <Radio value="private" appearance="button">
              Private
            </Radio>
          </RadioGroup>
          <Checkbox checked>Initialize with README</Checkbox>
        </div>
        <div
          slot="footer"
          className="wa-cluster wa-justify-content-end wa-gap-s"
        >
          <Button variant="neutral" appearance="outlined" size="medium">
            Cancel
          </Button>
          <Button variant="brand" size="medium">
            Create
          </Button>
        </div>
      </Card>
    </div>
  );
}

const reactCode = `import {
  Button, Card, Checkbox, Input, Option,
  Radio, RadioGroup, Select,
} from '@/components/ui'

export function NewProjectCard() {
  return (
    <Card with-header with-footer>
      <div slot="header">
        <h3 className="wa-heading-m">New project</h3>
      </div>
      <div className="wa-stack wa-gap-l">
        <Input label="Project name" placeholder="my-kigumi-project" />
        <Select label="Framework" value="react">
          <Option value="none">None</Option>
          <Option value="react">React</Option>
          <Option value="vue">Vue</Option>
          <Option value="angular">Angular</Option>
          <Option value="svelte">Svelte</Option>
        </Select>
        <RadioGroup label="Visibility" value="public" orientation="horizontal">
          <Radio value="public" appearance="button">Public</Radio>
          <Radio value="private" appearance="button">Private</Radio>
        </RadioGroup>
        <Checkbox checked>Initialize with README</Checkbox>
      </div>
      <div slot="footer" className="wa-cluster wa-justify-content-end wa-gap-s">
        <Button variant="default" size="medium">Cancel</Button>
        <Button variant="brand" size="medium">Create</Button>
      </div>
    </Card>
  )
}`;

const vueCode = `<script setup>
import {
  Button, Card, Checkbox, Input, Option,
  Radio, RadioGroup, Select,
} from '@/components/ui'
</script>

<template>
  <Card with-header with-footer>
    <div slot="header">
      <h3 class="wa-heading-m">New project</h3>
    </div>
    <div class="wa-stack wa-gap-l">
      <Input label="Project name" placeholder="my-kigumi-project" />
      <Select label="Framework" value="react">
        <Option value="none">None</Option>
        <Option value="react">React</Option>
        <Option value="vue">Vue</Option>
        <Option value="angular">Angular</Option>
        <Option value="svelte">Svelte</Option>
      </Select>
      <RadioGroup label="Visibility" value="public" orientation="horizontal">
        <Radio value="public" appearance="button">Public</Radio>
        <Radio value="private" appearance="button">Private</Radio>
      </RadioGroup>
      <Checkbox checked>Initialize with README</Checkbox>
    </div>
    <div slot="footer" class="wa-cluster wa-justify-content-end wa-gap-s">
      <Button variant="default" size="medium">Cancel</Button>
      <Button variant="brand" size="medium">Create</Button>
    </div>
  </Card>
</template>`;

const angularCode = `import { Component } from '@angular/core';
import {
  ButtonComponent, CardComponent, CheckboxComponent,
  InputComponent, OptionComponent, RadioComponent,
  RadioGroupComponent, SelectComponent,
} from '@/components/ui';

@Component({
  selector: 'app-new-project',
  standalone: true,
  imports: [
    ButtonComponent, CardComponent, CheckboxComponent,
    InputComponent, OptionComponent, RadioComponent,
    RadioGroupComponent, SelectComponent,
  ],
  template: \`
    <k-card [withHeader]="true" [withFooter]="true">
      <div slot="header">
        <h3 class="wa-heading-m">New project</h3>
      </div>
      <div class="wa-stack wa-gap-l">
        <k-input label="Project name" placeholder="my-kigumi-project" />
        <k-select label="Framework" value="react">
          <k-option value="none">None</k-option>
          <k-option value="react">React</k-option>
          <k-option value="vue">Vue</k-option>
          <k-option value="angular">Angular</k-option>
          <k-option value="svelte">Svelte</k-option>
        </k-select>
        <k-radio-group label="Visibility" value="public" orientation="horizontal">
          <k-radio value="public" appearance="button">Public</k-radio>
          <k-radio value="private" appearance="button">Private</k-radio>
        </k-radio-group>
        <k-checkbox [checked]="true">Initialize with README</k-checkbox>
      </div>
      <div slot="footer" class="wa-cluster wa-justify-content-end wa-gap-s">
        <k-button variant="neutral" appearance="outlined" size="medium">Cancel</k-button>
        <k-button variant="brand" size="medium">Create</k-button>
      </div>
    </k-card>
  \`,
})
export class NewProjectComponent {}`;

type Token = {
  type: 'keyword' | 'tag' | 'attr' | 'string' | 'punct' | 'text';
  value: string;
};

function tokenize(code: string): Token[] {
  const tokens: Token[] = [];
  const re =
    /(\b(?:import|export|function|return|from|const|let)\b)|(<\/?[A-Za-z][A-Za-z0-9]*)|(\b[a-zA-Z-]+(?==))|("[^"]*"|'[^']*'|`[^`]*`)|([{}()=<>/;,])|([^<>"'`{}()=;,\s]+|\s+)/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(code)) !== null) {
    if (match[1]) tokens.push({ type: 'keyword', value: match[1] });
    else if (match[2]) tokens.push({ type: 'tag', value: match[2] });
    else if (match[3]) tokens.push({ type: 'attr', value: match[3] });
    else if (match[4]) tokens.push({ type: 'string', value: match[4] });
    else if (match[5]) tokens.push({ type: 'punct', value: match[5] });
    else if (match[6]) tokens.push({ type: 'text', value: match[6] });
  }
  return tokens;
}

const tokenColors: Record<Token['type'], string> = {
  keyword: 'var(--code-keyword)',
  tag: 'var(--code-tag)',
  attr: 'var(--code-attr)',
  string: 'var(--code-string)',
  punct: 'var(--code-punct)',
  text: 'var(--code-text)',
};

function HighlightedCode({ code }: { code: string }) {
  const tokens = tokenize(code);
  return (
    <>
      {tokens.map((t, i) => (
        <span key={i} style={{ color: tokenColors[t.type] }}>
          {t.value}
        </span>
      ))}
    </>
  );
}

const renderedStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 'var(--wa-space-l)',
  boxSizing: 'border-box',
  backgroundColor: 'var(--wa-color-surface-raised)',
  isolation: 'isolate',
  contain: 'paint',
};

const codeStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  backgroundColor: 'var(--wa-color-surface-raised)',
  isolation: 'isolate',
  overflow: 'auto',
};

function PreviewPanel({ code }: { code: string }) {
  return (
    <Comparison position={45} style={{ height: '480px' }}>
      <div slot="before" style={renderedStyle}>
        <ExampleCard />
      </div>
      <div slot="after" style={codeStyle}>
        <pre className="hero-preview__pre">
          <code>
            <HighlightedCode code={code} />
          </code>
        </pre>
      </div>
    </Comparison>
  );
}

export function HeroPreview() {
  const [framework, setFramework] = useFrameworkSync();

  return (
    <div
      className="hero-preview"
      style={{
        border: `var(--wa-border-width-s) solid var(--wa-color-surface-border)`,
        borderRadius: 'var(--wa-border-radius-m)',
        overflow: 'hidden',
      }}
    >
      <TabGroup
        activation="auto"
        active={framework}
        onTabShow={(e: CustomEvent) => {
          const name = e.detail.name;
          if (name === 'react' || name === 'vue' || name === 'angular') {
            setFramework(name);
          }
        }}
      >
        <Tab panel="react">
          <span className="wa-span-grid wa-justify-content-center wa-align-items-center wa-gap-xs">
            <img
              src={reactLogo}
              alt="React"
              style={{ width: '16px', height: '16px' }}
            />
            React
          </span>
        </Tab>
        <Tab panel="vue">
          <span className="wa-span-grid wa-justify-content-center wa-align-items-center wa-gap-xs">
            <img
              src={vueLogo}
              alt="Vue"
              style={{ width: '16px', height: '16px' }}
            />
            Vue
          </span>
        </Tab>
        <Tab panel="angular">
          <span className="wa-span-grid wa-justify-content-center wa-align-items-center wa-gap-xs">
            <img
              src={angularLogo}
              alt="Angular"
              style={{ width: '16px', height: '16px' }}
            />
            Angular
          </span>
        </Tab>
        <Tab panel="svelte" disabled>
          <span className="wa-span-grid wa-justify-content-center wa-align-items-center wa-gap-xs">
            <img
              src={svelteLogo}
              alt="Svelte"
              style={{ width: '16px', height: '16px' }}
            />
            Svelte
            <Badge appearance="outlined" variant="neutral" pill>
              Coming soon
            </Badge>
          </span>
        </Tab>

        <TabPanel
          name="react"
          style={{ '--padding': '0' } as React.CSSProperties}
        >
          <PreviewPanel code={reactCode} />
        </TabPanel>
        <TabPanel
          name="vue"
          style={{ '--padding': '0' } as React.CSSProperties}
        >
          <PreviewPanel code={vueCode} />
        </TabPanel>
        <TabPanel
          name="angular"
          style={{ '--padding': '0' } as React.CSSProperties}
        >
          <PreviewPanel code={angularCode} />
        </TabPanel>
      </TabGroup>
    </div>
  );
}
