---
name: feature-doc
description: >
  Generates standardized feature documentation in the docs/ folder whenever a new Shopify theme
  feature or functionality has been added or completed. Use this skill automatically after finishing
  any new section, block, snippet, or feature — even if the user doesn't explicitly ask for docs.
  Also trigger when the user says things like "document this", "create the doc", "add docs for X",
  "genera el doc", "crea la documentación", or when they finish a feature and ask what's next.
  The output is a populated Markdown file in docs/ based on the project's _TEMPLATE.md.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
argument-hint: [feature-name] [brief description]
---

## Generate Feature Documentation

A feature was just added or completed. Your job is to create a thorough, populated documentation
file in the `docs/` folder using the project's `_TEMPLATE.md` as the base structure.

The goal is a document a future developer can read to fully understand the feature without digging
through the code — what it does, what files it touches, how data flows, what Shopify Admin setup
is needed, and how to verify it works.

### Step 1 — Find the template

Read `docs/_TEMPLATE.md` in the current project root. This is the exact structure your output
must follow section by section.

If `_TEMPLATE.md` doesn't exist, check sibling projects under the same parent directory. If
still not found, use the standard structure: Architecture, File Structure, Metaobject Structure,
Data Flow, Implementation Details, Schema Settings, Translations, Accessibility, Block
Availability, Setup Requirements, Verification Checklist, Dependencies.

### Step 2 — Gather information about the feature

Read the actual files before writing anything. Do not invent or guess.

- **Files touched**: Glob for the feature's blocks, snippets, sections, and assets. Read each one.
- **Metaobjects/metafields**: Does it read from metafields? Extract namespace, key, type.
- **Schema settings**: Extract every setting `id`, `type`, `default`, and label from `{% schema %}`.
- **Translations**: Grep `locales/en.default.json` and `locales/en.default.schema.json` for keys
  related to this feature.
- **CSS classes**: Extract BEM class names from `{% stylesheet %}` blocks in each file.
- **JavaScript**: Check for `{% javascript %}` blocks or companion `.js` files in assets/.
- **Block availability**: If it's a block, grep for the block type string to find parent sections.

Collect all of this before writing. The doc quality depends entirely on what you extract here.

### Step 3 — Determine the output filename

Use kebab-case from the feature name: `feature-name.md` → save to `docs/`.

Be specific: `product-badges.md`, `ingredient-highlights.md`, `size-guide-modal.md`.
Not generic: `new-feature.md`, `feature.md`.

If `$ARGUMENTS` was provided, derive the filename from it. Otherwise infer from the files found.

### Step 4 — Write the document

Follow the `_TEMPLATE.md` structure exactly. Replace every placeholder with real data from Step 2.

**Title & summary**: Real feature name. 2–3 sentences: what does it show, where does it appear,
what Shopify data powers it?

**Architecture diagram**: Fill the Mermaid flowchart with actual component names and file paths.
Omit subgraphs that don't apply (e.g., no JS subgraph if there's no JavaScript).

**File Structure table**: Every file created or modified. `Created` or `Modified` in Action column.
Only files that are actually part of this feature.

**Metaobject Structure**: Real field names, keys, types. Omit the entire section if the feature
has no metaobjects or metafields — the template instructs this.

**Data Flow diagram**: Update sequence diagram to reflect the actual rendering flow with real
participant names.

**Implementation Details**: One subsection per component. Include:
- Actual file path
- What it does (1–2 sentences)
- Settings table with real `id`, `type`, `default`, and a description of what each controls
- For snippets: parameters table

**Schema Settings**: JSON for the most important or non-obvious setting(s). Don't include all —
pick ones that would confuse a future developer without context.

**Translations**: Only keys actually added. Omit the section entirely if none were added.

**Accessibility**: Be honest. If static with no interactive elements: "Static display only. No
interactive elements or ARIA requirements beyond standard semantic HTML." Don't invent
considerations that don't apply.

**Block Availability**: If it's a block, list parent sections/blocks where it's registered.
Omit if not a block.

**Setup Requirements**: Real Shopify Admin steps only if the feature requires metaobjects,
metafields, or app config. Omit if nothing beyond theme editor is needed.

**Verification Checklist**: Keep the standard checklist but add 1–2 feature-specific items that
are non-obvious (e.g., "Verify fallback renders correctly when metafield is empty").

**Dependencies**: Other docs in `docs/` that this feature shares data or snippets with. Omit if
standalone.

### Step 5 — Write the file and report

Write the completed doc to `docs/[feature-name].md`. Then tell the user:
- The file path created
- 2–3 sections where you made assumptions or had to infer (so they can verify)

### Quality rules

- Every table row must have real data — no rows that say "example.liquid" or "param".
- Mermaid diagrams must be valid syntax — keep them simple (3–4 nodes beats a broken 10-node one).
- The template's `> Omit if...` instructions matter — a focused doc beats a doc full of empty
  sections.
- If genuinely unsure about something, write a `> ⚠️ Verify: [what to check]` callout.
