---
'kigumi': minor
---

### Deprecated

- **RadarChart**: `stacked`, `grid`, `min` and `max` are deprecated. They never had an effect on a radar chart, and they will be removed in the next major. Set `options.scales.r.min`, `options.scales.r.max` or `options.scales.r.grid.display` in the chart's JSON config instead; radar charts cannot stack datasets. Run `kigumi update` to see the props struck through in your editor.
