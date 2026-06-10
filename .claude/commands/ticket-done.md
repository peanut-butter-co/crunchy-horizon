---
name: ticket-done
description: Final review before closing a ticket — validates work is complete, cleans up, commits and pushes for code tickets, or marks completion for non-code tickets (admin config, research, QA, content, design review, Flow)
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Agent
argument-hint: [target-branch for PR, default: develop]
---

## Ticket Done — Final Review and Close

Argument received: `$ARGUMENTS` (PR target branch, default: `develop`)

You are running as **Opus**. Think carefully before acting. Delegate mechanical checks to Sonnet subagents where it makes sense; review their output before accepting.

Do NOT commit or push until the user explicitly confirms.

---

### Step 1 — Determine Ticket Type

Check if you have context from `/ticket-start` earlier in this session. If yes, you already know the ticket type — skip the re-fetch and use that classification.

If no context exists, ask the user:
> What type of ticket is this? (code/feature, bug fix, admin config, investigation, Flow, QA, content, design review)

Or fetch from ClickUp if the ticket ID is known: use `clickup_get_task` and classify using the same criteria as `ticket-start`.

Output:
```
🏷️ TICKET TYPE: {Type}
```

Then follow only the section below that matches. Skip all other sections.

---

## For Code / Feature and Bug Fix tickets

### Step 2 — Review all branch changes

Run:
```
git diff develop...HEAD --name-only
git status
```

List all modified, created, or deleted files. Keep this list in mind for the steps ahead.

> Delegate to Sonnet: run the git commands and collect the file list if the diff is large.

---

### Step 3 — Clean up playground/debug files

Search for and remove any browser playground or debug artifacts:

```
find . -name "*.playground" -o -name ".playground" -o -name "playground.*"
```

Also check for files named `playground`, `test-`, `debug-`, `temp-` that shouldn't be in the repo.

If found: `git rm {file}` and note what was removed.

---

### Step 4 — Line-by-line review of each changed file

For **each modified or created file**, run `git diff develop...HEAD -- {file}` and review:

**Code (general):**
- Any `console.log`, `debugger`, `TODO`, `FIXME`, or temp comments that shouldn't ship?
- Any commented-out code with no clear reason to keep?
- Any unused variables or functions?
- Does the new code break or interfere with existing logic in the same file?

**Liquid / Sections:**
- Is the schema structure intact? Are `blocks`, `settings`, and `presets` well-formed?
- Are Liquid filters and variables used correctly?
- Was anything that existed before accidentally broken?

**CSS:**
- Are BEM classes consistent with the rest of the theme?
- Do any styles bleed into global selectors or other sections?
- Do all custom properties used actually exist in the theme?

**JavaScript / Web Components:**
- Are event listeners cleaned up properly (no memory leaks)?
- Are custom events emitted with the correct name and expected payload?
- Did the change break any other components that listen to those events?

**Locale files:**
- Do new keys follow the existing naming convention?
- Were any existing keys accidentally deleted or overwritten?

> Delegate to Sonnet: reading each file's diff and flagging issues. Opus reviews the flagged list and decides what to fix.

---

### Step 5 — Verify reusable components

Search the repo for any snippet, component, or function you touched that's used elsewhere:

```
grep -r "{snippet-or-function-name}" --include="*.liquid" --include="*.js" .
```

For each use found outside the files you modified, confirm the change doesn't break that usage.

---

### Step 6 — Verify ticket completion

Re-read the ticket (use `clickup_get_task` if ID is available, or ask the user).

Check point by point:
- ✅ Every requirement in the ticket was implemented
- ✅ Every subtask was completed
- ✅ All acceptance criteria are met
- ✅ Design references (Figma, screenshots) are respected

If something is missing, flag it before continuing.

---

### Step 7 — Documentation check

Check if this feature needs a doc in `docs/`. A doc is needed if:
- New files were created in `blocks/`, `sections/`, or `snippets/` with schema settings
- The feature reads metafields or metaobjects
- The feature has non-obvious logic a future developer would need to understand

If a doc is needed and doesn't exist in `docs/`:
> ⚠️ Missing doc: suggest running `/feature-doc [name]` before closing the ticket.

If already exists or not needed: ✅ note it.

---

### Step 8 — Final report

```
📋 FINAL REPORT
──────────────────────────────
Files modified:   {N}
Files created:    {N}
Files deleted:    {N}
Playground files: {list or "none"}

TICKET:
✅ {requirement 1 met}
✅ {requirement 2 met}
⚠️  {anything to note, if any}

CODE REVIEW:
✅ No console.log or debugger
✅ No unnecessary commented code
✅ Reusable components unaffected
✅ CSS doesn't bleed into other sections
✅ Locale keys intact

DOCUMENTATION:
✅ {doc exists / not needed / needs /feature-doc}

ISSUES FOUND:
{list of issues, or "None"}
──────────────────────────────
Confirm to commit and push?
```

Wait for user confirmation. Do NOT continue without it.

---

### Step 9 — Commit, Push, and PR

Only after user confirms:

1. If playground files were removed: `git add -A`
2. Generate commit message:
   - Format (Conventional Commits): `{type}({scope}): {short description}`
   - Example: `feat(product): add mobile typography preset per block`
3. `git add -A && git commit -m "{message}"`
4. `git push origin {current-branch}`
5. Create PR toward target branch (`$ARGUMENTS` or `develop` by default):
   ```
   gh pr create --base {target} --title "{type}({scope}): {title}" --body "## What\n{summary}\n\n## How to test\n{test steps}\n\n## Checklist\n- [ ] Tested on mobile\n- [ ] Tested on desktop\n- [ ] No console errors"
   ```
6. Confirm:

```
✅ PR created
   Branch:  {branch} → {target}
   Commit:  {message}
   PR:      {url}
```

---

## For Investigation / Research tickets

### Step 2 — Deliverable review

Check what was produced:
- Is there a written summary, recommendation, or spike doc?
- Does it answer the original question from the ticket?
- Are next steps or follow-up tickets identified?

If a doc was produced, confirm it's saved somewhere accessible (docs/, a comment on the ticket, or a shared location).

### Step 3 — Update the ClickUp ticket

Use `clickup_update_task` or `clickup_create_task_comment` to:
- Post a summary of the findings as a comment
- Mark the task as done / complete

```
✅ Investigation closed
   Findings: {one-liner summary}
   Next steps: {follow-up tickets or "none"}
```

---

## For Shopify Admin Config tickets

### Step 2 — Verify the configuration

Go through the config that was set up and confirm:
- All required items were created (products, collections, metafields, metaobjects, navigation)
- Values and settings match what the ticket specified
- Storefront reflects the changes correctly

### Step 3 — Update the ClickUp ticket

Comment on the ticket with what was configured and how to verify it. Mark as done.

```
✅ Admin config complete
   Configured: {list of what was set up}
   Verify at:  {storefront URL or admin path}
```

---

## For Shopify Flow tickets

### Step 2 — Verify the Flow

Confirm:
- Flow is published (or saved as draft if not ready to go live)
- Trigger, conditions, and actions match the spec
- Flow was tested on a test order or staging environment (if possible)
- Edge cases (missing data, failed action) handled

### Step 3 — Update the ClickUp ticket

Document the final flow structure in a comment. Mark as done.

```
✅ Flow complete
   Trigger:  {event}
   Actions:  {list}
   Status:   {published / draft}
```

---

## For QA / Testing tickets

### Step 2 — Compile test results

Summarize what was tested:
- Which scenarios passed
- Which failed (with details)
- Any blockers found

### Step 3 — Create follow-up tickets if needed

If bugs were found, create a `fix/` ticket in ClickUp for each one. Note the ticket IDs.

### Step 4 — Update the ticket

Post results as a comment. Mark as done (or blocked if critical bugs found).

```
✅ QA complete
   Passed:   {N} scenarios
   Failed:   {N} scenarios
   Bugs filed: {ticket IDs or "none"}
```

---

## For Content / Copy tickets

### Step 2 — Review locale changes

Run `git diff develop...HEAD -- locales/` and confirm:
- New keys were added correctly
- Existing keys were not accidentally modified
- Key names follow the existing conventions

### Step 3 — Commit and push

Commit message format: `chore(locales): {description}`

Push and create PR if the content change is in the codebase. If it was done directly in Shopify Admin (theme editor), skip the PR and just mark the ticket done.

```
✅ Content update complete
   Keys added:    {list}
   Keys modified: {list or "none"}
```

---

## For Design Review tickets

### Step 2 — Compile review notes

Summarize feedback:
- Issues found (color, typography, spacing, component reuse)
- Questions raised for design
- Approval status: approved / approved with notes / needs revision

### Step 3 — Post feedback

Add a comment on the ClickUp ticket with the full review. Tag the designer if revisions are needed.

```
✅ Design review complete
   Status:   {approved / needs revision}
   Notes:    {summary or "see ticket comment"}
```
