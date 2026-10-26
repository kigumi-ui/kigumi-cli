import { useMemo } from 'react';
import { ComponentShowcase } from './preview/ComponentShowcase';
import { useStudio } from '../contexts/StudioContext';
import { scopeCustomCSS } from '../lib/custom-css';
import './StudioPreview.css';

/** The preview's theme root: ComponentShowcase, which carries the values. */
const PREVIEW_THEME_ROOT = '.studio-preview .component-showcase';

export function StudioPreview() {
  const { values, shadowComponents, customCSS, previewMode } = useStudio();

  // Generate dynamic CSS for shadow components
  // Use filter: drop-shadow() for Web Components since box-shadow doesn't penetrate Shadow DOM
  const shadowStyles = useMemo(() => {
    let css = '';
    if (shadowComponents.length === 0) return css;

    // Read raw values directly from state instead of getStyleObject(),
    // which merges shadow color+opacity into rgb() format and deletes --wa-shadow-opacity
    const offsetXScale = parseFloat(
      values['--wa-shadow-offset-x-scale']?.[previewMode] || '0'
    );
    const offsetYScale = parseFloat(
      values['--wa-shadow-offset-y-scale']?.[previewMode] || '1'
    );
    const blurScale = parseFloat(
      values['--wa-shadow-blur-scale']?.[previewMode] || '1'
    );
    const spreadScale = parseFloat(
      values['--wa-shadow-spread-scale']?.[previewMode] || '-0.5'
    );

    // Web Awesome formula: scale * 0.25rem (for medium shadow)
    // 0.25rem = 4px (assuming 16px base font-size)
    const baseMultiplier = 4; // 0.25rem in pixels

    // Calculate shadow values using Web Awesome's formula
    // --wa-shadow-m uses: calc(scale * 0.25rem)
    const offsetX = offsetXScale * baseMultiplier;
    const offsetY = offsetYScale * baseMultiplier;
    let blur = Math.max(0, blurScale * baseMultiplier); // blur can't be negative
    const spread = spreadScale * baseMultiplier;

    // Get shadow color and opacity from raw state values
    const shadowColorHex =
      values['--wa-color-shadow']?.[previewMode] || '#000000';
    const shadowOpacity = parseFloat(
      values['--wa-shadow-opacity']?.[previewMode] || '0.2'
    );

    // Convert hex to rgb and add opacity
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result
        ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
          }
        : { r: 0, g: 0, b: 0 };
    };

    const rgb = hexToRgb(shadowColorHex);
    const shadowColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${shadowOpacity})`;

    // Approximate spread effect for drop-shadow (which doesn't support spread)
    // Positive spread: increase blur and add multiple shadows for expansion effect
    // Negative spread: reduce blur for contraction effect
    if (spread > 0) {
      // Positive spread: simulate expansion with increased blur
      blur = blur + spread * 0.5;
    } else if (spread < 0) {
      // Negative spread: simulate contraction with reduced blur
      blur = Math.max(0, blur + spread * 0.3);
    }

    css += shadowComponents
      .map(
        (className) =>
          `.studio-preview .${className} { box-shadow: none; filter: drop-shadow(${offsetX}px ${offsetY}px ${blur}px ${shadowColor}); }`
      )
      .join('\n');

    return css;
  }, [values, shadowComponents, previewMode]);

  // Scoped here, never stored scoped: Studio keeps custom CSS as it goes
  // into a project, and no rule of it may reach Studio's own UI.
  const scopedCustomCSS = useMemo(
    () => (customCSS ? scopeCustomCSS(customCSS, PREVIEW_THEME_ROOT) : ''),
    [customCSS]
  );

  return (
    <div className="studio-preview">
      <style>{shadowStyles}</style>
      {/* After the shadows: custom CSS comes last, as in a project. */}
      {scopedCustomCSS && (
        <style data-kigumi-overrides>{scopedCustomCSS}</style>
      )}
      <ComponentShowcase />
    </div>
  );
}
