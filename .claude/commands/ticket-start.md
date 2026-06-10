---
name: ticket-start
description: Shopify theme kickoff — fetch ClickUp ticket, classify it, create branch if needed, and produce the right action plan for the ticket type (code, bug, investigation, admin config, Flow, QA, content, design review, etc.)
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Agent
argument-hint: [clickup-ticket-url-or-id]
---

## Ticket Start — Shopify Theme Kickoff

Argument received: `$ARGUMENTS`

You are running as **Opus** — the most capable model. Your job is to think, classify, architect, and delegate. Spawn Sonnet subagents for well-scoped mechanical work (file reads, grepping, boilerplate drafting, translation JSON); review their output before accepting it. Never delegate decisions that require judgment, ambiguity resolution, or architecture choices.

Follow every step in order. Do not produce a final action plan until Step 6 is complete.

---

### Step 1 — Theme Context

**Check first: do you already have theme context from this session?**

- If YES (you've already scanned this project earlier in the session): skip the full scan. Output a one-liner: `↩ Using existing theme context from this session.` and move to Step 2.
- If NO (first ticket of the session, or a different project): run the full scan below.

**Full scan — run in parallel where possible:**

Directory listing: root level + `/sections/`, `/snippets/`, `/assets/`, `/layout/`, `/templates/`, `/locales/`, `/config/`

Read these files:
- `layout/theme.liquid` — global structure, CSS/JS loading, custom elements
- 2–3 representative sections (header, footer, hero or similar)
- `config/settings_schema.json` — theme settings shape
- `locales/en.default.json` (first 100 lines) — translation key conventions
- `assets/` file list — look for `section-*.css`, `component-*.js`, bundler output

Detect and record:
1. Web Components — used? naming pattern? how registered?
2. CSS methodology — BEM? utility? mixed?
3. Section schemas — blocks-heavy or simple settings?
4. JS loading — `defer`, `async`, ES modules, bundled?
5. Custom events — any global events (cart update, variant change, etc.)?
6. Templates — JSON or `.liquid`?
7. Base — Dawn-based? Custom? Horizon?
8. Anything unusual

Output the **Theme Context** block:

```
🏗️ THEME CONTEXT
──────────────────────────────
Base:          [Dawn / Horizon / Custom / etc.]
CSS:           [BEM / utility / mixed]
JS pattern:    [Component class / Web Components / vanilla]
Templates:     [JSON / liquid]
JS loading:    [defer / async / modules]
Custom events: [list or "none found"]
Blocks:        [heavy use / light use]
Notable:       [anything else worth knowing]
──────────────────────────────
```

---

### Step 2 — Fetch the ClickUp Ticket

Extract the ticket ID from `$ARGUMENTS`:
- URL `https://app.clickup.com/t/{ID}` → extract `{ID}`
- If already just an ID, use it directly

Use `clickup_get_task` to fetch. Pull: title, full description, status, assignees, tags/labels, subtasks, comments, any linked Figma URLs or attachments.

Display a clean summary:

```
📋 TICKET: [{ID}] — {Title}
Status:   {status}
Assigned: {assignees}

WHAT NEEDS TO BE DONE:
{Plain-language 3–5 sentence summary}

DESIGN REFS:  {Figma links / screenshots / "none"}
SUBTASKS:     {list or "none"}
KEY COMMENTS: {anything relevant or "none"}
```

---

### Step 3 — Classify the Ticket

Read the ticket carefully and assign it to exactly one type. Use your judgment — don't force-fit:

| Type | When to use |
|------|-------------|
| **Code / Feature** | New Liquid section, block, snippet, JS component, CSS, theme customization |
| **Bug Fix** | Something is broken, broken rendering, wrong behavior, error in theme |
| **Investigation / Research** | Explore how something works, evaluate options, spike, proof of concept |
| **Shopify Admin** | Configure products, collections, metafields, metaobjects, navigation — no code |
| **Shopify Flow** | Build or debug a Shopify Flow automation |
| **QA / Testing** | Verify something works, write test plan, reproduce a reported issue |
| **Content / Copy** | Update visible text, translations, locale files |
| **Design Review** | Review Figma designs, give feedback, no code yet |
| **Other** | Anything that doesn't fit — explain why |

Output:

```
🏷️ TICKET TYPE: {Type}
Reason: {1–2 sentence explanation of why this classification fits}
```

---

### Step 4 — Branch (only for Code / Feature and Bug Fix tickets)

For all other ticket types, skip this step entirely — no branch needed.

#### 4a — Check repo state

Run `git status` and `git stash list` before doing anything.

Determine the state:

| State | What it means | What to do |
|-------|--------------|------------|
| Clean | No uncommitted changes | Proceed normally |
| Dirty — untracked files only | New files not staged | Ask: keep them (they'll stay on the new branch) or discard? |
| Dirty — staged or modified | Uncommitted work in progress | Ask: stash it, commit it as WIP, or discard? Wait for answer |
| On a feature branch already | Might be mid-task | Ask: is this the same ticket or a different one? |

Present what you found clearly:

```
🗂️ REPO STATE
──────────────────────────────
Branch:    {current-branch}
Status:    {clean / dirty}
Changes:   {list of files or "none"}
Stashes:   {N stashes or "none"}
──────────────────────────────
```

If the repo is dirty, ask the user what to do and wait for the answer before proceeding. Do not create a branch while there are unresolved uncommitted changes.

#### 4b — Confirm base branch

Ask:

> **Before I create the branch:**
>
> 1. Which base branch? `develop` *(default — recommended)* / `main` / other?
> 2. Is git available and the repo already cloned in the current working directory?

Wait for the answer.

#### 4c — Generate the branch name

Pick the correct prefix based on ticket type:

| Prefix | When to use |
|--------|-------------|
| `feature/` | New functionality, new section, block, component |
| `fix/` | Bug fix — something broken in the theme |
| `hotfix/` | Critical production fix, must go to `main` immediately |
| `chore/` | Refactor, cleanup, dependency update, no user-visible change |
| `content/` | Locale changes, copy updates, translations |
| `style/` | CSS-only visual adjustments, no logic change |

Name format: `{prefix}/{ticket-id}-{slug}`

Rules for `{slug}`:
- 2–4 words max — one clear phrase that describes what the ticket does
- Lowercase, hyphen-separated
- No filler words (add, update, fix, implement — only if truly necessary)
- Must be readable at a glance: `feature/86ca177cj-sticky-header`, not `feature/86ca177cj-add-the-sticky-navigation-header-on-scroll-behavior`

Good examples:
- `feature/86ca177cj-sticky-header`
- `fix/9kx23ab-cart-quantity-bug`
- `hotfix/zq12mno-checkout-crash`
- `content/pp44xyz-homepage-copy`

Bad examples (too long / unclear):
- `feature/86ca177cj-add-mobile-navigation-menu-toggle-functionality`
- `fix/9kx23ab-fixed-the-cart`

#### 4d — Create the branch

1. `git fetch origin`
2. `git checkout {base-branch} && git pull origin {base-branch}`
3. `git checkout -b {branch-name}`
4. Confirm:

```
✅ Branch created
   Name:  {branch-name}
   From:  {base-branch} (up to date)
```

---

### Step 5 — Clarifying Questions

For **any** ticket type: if there are genuine ambiguities that would change your approach, ask them now. Keep it to 1–3 focused questions maximum.

> **Before I write the plan, {N} things aren't clear:**
>
> 1. {Specific question}
> 2. {Specific question}

If the ticket is clear and unambiguous, skip this step and say: *"Ticket is clear — proceeding."*

Wait for answers before writing the action plan.

---

### Step 6 — Action Plan

Choose the section below that matches the ticket type from Step 3. Output only that plan — do not output plans for other types.

---

#### Code / Feature Plan

```
🗺️ DEV PLAN — [{ticket-id}]: {Title}
Branch: {branch-name}

FILES TO TOUCH:
• {file-path}  →  {what changes / why}
• {file-path}  →  {new file — what it does}

IMPLEMENTATION ORDER:
1. {First step — specific action, specific file}
2. {Second step}
3. ...

EDGE CASES / WATCH OUT FOR:
• {Browser quirk, theme conflict, a11y concern, etc.}
```

**🤖 DELEGATION STRATEGY:**
- **Opus (me) handles:** architecture decisions, schema design, ambiguous logic, final code review
- **Delegate to Sonnet:** file reads & grepping for existing patterns, drafting boilerplate Liquid/schema JSON, generating translation key JSON, writing repetitive settings blocks
- I will spawn subagents via the Agent tool for delegated tasks and review their output before accepting

```
──────────────────────────────
Ready. Give me a command to start.
```

---

#### Bug Fix Plan

```
🐛 BUG PLAN — [{ticket-id}]: {Title}
Branch: {branch-name}

REPRODUCTION STEPS:
1. {Step to reproduce based on ticket description}
2. ...

HYPOTHESES (ordered by likelihood):
1. {Most likely cause — explain reasoning}
2. {Second hypothesis}
3. {Other possibilities}

FILES TO INSPECT FIRST:
• {file-path}  →  {what to look for}
• {file-path}  →  {what to look for}

HOW TO CONFIRM THE FIX:
• {What behavior proves the bug is resolved}
• {Any regression to watch for}
```

**🤖 DELEGATION STRATEGY:**
- **Opus (me) handles:** root cause analysis, deciding the fix approach, reviewing the patch
- **Delegate to Sonnet:** reading and grepping files for the suspected issue, searching for similar patterns elsewhere in the codebase

```
──────────────────────────────
Ready. Tell me to start investigating.
```

---

#### Investigation / Research Plan

```
🔍 RESEARCH PLAN — [{ticket-id}]: {Title}

QUESTION TO ANSWER:
{What specific decision or understanding does this investigation need to produce?}

RESEARCH APPROACH:
1. {First thing to read / trace / test}
2. {Second angle}
3. {Third angle if relevant}

EXPECTED DELIVERABLE:
{Recommendation doc / spike summary / comparison table / decision + rationale}

WHEN TO STOP:
{What "done" looks like — enough to make a decision, not exhaustive}
```

**🤖 DELEGATION STRATEGY:**
- **Opus (me) handles:** synthesis, recommendation, final judgment
- **Delegate to Sonnet:** reading documentation, tracing code paths, collecting raw data

```
──────────────────────────────
Ready. Tell me to start the research.
```

---

#### Shopify Admin Config Plan

```
⚙️ ADMIN CONFIG PLAN — [{ticket-id}]: {Title}

STEPS (in order):
1. Go to: {Shopify Admin URL / section}
   → {What to set, create, or configure}
2. ...

VERIFICATION:
• {How to confirm it's set up correctly}
• {What to check in the storefront}

NOTES:
• {Any gotchas, order dependencies, or things to watch out for}
```

No branch needed. No code changes.

---

#### Shopify Flow Plan

```
⚡ FLOW PLAN — [{ticket-id}]: {Title}

TRIGGER:
{Event that starts the flow — order created, tag added, etc.}

CONDITIONS:
• {Condition 1 — what to check}
• {Condition 2}

ACTIONS:
1. {First action — what it does}
2. {Second action}

DATA AVAILABLE:
• {What fields / metafields are accessible at each step}

GOTCHAS:
• {Flow limitations — payload size, timing, unsupported actions}
• {Things that commonly break or behave unexpectedly}

VERIFICATION:
• {How to test the flow without triggering it on real orders}
```

---

#### QA / Testing Plan

```
🧪 QA PLAN — [{ticket-id}]: {Title}

TEST SCENARIOS:
Happy path:
• {What normal correct behavior looks like}

Edge cases:
• {Empty state / missing data}
• {Long content / unusual input}
• {Metafield not set}

Responsive:
• {Mobile — specific breakpoints to check}
• {Desktop}

Accessibility:
• {Keyboard navigation}
• {Screen reader behavior}
• {Color contrast}

HOW TO REPRODUCE / VERIFY:
1. {Step-by-step}

PASS CRITERIA:
• {What "passed QA" means for this ticket}
```

---

#### Content / Copy Plan

```
📝 CONTENT PLAN — [{ticket-id}]: {Title}

LOCALE FILES TO EDIT:
• {locales/en.default.json}  →  {keys to add or change}
• {locales/en.default.schema.json}  →  {schema label keys}

KEYS:
| Key | Current value | New value |
|-----|--------------|-----------|
| {key} | {current or "new"} | {new value} |

SCHEMA FILES (if labels change):
• {sections/file.liquid}  →  {which setting labels update}

VERIFICATION:
• {Where to see the text in the storefront / theme editor}
```

---

#### Design Review Plan

```
🎨 DESIGN REVIEW PLAN — [{ticket-id}]: {Title}

FIGMA REFERENCE:
{URL and node name}

REVIEW CHECKLIST:
Colors:
• [ ] All colors from approved palette (no off-palette values)
• [ ] Correct color scheme for context

Typography:
• [ ] Correct font role (Cormorant for headings, Figtree for body)
• [ ] Heading levels follow hierarchy (H1 → H2 → H3)
• [ ] Sizes match type scale

Layout:
• [ ] Respects 1440px max-width with 16px/40px margins
• [ ] Mobile-first — mobile layout defined and intentional
• [ ] Spacing uses design system tokens

Components:
• [ ] Reuses existing sections/blocks where possible
• [ ] New components justified if present

QUESTIONS FOR DESIGN:
• {Specific ambiguity or concern to raise}
```

---

### Notes for re-entry

**First ticket in a new session:** run the full theme scan in Step 1.

**Subsequent tickets in the same session:** Step 1 is skipped — existing context reused.

**Returning to a ticket in a new session:** re-run `/ticket-start {url}` — it will re-scan the theme, re-read the ticket, and reconstruct context.

**Starting a different ticket:** `/ticket-start {new-url}` — classify and plan fresh; theme scan only if no context exists.
