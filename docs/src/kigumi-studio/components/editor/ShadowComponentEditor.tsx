import React, { useEffect, useRef, useState } from 'react';
import {
  SHADOW_COMPONENTS,
  SHADOW_CATEGORIES,
} from '../../lib/shadow-components';
import { useStudio } from '../../contexts/StudioContext';
import '@awesome.me/webawesome-pro/dist/components/combobox/combobox.js';
import '@awesome.me/webawesome-pro/dist/components/option/option.js';
import './ShadowComponentEditor.css';

export function ShadowComponentEditor() {
  const { shadowComponents, setShadowComponents } = useStudio();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  const previousValueRef = useRef<string[]>(shadowComponents);

  // Wait for the Web Component to be defined
  useEffect(() => {
    const checkReady = async () => {
      await customElements.whenDefined('wa-combobox');
      setIsReady(true);
    };
    checkReady();
  }, []);

  // Safety net: verify state when menu closes
  const handleMenuClose = () => {
    // Small delay to let any pending events fire first
    setTimeout(() => {
      const container = containerRef.current;
      if (!container) return;

      const combobox = container.querySelector('wa-combobox') as HTMLElement & {
        value?: string[];
      };
      if (!combobox) return;

      // Verify state matches combobox value
      const currentValue = Array.isArray(combobox.value)
        ? combobox.value.filter(Boolean)
        : [];

      const prevSorted = [...shadowComponents].sort().join(',');
      const newSorted = [...currentValue].sort().join(',');

      if (prevSorted !== newSorted) {
        // Missed event detected, sync state
        setShadowComponents(currentValue);
      }
    }, 50);
  };

  // Attach event listener once ready
  useEffect(() => {
    if (!isReady) return;

    const container = containerRef.current;
    if (!container) return;

    const combobox = container.querySelector('wa-combobox');
    if (!combobox) return;

    const handleChange = (e: Event) => {
      const target = e.target as HTMLElement & { value?: string | string[] };
      if (!target) return;

      // Normalize value (handle both string and string[])
      const val = target.value;
      let newValue: string[];

      if (Array.isArray(val)) {
        newValue = val.filter(Boolean);
      } else if (typeof val === 'string') {
        newValue = val.split(',').filter(Boolean);
      } else {
        newValue = [];
      }

      // Deduplication: only update if value actually changed
      const prevSorted = [...previousValueRef.current].sort().join(',');
      const newSorted = [...newValue].sort().join(',');

      if (prevSorted === newSorted) {
        return; // No actual change, skip update
      }

      previousValueRef.current = newValue;
      setShadowComponents(newValue);
    };

    // Attach multiple event listeners for cross-browser reliability
    combobox.addEventListener('change', handleChange); // Native event (primary)
    combobox.addEventListener('input', handleChange); // Immediate feedback
    combobox.addEventListener('wa-change', handleChange); // Web Awesome custom event
    combobox.addEventListener('wa-hide', handleMenuClose); // Safety net when menu closes

    return () => {
      combobox.removeEventListener('change', handleChange);
      combobox.removeEventListener('input', handleChange);
      combobox.removeEventListener('wa-change', handleChange);
      combobox.removeEventListener('wa-hide', handleMenuClose);
    };
  }, [isReady, setShadowComponents, shadowComponents]);

  // Sync combobox value when shadowComponents changes
  useEffect(() => {
    if (!isReady) return;

    const container = containerRef.current;
    if (!container) return;

    const combobox = container.querySelector('wa-combobox') as HTMLElement & {
      value?: string[];
    };
    if (!combobox) return;

    // Only update if different to avoid loops
    const currentValue = combobox.value ?? [];
    const isSame =
      Array.isArray(currentValue) &&
      currentValue.length === shadowComponents.length &&
      currentValue.every((v, i) => v === shadowComponents[i]);

    if (!isSame) {
      combobox.value = shadowComponents;
      previousValueRef.current = shadowComponents; // Keep ref in sync with React state
    }
  }, [isReady, shadowComponents]);

  const selectedCount = shadowComponents.length;

  return (
    <div className="shadow-component-editor" ref={containerRef}>
      <div className="shadow-component-editor__header">
        <span className="shadow-component-editor__label">
          Apply shadows to components
        </span>
        {selectedCount > 0 && (
          <span className="shadow-component-editor__count">
            {selectedCount} selected
          </span>
        )}
      </div>

      <wa-combobox
        class="shadow-component-editor__combobox"
        multiple
        placeholder="Select components..."
        max-options-visible={8}
      >
        {SHADOW_CATEGORIES.map((category) => {
          const componentsInCategory = SHADOW_COMPONENTS.filter(
            (c) => c.category === category
          );
          return (
            <React.Fragment key={category}>
              <wa-option disabled class="shadow-component-editor__category">
                {category}
              </wa-option>
              {componentsInCategory.map((comp) => (
                <wa-option key={comp.className} value={comp.className}>
                  {comp.name}
                </wa-option>
              ))}
            </React.Fragment>
          );
        })}
      </wa-combobox>

      <p className="shadow-component-editor__hint">
        Selected components will receive{' '}
        <code>box-shadow: var(--wa-shadow-m)</code> in the exported CSS.
      </p>

      {selectedCount > 0 && (
        <div className="shadow-component-editor__preview">
          <span className="shadow-component-editor__preview-label">
            Preview classes:
          </span>
          <code className="shadow-component-editor__preview-code">
            {shadowComponents.map((c) => `.${c}`).join(', ')}
          </code>
        </div>
      )}
    </div>
  );
}
