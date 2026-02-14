import React, { useEffect, useRef, useState } from 'react';
import { EditorSection } from './EditorSection';
import { PropertyRow } from './PropertyRow';
import {
  PROPERTIES_BY_GROUP,
  PROPERTY_GROUPS,
} from '../../lib/property-definitions';
import {
  SHADOW_COMPONENTS,
  SHADOW_CATEGORIES,
} from '../../lib/shadow-components';
import { useStudio } from '../../contexts/StudioContext';
import '@awesome.me/webawesome-pro/dist/components/combobox/combobox.js';
import '@awesome.me/webawesome-pro/dist/components/option/option.js';
import './ShadowComponentEditor.css';

export function ShadowEditor() {
  const group = PROPERTY_GROUPS.find((g) => g.key === 'shadows')!;
  const props = PROPERTIES_BY_GROUP.get('shadows') ?? [];

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
    setTimeout(() => {
      const container = containerRef.current;
      if (!container) return;

      const combobox = container.querySelector('wa-combobox') as HTMLElement & {
        value?: string[];
      };
      if (!combobox) return;

      const currentValue = Array.isArray(combobox.value)
        ? combobox.value.filter(Boolean)
        : [];

      const prevSorted = [...shadowComponents].sort().join(',');
      const newSorted = [...currentValue].sort().join(',');

      if (prevSorted !== newSorted) {
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

    combobox.addEventListener('change', handleChange);
    combobox.addEventListener('input', handleChange);
    combobox.addEventListener('wa-change', handleChange);
    combobox.addEventListener('wa-hide', handleMenuClose);

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

    const currentValue = combobox.value ?? [];
    const isSame =
      Array.isArray(currentValue) &&
      currentValue.length === shadowComponents.length &&
      currentValue.every((v, i) => v === shadowComponents[i]);

    if (!isSame) {
      combobox.value = shadowComponents;
      previousValueRef.current = shadowComponents;
    }
  }, [isReady, shadowComponents]);

  const selectedCount = shadowComponents.length;

  return (
    <EditorSection group={group}>
      {/* Component Selection Combobox */}
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

      {/* Shadow Properties */}
      {props.map((p) => (
        <PropertyRow key={p.cssVar} property={p} />
      ))}
    </EditorSection>
  );
}
