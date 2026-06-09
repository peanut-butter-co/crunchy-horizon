# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Horizon** — Shopify's official first-party theme (v3.5.1), customized for Sterling Forever. Based on modern Liquid Storefronts with theme blocks. No Node.js build step; the theme is pure Liquid + HTML + CSS + vanilla JS deployed via Shopify CLI.

## Commands

```bash
# Local dev server (developer runs, never Claude)
shopify theme dev --store={store-name}

# Lint / validate
shopify theme check

# Push preview theme (developer only — Claude never pushes)
shopify theme push --unpublished --theme={branch-name}
```

**Claude only makes local file changes. Never run `shopify theme push` or `shopify theme delete`.**

## Architecture

### Request Lifecycle
1. Shopify serves a request → `layout/theme.liquid` is the master shell.
2. `layout/theme.liquid` renders header/footer section groups, injects CSS vars via `snippets/theme-styles-variables.liquid`, and yields `{{ content_for_layout }}`.
3. `templates/*.json` declare which sections appear on each page type.
4. Sections use `{% content_for 'blocks' %}` to render their nested theme blocks.

### Directory Roles
| Dir | Contents |
|-----|----------|
| `layout/` | Master layouts (`theme.liquid`, `password.liquid`) |
| `templates/` | Page-type JSON templates mapping sections to pages |
| `sections/` | Composable page sections (41 files) |
| `blocks/` | Theme blocks nested inside sections (93 files) |
| `snippets/` | Reusable partials — always rendered with `{% render %}` (103 files) |
| `assets/` | CSS, JS, images — no build pipeline, files served as-is |
| `locales/` | 51 translation JSON files; `en.default.json` + `en.default.schema.json` are canonical |
| `config/` | `settings_schema.json` (theme options) + `settings_data.json` (live values) |

### CSS Architecture
- Scoped styles live in `{% stylesheet %}` tags inside sections, blocks, and snippets.
- Global CSS variables are generated from settings in `snippets/theme-styles-variables.liquid`.
- Project-specific custom variables go in `snippets/custom-variables.liquid`.
- Only use a separate `/assets/section-{name}.css` file when styles are too large or shared across multiple sections.
- BEM naming: `block__element--modifier`. Max 3 levels of nesting. No IDs, no tag selectors.

### JavaScript Architecture
- All interactive components extend the `Component` base class from `assets/component.js` (`import { Component } from '@theme/component'`).
- `Component` manages **declarative refs** and **event wiring** automatically:
  - `ref="name"` on an HTML element → accessible as `this.refs.name` in the class.
  - `ref="items[]"` → `this.refs.items` is an array.
  - `on:click="/methodName"` on an element → calls `this.methodName(event)`.
- Components can also be written inline in `.liquid` files using `{% javascript %}` tags.
- Zero external dependencies. Use `const` over `let`, `for...of` over `.forEach`, async/await over `.then()`.
- Use private class fields (`#field`) for internal state; keep public methods minimal and documented with JSDoc.

### Theme Blocks
Horizon uses **theme blocks** (`@theme` / `@app` block types) extensively. Sections expose `{% content_for 'blocks' %}` and their schema declares `{"type": "@theme"}` to allow any compatible block. Blocks live in `blocks/*.liquid`.

### Schemas
Schemas are written as JSON directly inside `{% schema %}` tags in each `.liquid` file. Translation keys for schema `name` fields must exist in `locales/en.default.schema.json` under the `names` section — add missing keys there when creating new sections/blocks.

### Locales
Every visible string must use a translation key: `{{ 'section.key' | t }}`. Schema labels/names reference `t:names.key` / `t:settings.key`. Never hardcode visible text.

## Code Standards Summary

Full rules are in `.cursor/rules/`. Key constraints:

- **Liquid**: Always `{% render %}` (never `{% include %}`). Use `{% doc %}` LiquidDoc headers on every snippet we create.
- **CSS**: BEM, `{% stylesheet %}` for scoped styles, CSS custom properties only (no hardcoded hex/font values).
- **JS**: Extend `Component`, declarative refs/events, no jQuery, no Shadow DOM, no `var`, clean up listeners in `disconnectedCallback`.
- **Accessibility**: WCAG AA minimum. Full rules in `.cursor/rules/*-accessibility.mdc`.
- **Git**: Conventional Commits (`feat(scope): description`). Branches: `feature/`, `fix/`, `hotfix/`. Never push to `main` or `develop` directly.

## Staying Up to Date with Upstream Horizon

```bash
git remote add upstream https://github.com/Shopify/horizon.git
git fetch upstream
git pull upstream main
```
