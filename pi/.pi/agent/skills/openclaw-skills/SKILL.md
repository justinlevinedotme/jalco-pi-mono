---
name: openclaw-skills
description: Create, structure, and refine Agent Skills (OpenClaw format) — the open standard for extending AI agents with specialized knowledge. Use when asked to create a SKILL.md, build an agent skill, write an OpenClaw skill, make a skill for Cursor/VS Code/Claude Code/Copilot/Gemini CLI, or package reusable agent instructions. Triggers include "create a skill", "agent skill", "SKILL.md", "openclaw", ".agents/skills", "skills for my repo", "package this workflow as a skill".
---

# OpenClaw Skills

Create portable agent skills using the open Agent Skills format (agentskills.io). Skills work across 30+ agents including Claude Code, Cursor, VS Code Copilot, Gemini CLI, OpenAI Codex, and pi.

## Format Overview

A skill is a directory with a `SKILL.md` file:

```
skill-name/
├── SKILL.md          # Required: YAML frontmatter + markdown instructions
├── scripts/          # Optional: executable code
├── references/       # Optional: documentation loaded on demand
└── assets/           # Optional: templates, data files
```

### Frontmatter (Required)

```yaml
---
name: skill-name
description: What this skill does. Use when [trigger contexts]. Even if the user doesn't explicitly mention [domain keywords].
---
```

| Field           | Required | Constraints                                                       |
| --------------- | -------- | ----------------------------------------------------------------- |
| `name`          | Yes      | 1-64 chars. Lowercase `a-z`, numbers, hyphens. Must match folder. |
| `description`   | Yes      | 1-1024 chars. Describes capability + when to activate.            |
| `license`       | No       | License name or reference to bundled file.                        |
| `compatibility` | No       | 1-500 chars. Environment requirements.                            |
| `metadata`      | No       | Arbitrary key-value pairs.                                        |
| `allowed-tools` | No       | Space-separated pre-approved tools (experimental).                |

**Name rules**: no uppercase, no leading/trailing/consecutive hyphens, must match parent directory name.

### Body

Markdown instructions the agent follows when the skill activates. No format restrictions — write whatever helps agents perform the task. Keep under 500 lines / 5000 tokens.

## Where Skills Live

| Scope   | Path                         | Purpose                   |
| ------- | ---------------------------- | ------------------------- |
| Project | `.agents/skills/<name>/`     | Cross-client, per-project |
| Project | `.<client>/skills/<name>/`   | Client-specific           |
| User    | `~/.agents/skills/<name>/`   | Cross-client, per-user    |
| User    | `~/.<client>/skills/<name>/` | Client-specific           |

- Project-level skills override user-level on name collision
- `.agents/skills/` is the widely-adopted cross-client convention
- Pi also scans `~/.pi/agent/skills/`

## Progressive Disclosure

Skills load in three tiers to manage context:

1. **Catalog** (~50-100 tokens): `name` + `description` loaded at startup for all skills
2. **Instructions** (<5000 tokens): Full `SKILL.md` body loaded on activation
3. **Resources** (as needed): Scripts, references, assets loaded on demand

This means the **description carries the entire burden of triggering**. Write it carefully.

## Writing Effective Descriptions

The description is the PRIMARY mechanism agents use to decide whether to activate a skill. Follow this pattern:

1. **Capability statement**: What the skill does (1-2 sentences)
2. **Trigger contexts**: When to use it, including non-obvious cases
3. **Keywords**: Domain terms that should activate the skill

```yaml
# Good — specific, trigger-rich
description: >
  Analyze CSV and tabular data files — compute summary statistics,
  add derived columns, generate charts, and clean messy data. Use when
  the user has a CSV, TSV, or Excel file and wants to explore,
  transform, or visualize the data, even if they don't explicitly
  mention "CSV" or "analysis."

# Bad — too vague
description: Helps with data files.
```

Tips:
- Use imperative phrasing: "Use when..." not "This skill does..."
- Focus on user intent, not internal mechanics
- Err on the side of being pushy — list contexts explicitly
- Stay under 1024 characters

## Writing Effective Instructions

### Add what the agent lacks, omit what it knows

Focus on project-specific conventions, non-obvious edge cases, particular tools/APIs. Don't explain what a PDF is or how HTTP works.

### Provide defaults, not menus

Pick a default tool/approach. Mention alternatives briefly.

```markdown
<!-- Bad -->
You can use pypdf, pdfplumber, PyMuPDF, or pdf2image...

<!-- Good -->
Use pdfplumber for text extraction. For scanned PDFs, fall back to
pdf2image with pytesseract.
```

### Favor procedures over declarations

Teach *how to approach* a class of problems, not *what to produce* for a specific instance.

### Calibrate control to fragility

- **High freedom** (text): Multiple valid approaches, context-dependent
- **Medium freedom** (pseudocode): Preferred pattern, some variation OK
- **Low freedom** (exact scripts): Fragile operations, specific sequence required

## Patterns for Skill Content

### Gotchas sections

The highest-value content. Concrete corrections to mistakes the agent will make:

```markdown
## Gotchas
- The `users` table uses soft deletes — include `WHERE deleted_at IS NULL`
- User ID is `user_id` in DB, `uid` in auth, `accountId` in billing
- `/health` returns 200 even if DB is down — use `/ready` instead
```

### Templates for output format

More reliable than prose descriptions. Agents pattern-match against concrete structures.

### Checklists for multi-step workflows

```markdown
## Deployment workflow
- [ ] Step 1: Run tests (`scripts/test.sh`)
- [ ] Step 2: Build artifacts (`scripts/build.sh`)
- [ ] Step 3: Validate (`scripts/validate.sh`)
- [ ] Step 4: Deploy (`scripts/deploy.sh --env staging`)
```

### Validation loops

Instruct the agent to validate its own work before proceeding:

```markdown
1. Make edits
2. Run `python scripts/validate.py output/`
3. If validation fails, fix issues and revalidate
4. Only proceed when validation passes
```

## Using Scripts

### One-off commands (no scripts/ needed)

Reference existing tools with pinned versions:

```bash
uvx ruff@0.8.0 check .          # Python
npx eslint@9 --fix .            # Node
bunx create-vite@6 my-app       # Bun
```

### Self-contained scripts (inline dependencies)

Python with PEP 723:
```python
# /// script
# dependencies = ["beautifulsoup4"]
# ///
from bs4 import BeautifulSoup
# ...
```
Run: `uv run scripts/extract.py`

Deno with npm specifiers:
```typescript
import * as cheerio from "npm:cheerio@1.0.0";
```
Run: `deno run scripts/extract.ts`

Bun with auto-install:
```typescript
import * as cheerio from "cheerio@1.0.0";
```
Run: `bun run scripts/extract.ts`

### Script design for agents

- **No interactive prompts** — agents can't respond to TTY input
- **Include `--help`** — primary way agents learn the interface
- **Helpful error messages** — say what went wrong + what to try
- **Structured output** — JSON/CSV over free-form text; data to stdout, diagnostics to stderr
- **Idempotent** — agents may retry; "create if not exists" > "create and fail on duplicate"
- **Safe defaults** — destructive ops should require `--confirm` or `--force`

## Structuring Large Skills

For complex domains, use `SKILL.md` as a router and split into references:

```
my-platform-skill/
├── SKILL.md           # Decision tree + routing
└── references/
    ├── product-a/
    │   ├── README.md
    │   ├── api.md
    │   └── gotchas.md
    └── product-b/
        ├── README.md
        └── api.md
```

SKILL.md routes to the right reference:
```markdown
## Which Product?
- Cache/key-value → read `references/kv/README.md`
- SQL/relational → read `references/d1/README.md`
- Object storage → read `references/r2/README.md`
```

Keep reference files under 250 lines each. Keep cross-references one level deep.

## Skill Creation Process

### 1. Start from real expertise

Complete a real task, then extract the reusable pattern. Pay attention to:
- Steps that worked
- Corrections you made ("use X instead of Y")
- Context you provided that the agent didn't already know

### 2. Draft the skill

```bash
mkdir -p .agents/skills/my-skill
```

Write `SKILL.md` with frontmatter and concise instructions.

### 3. Test it

Try the skill on real prompts. Check:
- Does it trigger on relevant prompts?
- Does it produce good output?
- Is it adding value vs no skill?

### 4. Iterate

See `references/evaluating.md` for structured eval workflows including test cases, assertions, grading, and benchmarking.

See `references/optimizing-descriptions.md` for systematic description optimization with train/validation splits.

## Validation

Use the reference library to validate skill format:

```bash
npx skills-ref validate ./my-skill
```

Or install via the skills CLI:

```bash
npx skills find [query]        # Search for skills
npx skills add <owner/repo@skill> # Install a skill
npx skills check               # Check for updates
```

## Quick Reference

| Constraint             | Limit               |
| ---------------------- | -------------------- |
| Name length            | 1-64 characters      |
| Name charset           | `a-z`, `0-9`, `-`    |
| Description length     | 1-1024 characters    |
| Compatibility length   | 1-500 characters     |
| SKILL.md body          | <500 lines / <5k tokens |
| Reference files        | <250 lines each      |
| Reference depth        | 1 level from SKILL.md |
