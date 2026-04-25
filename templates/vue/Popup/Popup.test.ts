import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/vue';
import Popup from './Popup.vue';

describe('Popup', () => {
  it('renders without crashing', () => {
    const { container } = render(Popup);
    expect(container.querySelector('wa-popup')).toBeTruthy();
  });
});
