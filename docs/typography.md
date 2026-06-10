# Typography

Two-part typography system: **custom font selection** (Theme Settings → Typography → Fonts) and **mobile typography presets** (per-block setting on text, heading, and other blocks).

---

## Part 1 — Custom Fonts

Custom fonts system that allows merchants to choose between Shopify's built-in font picker and a curated set of project custom fonts, configured under Theme Settings → Typography → Fonts.

---

### Architecture

```mermaid
flowchart LR
    subgraph Settings["Theme Settings"]
        BS["type_body_font_source"]
        SS["type_subheading_font_source"]
        HS["type_heading_font_source"]
        AS["type_accent_font_source"]
        BP["type_body_font (font_picker)"]
        SP["type_subheading_font (font_picker)"]
        HP["type_heading_font (font_picker)"]
        AP["type_accent_font (font_picker)"]
    end

    subgraph Theme["Liquid Components"]
        CF["snippets/custom-fonts.liquid"]
        FL["snippets/fonts.liquid"]
        TV["snippets/theme-styles-variables.liquid"]
        TL["layout/theme.liquid"]
    end

    subgraph Output["Browser"]
        PR["<link rel=preload> (custom heading font)"]
        FF["@font-face declarations"]
        CV["--font-*--family/weight/style CSS vars"]
    end

    TL --> FL
    TL --> CF
    TL --> TV
    BS -->|shopify| BP --> FL --> PR
    BS -->|custom| CF --> FF
    BS --> TV --> CV
```

### File Structure

| File | Action | Purpose |
|------|--------|---------|
| `snippets/custom-fonts.liquid` | Created | Loads `@font-face` and preload tags for custom fonts |
| `snippets/theme-styles-variables.liquid` | Modified | Font family CSS vars now branch on `*_font_source` setting |
| `layout/theme.liquid` | Modified | Added `render 'custom-fonts'` after `render 'fonts'` |
| `config/settings_schema.json` | Modified | Added 4 font source selects + `visible_if` on font pickers |
| `locales/en.default.schema.json` | Modified | Added `settings.*_font_source`, `options.shopify_fonts`, `info.shopify_font_picker` |
| `assets/Arthura-Regular.woff2` | Added | Arthura weight 400 |
| `assets/Arthura-Medium.woff2` | Added | Arthura weight 500 |
| `assets/Arthura-Bold.woff2` | Added | Arthura weight 700 |
| `assets/Boldonse.woff2` | Added | Boldonse weight 400 |
| `assets/SelfieNeueRounded-Regular.woff2` | Added | Selfie Neue Rounded weight 400 |

### How It Works

#### Font source selection

Each of the four font roles (body, subheading, heading, accent) has a `*_font_source` select setting. Default is `"shopify"`, which shows the native Shopify font picker and uses `font_face` / `font_url` Liquid filters. Any other value selects a custom font.

#### Custom font loading (`snippets/custom-fonts.liquid`)

1. **Preload** — If the heading font is custom, outputs a `<link rel="preload">` for the heading font file. This is critical for LCP since headings are typically above the fold.
2. **Collect** — Loops through all four font sources collecting which custom fonts are needed. If body uses Arthura, also schedules `arthura:500` (buttons) and `arthura:700` (rich text bold) for loading.
3. **Deduplicate** — `| uniq | compact` ensures the same font file is never loaded twice even if selected for multiple roles.
4. **Emit** — Outputs `@font-face` declarations only for fonts in use, inside `{% style %}...{% endstyle %}`.

#### CSS variable generation (`snippets/theme-styles-variables.liquid`)

The font family block is conditional per source:
- `shopify` → reads `.family`, `.fallback_families`, `.weight`, `.style` from the Shopify font object
- custom → parses `font-name:weight` value, maps name to `font-family` string, sets style to `normal`

Output variables consumed by the rest of the theme:
```css
--font-body--family    --font-body--style    --font-body--weight
--font-subheading--family ...
--font-heading--family ...
--font-accent--family ...
```

### Available Custom Fonts

| Font | Value | Weights available |
|------|-------|-------------------|
| Selfie Neue Rounded | `selfie-neue-rounded:400` | 400 |
| Boldonse | `boldonse:400` | 400 |
| Arthura | `arthura:400` | 400 |
| Arthura Bold | `arthura:700` | 700 |

> Arthura Medium (500) is loaded automatically when Arthura is selected as body font — used for button font weight.

### Adding a New Custom Font

1. **Upload** the `.woff2` file to `assets/`
2. **Add option** to the 4 `select` settings in `config/settings_schema.json` (value format: `font-name:weight`)
3. **Add `@font-face` case** in `snippets/custom-fonts.liquid` under the `case font_name` block
4. **Add family case** in `snippets/theme-styles-variables.liquid` under all 4 `case body_font_name` / `case heading_font_name` etc. blocks
5. If the font has multiple weights (like Arthura), add auto-load logic in the body font section of `custom-fonts.liquid`

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
- [ ] Theme Settings → Typography → Fonts shows 4 source selects with custom font options
- [ ] Selecting "Shopify fonts" shows the native font picker below; selecting a custom font hides it
- [ ] Selecting "Boldonse" as Heading font changes headings to Boldonse in the preview
- [ ] Page source shows `@font-face` only for the selected custom font(s)
- [ ] Page source shows `<link rel="preload">` for the heading custom font in `<head>`
- [ ] Switching back to "Shopify fonts" removes the `@font-face` and preload
- [ ] Same font selected for two roles loads `@font-face` only once (deduplication)
- [ ] Arthura as body font auto-loads Arthura Medium (500) and Bold (700) variants

### Mobile presets
- [ ] Block settings panel shows "Mobile preset" dropdown after "Preset"
- [ ] Default (empty) uses desktop preset on all sizes
- [ ] Setting mobile preset to `h3` on a `h1` block: desktop shows h1 size, mobile (≤749px) shows h3 size
- [ ] Resizing browser to 750px+ reverts to desktop preset
- [ ] Blocks without `type_preset_mobile` are unaffected
