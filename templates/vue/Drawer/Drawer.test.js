import { describe, it, expect } from 'vitest';
import { mount } from '@testing-library/vue';
import Drawer from './Drawer.vue';

describe('Drawer', () => {
  it('renders without crashing', () => {
    const { container } = mount(Drawer);
    expect(container.querySelector('wa-drawer')).toBeTruthy();
  });
});
