import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/vue';
import Icon from './Icon.vue';

describe('Icon', () => {
  it('renders without crashing', () => {
    const { container } = render(Icon);
    expect(container.querySelector('wa-icon')).toBeTruthy();
  });
});
