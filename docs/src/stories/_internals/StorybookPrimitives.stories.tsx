import type { Meta, StoryObj } from '@storybook/react-vite';
import { TokenTable } from '@/components/storybook/TokenTable';
import { ColorSwatch } from '@/components/storybook/ColorSwatch';
import { SpaceSample } from '@/components/storybook/SpaceSample';
import { TypeSample } from '@/components/storybook/TypeSample';
import { RadiusSample } from '@/components/storybook/RadiusSample';
import { ShadowSample } from '@/components/storybook/ShadowSample';
import { MotionSample } from '@/components/storybook/MotionSample';
import { Preview } from '@/components/storybook/Preview';

const meta: Meta = {
  title: 'Internals/Storybook Primitives',
  tags: ['!dev', '!autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj;

export const ColorSwatchExample: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem' }}>
      <ColorSwatch token="--wa-color-brand-fill-loud" label="brand loud" />
      <ColorSwatch token="--wa-color-success-fill-loud" label="success" />
      <ColorSwatch token="--wa-color-danger-fill-loud" label="danger" />
    </div>
  ),
};

export const SpaceSampleExample: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <SpaceSample token="--wa-space-xs" />
      <SpaceSample token="--wa-space-s" />
      <SpaceSample token="--wa-space-m" />
      <SpaceSample token="--wa-space-l" />
      <SpaceSample token="--wa-space-xl" />
    </div>
  ),
};

export const TypeSampleExample: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <TypeSample family="--wa-font-family-body" size="--wa-font-size-m">
        Body medium sample text
      </TypeSample>
      <TypeSample
        family="--wa-font-family-heading"
        size="--wa-font-size-2xl"
        weight="--wa-font-weight-bold"
      >
        Heading 2XL bold
      </TypeSample>
      <TypeSample family="--wa-font-family-code" size="--wa-font-size-s">
        Code small
      </TypeSample>
    </div>
  ),
};

export const RadiusSampleExample: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem' }}>
      <RadiusSample token="--wa-border-radius-square" />
      <RadiusSample token="--wa-border-radius-s" />
      <RadiusSample token="--wa-border-radius-m" />
      <RadiusSample token="--wa-border-radius-l" />
      <RadiusSample token="--wa-border-radius-pill" />
      <RadiusSample token="--wa-border-radius-circle" />
    </div>
  ),
};

export const ShadowSampleExample: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '2rem', padding: '1rem' }}>
      <ShadowSample token="--wa-shadow-s" />
      <ShadowSample token="--wa-shadow-m" />
      <ShadowSample token="--wa-shadow-l" />
    </div>
  ),
};

export const MotionSampleExample: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem' }}>
      <MotionSample token="--wa-transition-fast" />
      <MotionSample token="--wa-transition-normal" />
      <MotionSample token="--wa-transition-slow" />
    </div>
  ),
};

export const TokenTableComposed: Story = {
  render: () => (
    <TokenTable
      showDescription
      rows={[
        {
          name: '--wa-space-s',
          value: '0.75rem (12px)',
          description: 'Small spacing step',
          preview: <SpaceSample token="--wa-space-s" />,
        },
        {
          name: '--wa-space-m',
          value: '1rem (16px)',
          description: 'Medium (base) spacing',
          preview: <SpaceSample token="--wa-space-m" />,
        },
        {
          name: '--wa-space-l',
          value: '1.5rem (24px)',
          description: 'Large spacing step',
          preview: <SpaceSample token="--wa-space-l" />,
        },
      ]}
    />
  ),
};

export const PreviewExample: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Preview>
        <ColorSwatch token="--wa-color-brand-fill-loud" label="brand loud" />
      </Preview>
      <Preview label="Surface tokens" tone="muted">
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <ColorSwatch token="--wa-color-surface-default" label="default" />
          <ColorSwatch token="--wa-color-surface-raised" label="raised" />
          <ColorSwatch token="--wa-color-surface-lowered" label="lowered" />
        </div>
      </Preview>
    </div>
  ),
};
