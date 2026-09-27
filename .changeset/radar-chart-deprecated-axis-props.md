---
'kigumi': minor
---

### Deprecated

- **RadarChart**: `stacked`, `grid`, `min` and `max` are deprecated. They never had an effect on a radar chart, and they will be removed in the next major. Configure the radial scale in the chart's JSON config (the `application/json` script inside the chart) instead: `options.scales.r.min`, `options.scales.r.max` and `options.scales.r.grid.display`. Radar charts cannot stack datasets. Run `kigumi update` to see the props struck through in your editor.
- **Icon**: `auto-width` is marked deprecated in the React, Vue and Angular wrappers, as it already is in Web Awesome. Use `canvas="auto"` instead.
