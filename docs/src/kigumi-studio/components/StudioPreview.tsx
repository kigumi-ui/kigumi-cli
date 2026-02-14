import { useMemo } from 'react';
import { ComponentShowcase } from './preview/ComponentShowcase';
import { useStudio } from '../contexts/StudioContext';
import './StudioPreview.css';

export function StudioPreview() {
  const { shadowComponents, getStyleObject, previewMode } = useStudio();

  // Generate dynamic CSS for shadow components
  // Use filter: drop-shadow() for Web Components since box-shadow doesn't penetrate Shadow DOM
  const shadowStyles = useMemo(() => {
    // Always remove default box-shadows from Web Awesome components
    let css = '.studio-preview * { box-shadow: none !important; }\n';

    if (shadowComponents.length === 0) return css;

    // Get current shadow scale values from theme
    const styleObject = getStyleObject(previewMode);
    const offsetXScale = parseFloat(
      styleObject['--wa-shadow-offset-x-scale'] || '0'
    );
    const offsetYScale = parseFloat(
      styleObject['--wa-shadow-offset-y-scale'] || '1'
    );
    const blurScale = parseFloat(styleObject['--wa-shadow-blur-scale'] || '1');
    const spreadScale = parseFloat(
      styleObject['--wa-shadow-spread-scale'] || '-0.5'
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

    // Get shadow color and opacity from theme
    const shadowColorHex = styleObject['--wa-color-shadow'] || '#000000';
    const shadowOpacity = parseFloat(
      styleObject['--wa-shadow-opacity'] || '0.2'
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
          `.studio-preview .${className} { filter: drop-shadow(${offsetX}px ${offsetY}px ${blur}px ${shadowColor}); }`
      )
      .join('\n');

    return css;
  }, [shadowComponents, getStyleObject, previewMode]);

  return (
    <div className="studio-preview">
      {shadowStyles && <style>{shadowStyles}</style>}
      <ComponentShowcase />
    </div>
  );
}
