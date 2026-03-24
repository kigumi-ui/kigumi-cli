# Scale Computation Reference

When the CSS input contains a scale property (e.g., `--wa-space-scale: 1.15`), ALL derived tokens for that scale group must be recomputed.

## Formula

```
pixel_value = round(scale * base_rem_multiplier * 16)
```

Where `16` is the root font size (1rem = 16px).

## Space Scale (`--wa-space-scale`)

| Token         | Base Multiplier (rem) | Default (scale=1) |
| ------------- | --------------------- | ----------------- |
| Space/3XS     | 0.125                 | 2                 |
| Space/2XS     | 0.25                  | 4                 |
| Space/XS      | 0.5                   | 8                 |
| Space/S       | 0.75                  | 12                |
| Space/M       | 1                     | 16                |
| Space/L       | 1.5                   | 24                |
| Space/XL      | 2                     | 32                |
| Space/2XL     | 2.5                   | 40                |
| Space/3XL     | 3                     | 48                |
| Space/4XL     | 4                     | 64                |
| Space/Content | = Space/L             | 24                |

**Example:** scale=1.15 -> Space/M = round(1.15 _ 1 _ 16) = 18

Figma variable IDs (Kigumi UI Kit, Primitives Default mode `7:5`):

```
--wa-space-3xs  -> VariableID:15:122
--wa-space-2xs  -> VariableID:7:104
--wa-space-xs   -> VariableID:7:105
--wa-space-s    -> VariableID:7:106
--wa-space-m    -> VariableID:7:107
--wa-space-l    -> VariableID:15:123
--wa-space-xl   -> VariableID:15:124
--wa-space-2xl  -> VariableID:15:125
--wa-space-3xl  -> VariableID:15:126
--wa-space-4xl  -> VariableID:15:127
--wa-content-spacing -> VariableID:15:128
```

## Font Size Scale (`--wa-font-size-scale`)

Base size: 1rem (16px). Uses 1.125 ratio for scaling.

| Token         | Computation                | Default (scale=1) |
| ------------- | -------------------------- | ----------------- |
| Font Size/M   | scale \* 16                | 16                |
| Font Size/S   | round(M / 1.125)           | 14                |
| Font Size/XS  | round(S / 1.125)           | 12                |
| Font Size/2XS | round(XS / 1.125)          | 11                |
| Font Size/L   | round(M _ 1.125 _ 1.125)   | 20                |
| Font Size/XL  | round(L _ 1.125 _ 1.125)   | 25                |
| Font Size/2XL | round(XL _ 1.125 _ 1.125)  | 32                |
| Font Size/3XL | round(2XL _ 1.125 _ 1.125) | 41                |
| Font Size/4XL | round(3XL _ 1.125 _ 1.125) | 52                |

Figma variable IDs:

```
--wa-font-size-2xs -> VariableID:15:112
--wa-font-size-xs  -> VariableID:7:96
--wa-font-size-s   -> VariableID:7:97
--wa-font-size-m   -> VariableID:7:98
--wa-font-size-l   -> VariableID:7:99
--wa-font-size-xl  -> VariableID:15:113
--wa-font-size-2xl -> VariableID:15:114
--wa-font-size-3xl -> VariableID:15:115
--wa-font-size-4xl -> VariableID:15:116
```

## Border Width Scale (`--wa-border-width-scale`)

| Token          | Base Multiplier (rem) | Default (scale=1) |
| -------------- | --------------------- | ----------------- |
| Border Width/S | 0.0625                | 1                 |
| Border Width/M | 0.125                 | 2                 |
| Border Width/L | 0.1875                | 3                 |

```
--wa-border-width-s -> VariableID:7:112
--wa-border-width-m -> VariableID:15:129
--wa-border-width-l -> VariableID:15:130
```

## Border Radius Scale (`--wa-border-radius-scale`)

| Token           | Base Multiplier (rem) | Default (scale=1) |
| --------------- | --------------------- | ----------------- |
| Border Radius/S | 0.1875                | 3                 |
| Border Radius/M | 0.375                 | 6                 |
| Border Radius/L | 0.75                  | 12                |

```
--wa-border-radius-s -> VariableID:7:108
--wa-border-radius-m -> VariableID:7:109
--wa-border-radius-l -> VariableID:7:110
```

Note: `Border Radius/Pill` (9999) and `Border Radius/Square` (0) are NOT affected by scale.

## Shadow Scales

Three independent scales control shadow tokens:

### Shadow Offset Y Scale (`--wa-shadow-offset-y-scale`)

| Token             | Base Multiplier (rem) | Default (scale=1) |
| ----------------- | --------------------- | ----------------- |
| Shadow/Offset Y/S | 0.125                 | 2                 |
| Shadow/Offset Y/M | 0.25                  | 4                 |
| Shadow/Offset Y/L | 0.5                   | 8                 |

### Shadow Offset X Scale (`--wa-shadow-offset-x-scale`)

Same multipliers as Y. Default scale=0 (no horizontal offset).

### Shadow Blur Scale (`--wa-shadow-blur-scale`)

| Token         | Base Multiplier (rem) | Default (scale=1) |
| ------------- | --------------------- | ----------------- |
| Shadow/Blur/S | 0.125                 | 2                 |
| Shadow/Blur/M | 0.25                  | 4                 |
| Shadow/Blur/L | 0.5                   | 8                 |

### Shadow Spread Scale (`--wa-shadow-spread-scale`)

| Token           | Base Multiplier (rem) | Default (scale=-0.5) |
| --------------- | --------------------- | -------------------- |
| Shadow/Spread/S | 0.125                 | -1                   |
| Shadow/Spread/M | 0.25                  | -2                   |
| Shadow/Spread/L | 0.5                   | -4                   |

Shadow variable IDs:

```
--wa-shadow-offset-x-s -> VariableID:15:134
--wa-shadow-offset-x-m -> VariableID:15:135
--wa-shadow-offset-x-l -> VariableID:15:136
--wa-shadow-offset-y-s -> VariableID:15:137
--wa-shadow-offset-y-m -> VariableID:15:138
--wa-shadow-offset-y-l -> VariableID:15:139
--wa-shadow-blur-s     -> VariableID:15:140
--wa-shadow-blur-m     -> VariableID:15:141
--wa-shadow-blur-l     -> VariableID:15:142
--wa-shadow-spread-s   -> VariableID:15:143
--wa-shadow-spread-m   -> VariableID:15:144
--wa-shadow-spread-l   -> VariableID:15:145
```

## Form Control Computed Values

Form control height, padding, and toggle size are computed from the CSS formula `0.75em * font-size`. Since each size variant (S/M/L) uses a different font-size, these produce different pixel values.

These are NOT scale-derived. They use fixed formulas in CSS (`round(calc(2 * padding-block + 1em * line-height), 1px)`). The Figma variables store pre-computed pixel values for each size. If `--wa-font-size-scale` changes, these must be recomputed.

| Token          | Formula (default)             | S (14px font) | M (16px font) | L (20px font) |
| -------------- | ----------------------------- | ------------- | ------------- | ------------- |
| Height         | round(2 _ 0.75em + 1em _ 1.2) | 38            | 43            | 54            |
| Padding Block  | 0.75 \* font-size             | 10.5          | 12            | 15            |
| Padding Inline | 1 \* font-size                | 14            | 16            | 20            |
| Toggle Size    | round(1.25 \* font-size)      | 18            | 20            | 25            |

Form Control variable IDs:

```
Height:         S=VariableID:7:113, M=VariableID:7:114, L=VariableID:7:115
Padding Block:  S=VariableID:15:151, M=VariableID:15:152, L=VariableID:15:153
Padding Inline: S=VariableID:7:116, M=VariableID:7:117, L=VariableID:7:118
Toggle Size:    S=VariableID:15:154, M=VariableID:15:155, L=VariableID:15:156
```
