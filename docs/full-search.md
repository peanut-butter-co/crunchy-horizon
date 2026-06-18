# Full Search Modal

Modal de búsqueda de dos columnas que reemplaza el predictive search nativo de Horizon cuando `settings.quick_search_mode == 'full_search'` (default). Sidebar izquierdo con queries y colecciones, grid de productos a la derecha. Activado con el setting **Quick search** en el Theme Editor.

---

## Architecture

```
User types 3+ chars
       │
       ▼
FullSearchComponent (assets/full-search.js)
       │
       ├── Promise.all([
       │     GET /search?q=TERM&type=product&options[prefix]=last
       │         &section_id=full-search-products
       │         → sections/full-search-products.liquid  (search object)
       │         → renders product grid via predictive-search-products-list
       │
       │     GET /search/suggest?q=TERM&resources[type]=query,collection
       │         &section_id=full-search
       │         → sections/full-search.liquid  (predictive_search object)
       │         → renders sidebar: query pills + collection thumbnails
       │   ])
       │
       └── morph() into:
             ref="searchResultsProducts"  ← product grid
             ref="searchResultsSidebar"   ← sidebar (or innerHTML='' if disabled)
```

---

## Files

| File | Role |
|------|------|
| `assets/full-search.js` | Web Component `FullSearchComponent` — orchestrates fetches, cache, morph |
| `sections/full-search.liquid` | SRA section — sidebar HTML (queries + collections) |
| `sections/full-search-products.liquid` | SRA section — product grid HTML |
| `snippets/search-modal.liquid` | Modal shell — conditional full-search vs predictive-search |

---

## Theme Settings

All under **Search → Quick search** in the Theme Editor:

| Setting ID | Type | Default | Description |
|---|---|---|---|
| `quick_search_mode` | select | `full_search` | `full_search` activates this feature; `predictive_search` restores native Horizon behavior |
| `full_search_max_results` | range 4–16 | `8` | Max products shown in the grid |
| `full_search_min_length` | range 1–5 | `3` | Min characters before fetching |
| `full_search_show_categories` | checkbox | `true` | Show/hide the sidebar (queries + collections). When false, skips the `/search/suggest` fetch entirely |

---

## Sections (SRA endpoints)

### `sections/full-search.liquid`

Consumed by the Predictive Search API (`/search/suggest`). Uses `predictive_search` Liquid object.

- Renders `<aside data-search-sidebar>` only when `predictive_search.resources.queries.size > 0` or `collections.size > 0`
- If both are empty, outputs nothing → JS detects no `[data-search-sidebar]` → removes `--has-sidebar` class → single-column layout
- Collection images: 32×32px with `widths: '32, 64'` for srcset; fallback icon (`icon-grid-default.svg`) when no `featured_image`

### `sections/full-search-products.liquid`

Consumed by the Section Rendering API (`/search`). Uses `search` Liquid object.

- `search.performed` guard — outputs nothing on direct page load
- `data-search-results` attribute on both results and empty-state divs — used by CSS `:has()` to show/hide the "View all" footer button
- `full-search-products--empty` class on no-results div — used by CSS to suppress the footer button
- `data-single-result-url` hidden div when exactly 1 result — JS reads this on Enter to navigate directly to the product

---

## JS Component

**`FullSearchComponent`** extends Horizon's `Component` base class.

Key behaviors:

- **Cache**: `Map<"term:showCategories", {productsHtml, sidebarHtml}>` — cache key encodes both the term and the categories toggle state so toggling the setting invalidates cached results
- **Abort**: `#activeFetch` AbortController per keystroke — previous in-flight result is discarded (network request completes but render is skipped)
- **Debounce**: 200ms
- **`showCategories` guard**: when `data-show-categories="false"`, skips the `/search/suggest` fetch and passes `sidebarHtml = null` — `#renderResults` uses `innerHTML = ''` instead of `morph()` (morph throws on empty/null string)
- **`aria-expanded`**: set to `"true"` when results render, `"false"` on clear/reset
- **Enter key**: `event.preventDefault()` always called before navigation; navigates to `/search?q=TERM&options[prefix]=last`; if exactly 1 result, navigates directly to that product URL

---

## Switching modes

The `quick_search_mode` setting controls which component loads:

```liquid
{% if settings.quick_search_mode == 'full_search' %}
  <script src="{{ 'full-search.js' | asset_url }}" type="module">
  <full-search-component ...>
{% else %}
  <script src="{{ 'predictive-search.js' | asset_url }}" type="module">
  <predictive-search-component ...>  ← native Horizon, zero changes
{% endif %}
```

The native predictive search is untouched and fully functional when the setting is switched back.
