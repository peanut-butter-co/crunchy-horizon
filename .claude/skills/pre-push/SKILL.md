---
name: pre-push
description: Before pushing to remote, checks if any new Liquid files in blocks/, sections/, or snippets/ are missing documentation in docs/. Use this before every git push, or when the user asks to review what's ready to push.
allowed-tools: Read, Grep, Glob, Bash(git diff*, git log*, git status)
---

## Pre-Push Documentation Check

Before pushing, verify that new features have their doc.

### Steps

1. **Get new `.liquid` files added in this branch**:
   ```
   git diff --name-only --diff-filter=A origin/develop...HEAD | grep -E "^(blocks|sections|snippets)/.*\.liquid$"
   ```
   If no develop remote, use `origin/main` or `HEAD~$(git rev-list --count origin/HEAD..HEAD)`.

2. **For each new file, decide if it needs a doc**:

   A file needs a doc if it's a **user-facing feature** — something a developer would need to understand to maintain or extend. Ask: does it have schema settings? Does it read metafields? Does it have non-obvious logic?

   Internal partials (prefixed with `_`) may skip the doc if they're simple helpers with no settings.

3. **Check if the doc already exists** in `docs/`:
   - `blocks/ingredient-highlight.liquid` → look for `docs/ingredient-highlight.md` or a doc that covers it
   - `sections/hero-banner.liquid` → look for `docs/hero-banner.md`

4. **Report**:
   - **Missing doc**: list the file and suggest running `/feature-doc [name]`. Severity: MEDIUM.
   - **All covered or not needed**: confirm and proceed.
