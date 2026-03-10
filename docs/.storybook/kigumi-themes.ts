import { create } from 'storybook/theming';

/**
 * Kigumi Storybook themes — tailspin + rudimentary palette + purple brand.
 * Matches the Kigumi docs page look and feel.
 */

export const kigumiLight = create({
  base: 'light',
  brandTitle: 'Kigumi | Docs',
  brandUrl: 'https://kigumi.style',
  brandImage: '/logo-on-light.svg',
  brandTarget: '_blank',

  colorPrimary: '#9952db',
  colorSecondary: '#9952db',

  appBg: '#ffffff',
  appContentBg: '#ffffff',
  appPreviewBg: '#f9fafb',
  appBorderColor: 'rgb(228, 229, 233)',

  textColor: '#1b1d26',
  textInverseColor: '#ffffff',
  textMutedColor: '#6b7280',

  buttonBg: 'white',
  buttonBorder: '#8b5cf6',

  inputBorderRadius: 255,
});

export const kigumiDark = create({
  base: 'dark',
  brandTitle: 'Kigumi | Docs',
  brandUrl: 'https://kigumi.style',
  brandImage: '/logo-on-dark.svg',
  brandTarget: '_blank',

  colorPrimary: 'red',
  colorSecondary: '#9952db',

  appBg: '#101219',
  appContentBg: '#101219',
  appPreviewBg: '#101219',
  appBorderColor: 'rgb(47, 50, 63)',
  appBorderRadius: 8,

  textColor: '#fff',
  textInverseColor: '#fff',
  textMutedColor: 'rgb(145, 148, 162)',

  barTextColor: '#9952db',
  barHoverColor: '#9952db',
  barSelectedColor: '#9952db',
  barBg: '#101219',

  buttonBg: '#9952db',
  buttonBorder: '#9952db',

  inputBg: '#101219',
  inputBorder: 'rgba(118, 118, 118, 0)',
  inputTextColor: '#f2f2f2',
  inputBorderRadius: 255,
});
