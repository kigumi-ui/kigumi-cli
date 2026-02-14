import React, { useEffect, useRef } from 'react';
import {
  SHADOW_COMPONENTS,
  SHADOW_CATEGORIES,
} from '../../lib/shadow-components';
import { useStudio } from '../../contexts/StudioContext';
import { Combobox, Option } from '@/components/ui';
import type { ComboboxRef } from '@/components/ui';
import './ShadowComponentEditor.css';

type ComboboxElement = HTMLElement & { value?: string[] };

export function ShadowComponentEditor() {
  const { shadowComponents, setShadowComponents } = useStudio();
  const comboboxRef = useRef<ComboboxRef>(null);
  const previousValueRef = useRef<string[]>(shadowComponents);

  const handleMenuClose = () => {
    setTimeout(() => {
      const el = comboboxRef.current?.element as ComboboxElement | null;
      if (!el) return;

      const currentValue = Array.isArray(el.value)
        ? el.value.filter(Boolean)
        : [];

      const prevSorted = [...shadowComponents].sort().join(',');
      const newSorted = [...currentValue].sort().join(',');

      if (prevSorted !== newSorted) {
        setShadowComponents(currentValue);
      }
    }, 50);
  };

  useEffect(() => {
    const el = comboboxRef.current?.element;
    if (!el) return;

    const handleChange = (e: Event) => {
      const target = e.target as HTMLElement & { value?: string | string[] };
      if (!target) return;

      const val = target.value;
      let newValue: string[];

      if (Array.isArray(val)) {
        newValue = val.filter(Boolean);
      } else if (typeof val === 'string') {
        newValue = val.split(',').filter(Boolean);
      } else {
        newValue = [];
      }

      const prevSorted = [...previousValueRef.current].sort().join(',');
      const newSorted = [...newValue].sort().join(',');

      if (prevSorted === newSorted) {
        return;
      }

      previousValueRef.current = newValue;
      setShadowComponents(newValue);
    };

    el.addEventListener('change', handleChange);
    el.addEventListener('input', handleChange);
    el.addEventListener('wa-change', handleChange);
    el.addEventListener('wa-hide', handleMenuClose);

    return () => {
      el.removeEventListener('change', handleChange);
      el.removeEventListener('input', handleChange);
      el.removeEventListener('wa-change', handleChange);
      el.removeEventListener('wa-hide', handleMenuClose);
    };
  }, [setShadowComponents, shadowComponents]);

  useEffect(() => {
    const el = comboboxRef.current?.element as ComboboxElement | null;
    if (!el) return;

    const currentValue = el.value ?? [];
    const isSame =
      Array.isArray(currentValue) &&
      currentValue.length === shadowComponents.length &&
      currentValue.every((v, i) => v === shadowComponents[i]);

    if (!isSame) {
      el.value = shadowComponents;
      previousValueRef.current = shadowComponents;
    }
  }, [shadowComponents]);

  const selectedCount = shadowComponents.length;

  return (
    <div className="shadow-component-editor">
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

      <Combobox
        ref={comboboxRef}
        multiple
        value={shadowComponents}
        placeholder="Select components..."
        max-options-visible={8}
        className="shadow-component-editor__combobox"
        onHide={handleMenuClose}
      >
        {SHADOW_CATEGORIES.map((category) => {
          const componentsInCategory = SHADOW_COMPONENTS.filter(
            (c) => c.category === category
          );
          return (
            <React.Fragment key={category}>
              <Option disabled className="shadow-component-editor__category">
                {category}
              </Option>
              {componentsInCategory.map((comp) => (
                <Option key={comp.className} value={comp.className}>
                  {comp.name}
                </Option>
              ))}
            </React.Fragment>
          );
        })}
      </Combobox>

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
