# Typography

Two-part typography system: **custom font selection** (Theme Settings → Typography → Fonts) and **mobile typography presets** (per-block setting on text, heading, and other blocks).

---

## Part 1 — Custom Fonts

Merchants choose between Shopify's built-in font picker or a curated set of custom fonts per font role (body, subheading, heading, accent). Default is `shopify` — no breaking change.

### File Structure

| File | Action | Purpose |
|------|--------|---------|
| `snippets/custom-fonts.liquid` | Created | `@font-face` loader with preload, deduplication, and Arthura auto-variant logic |
| `snippets/theme-styles-variables.liquid` | Modified | Font CSS vars now branch on `*_font_source` setting |
| `layout/theme.liquid` | Modified | Added `render 'custom-fonts'` after `render 'fonts'` |
| `config/settings_schema.json` | Modified | 4 font source selects + `visible_if` on font pickers |
| `locales/en.default.schema.json` | Modified | `settings.*_font_source`, `options.shopify_fonts`, `info.shopify_font_picker` |
| `assets/Arthura-Regular.woff2` | Added | Arthura weight 400 |
| `assets/Arthura-Medium.woff2` | Added | Arthura weight 500 |
| `assets/Arthura-Bold.woff2` | Added | Arthura weight 700 |
| `assets/Boldonse.woff2` | Added | Boldonse weight 400 |
| `assets/SelfieNeueRounded-Regular.woff2` | Added | Selfie Neue Rounded weight 400 |

### How It Works

Each of the four font roles has a `*_font_source` select. Default `"shopify"` shows the native font picker. Any other value loads the custom font via `snippets/custom-fonts.liquid`:

1. **Preload** — heading font gets `<link rel="preload">` for LCP
2. **Collect** — loops all four roles collecting needed custom fonts
3. **Deduplicate** — `| uniq | compact` prevents double-loading
4. **Emit** — `@font-face` only for fonts actually in use

`snippets/theme-styles-variables.liquid` branches on `*_font_source`:
- `shopify` → reads `.family`, `.weight`, `.style` from Shopify font object
- custom → parses `font-name:weight`, maps to CSS `font-family` string

### Available Custom Fonts

| Font | Value | Weights |
|------|-------|---------|
| Selfie Neue Rounded | `selfie-neue-rounded:400` | 400 |
| Boldonse | `boldonse:400` | 400 |
| Arthura | `arthura:400` | 400 |
| Arthura Bold | `arthura:700` | 700 |

> Arthura Medium (500) loads automatically when Arthura is body font — used for button weight.

### Adding a New Custom Font

1. Upload `.woff2` to `assets/`
2. Add option to the 4 selects in `config/settings_schema.json` (format: `name:weight`)
3. Add `@font-face` case in `snippets/custom-fonts.liquid`
4. Add family case in `snippets/theme-styles-variables.liquid` (all 4 role blocks)
5. If multiple weights, add auto-load logic in the body section of `custom-fonts.liquid`

---

## Part 2 — Mobile Typography Presets

Allows setting a different typography preset per block for screens ≤749px. A block with desktop preset `h1` can display as `h3` on mobile without any CSS duplication.

### Architecture

```
Desktop: .text-block.h1 > * { font-size: var(--text-preset-size, var(--font-h1--size)) }
                                                    ↑ not defined → uses fallback

Mobile:  .text-block.text-block--mobile-preset-h3 { --text-preset-size: var(--font-h3--size) }
                                                     ↑ now defined → overrides .text-block.h1 > *
```

The key is the **`--text-preset-*` intermediate CSS variable layer** added to all preset rules. On desktop these variables are never set, so the fallback `var(--font-{preset}--*)` always wins. On mobile, the `.text-block--mobile-preset-*` class sets the intermediate variables which cascade to child elements.

### File Structure

| File | Action | Purpose |
|------|--------|---------|
| `assets/base.css` | Modified | Preset rules now use `var(--text-preset-*, var(--font-{preset}--*))` + `@media (max-width: 749px)` block |
| `snippets/text.liquid` | Modified | Emits `text-block--mobile-preset-{preset}` class when `type_preset_mobile` is set |
| `blocks/text.liquid` | Modified | Added `type_preset_mobile` schema setting |
| `blocks/_heading.liquid` | Modified | Added `type_preset_mobile` schema setting |
| `blocks/product-title.liquid` | Modified | Added `type_preset_mobile` schema setting |
| `blocks/product-description.liquid` | Modified | Added `type_preset_mobile` schema setting |
| `blocks/collection-title.liquid` | Modified | Added `type_preset_mobile` schema setting |
| `blocks/_blog-post-description.liquid` | Modified | Added `type_preset_mobile` schema setting |
| `locales/en.default.schema.json` | Modified | `settings.preset_mobile`, `options.use_desktop_preset`, `info.mobile_preset_fallback` |

### Mobile Preset Options

| Value | Description |
|-------|-------------|
| *(empty)* | **Default** — uses desktop preset unchanged |
| `rte` | Body text (resets to body font styles) |
| `paragraph` | Paragraph preset |
| `h1` – `h6` | Any heading preset |

### Blocks with Mobile Preset

All blocks that use `snippets/text.liquid` automatically support the mobile class once they have `type_preset_mobile` in their schema. Currently enabled on:
- `blocks/text.liquid` — universal text block (used on all templates)
- `blocks/_heading.liquid` — heading block
- `blocks/product-title.liquid` — product title
- `blocks/product-description.liquid` — product description
- `blocks/collection-title.liquid` — collection title
- `blocks/_blog-post-description.liquid` — blog post description

### Breakpoint

`@media screen and (max-width: 749px)` — same as Horizon's existing mobile breakpoints.

Note: inputs use a separate `1200px` breakpoint for iOS zoom prevention. Text blocks do NOT need this because mobile preset applies only to visual text, not form inputs.

### Adding Mobile Preset to More Blocks

Any block that uses `snippets/text.liquid` and has a `type_preset` setting can get mobile preset support by adding the `type_preset_mobile` setting to its schema (copy the pattern from any of the 6 blocks above).

---

## Translations

**Schema translations** (`locales/en.default.schema.json`):

| Key | EN |
|-----|-----|
| `settings.body_font_source` | Body font |
| `settings.subheading_font_source` | Subheading font |
| `settings.heading_font_source` | Heading font |
| `settings.accent_font_source` | Accent font |
| `settings.preset_mobile` | Mobile preset |
| `options.shopify_fonts` | Shopify fonts |
| `options.use_desktop_preset` | Use desktop preset |
| `info.shopify_font_picker` | Only shown when 'Shopify fonts' is selected |
| `info.mobile_preset_fallback` | Leave empty to use the desktop preset on mobile |

---

## Verification Checklist

### Custom fonts
- [ ] Theme Settings → Typography → Fonts shows 4 source selects
- [ ] Selecting "Shopify fonts" shows native picker; custom hides it
- [ ] Selecting a custom font changes the typography in preview
- [ ] Page source shows `@font-face` only for selected font(s)
- [ ] Page source shows `<link rel="preload">` for heading custom font
- [ ] Same font for multiple roles loads `@font-face` only once

### Mobile presets
- [ ] Block settings panel shows "Mobile preset" dropdown after "Preset"
- [ ] Default (empty) uses desktop preset on all sizes
- [ ] Setting mobile preset to `h3` on a `h1` block: desktop shows h1 size, mobile (≤749px) shows h3 size
- [ ] Resizing browser to 750px+ reverts to desktop preset
- [ ] Blocks without `type_preset_mobile` are unaffected
