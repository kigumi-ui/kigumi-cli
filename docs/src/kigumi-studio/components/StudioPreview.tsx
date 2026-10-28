import { useMemo } from 'react';
import { ComponentShowcase } from './preview/ComponentShowcase';
import { useStudio } from '../contexts/StudioContext';
import { formatShadowRules } from '../lib/css-generator';
import { scopeCustomCSS } from '../lib/custom-css';
import './StudioPreview.css';

/** The preview's theme root: ComponentShowcase, which carries the values. */
const PREVIEW_THEME_ROOT = '.studio-preview .component-showcase';

export function StudioPreview() {
  const { shadowComponents, customCSS } = useStudio();

  // The export's shadow rules, scoped like custom CSS: the preview paints
  // the shadows a project paints, from --wa-shadow-m as Studio's values
  // resolve it, so custom CSS can change or remove them here as there.
  const shadowStyles = useMemo(
    () =>
      scopeCustomCSS(formatShadowRules(shadowComponents), PREVIEW_THEME_ROOT),
    [shadowComponents]
  );

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
