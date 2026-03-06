---
name: pi-skills
description: Create and manage pi skills with proper SKILL.md format, frontmatter, and organization. Use for skill creation, naming conventions, bundled resources (scripts/references/assets), progressive disclosure patterns, and MCP-to-CLI conversion via MCPorter. Use proactively when user says "create a skill", "SKILL.md", "convert MCP server", "MCPorter", or asks about skill structure.
---

# Pi Skills

Create loadable knowledge modules that enhance agent capabilities.

A skill is a markdown file with optional bundled resources (scripts, references, assets) that provides specialized knowledge, workflows, or tool integrations. Skills are loaded on-demand when needed.

## How Skills Work

**Progressive Disclosure**: Skills use a three-level loading system to manage context efficiently:

1. **Metadata (name + description)** - Always in context at startup (~100 words)
2. **SKILL.md body** - Loaded when skill triggers (<5k words / 500 lines)
3. **Bundled resources** - Loaded as needed by the agent (unlimited)

**Runtime Flow** (using grep_app as example):

1. Agent starts, scans `~/.pi/agent/skills/`, sees `grep_app/SKILL.md` frontmatter
2. User says "search GitHub for useState examples"
3. Agent sees description, decides grep_app is relevant
4. Agent reads full SKILL.md to learn the CLI commands
5. Agent runs: `bun ~/.pi/agent/skills/grep_app/grep_app.js searchGitHub --query "useState("`
6. CLI executes, prints results to stdout
7. Agent reads results, responds to user

## Skill Location & Structure

**Path**: `~/.pi/agent/skills/<skill-name>/`

**Directory Structure**:
```
~/.pi/agent/skills/my-skill/
├── SKILL.md           # REQUIRED - Main skill definition
├── package.json       # Optional - npm dependencies for scripts
├── scripts/           # Optional - Executable scripts
│   └── validate.sh
├── references/        # Optional - Reference documents loaded on-demand
│   └── schema.md
└── assets/            # Optional - Files used in output (templates, data)
    └── template.json
```

**Naming Rules**:
- Lowercase kebab-case: `my-skill` (not `My-Skill` or `my_skill`)
- Folder name SHOULD match `name` in frontmatter for consistency

## SKILL.md Format

### Frontmatter (Required)

```yaml
---
name: my-skill-name
description: [Capability summary]. Use for [use cases]. Use proactively when [trigger contexts].
---
```

**Description Pattern** (CRITICAL for discovery):

The description is the PRIMARY triggering mechanism. It MUST include:

1. **Capability statement**: What the skill does (1-2 sentences)
2. **Use cases**: Specific scenarios or tasks
3. **Triggers**: Keywords or phrases that should activate this skill

**Example**:
```yaml
description: Search real-world code examples across a million GitHub repositories. Use when you need to find actual code patterns, library usage examples, or implementation patterns. Triggers include "search GitHub for", "find code examples of", "how do developers use", "show real-world usage of", or any need to see production code patterns.
```

### Body (Required)

The body provides full instructions for using the skill. Keep it focused and under 500 lines.

**Recommended Sections**:

```markdown
# Skill Title

Brief overview of what this skill enables.

## Setup

Any required environment variables, installation steps, or one-time configuration.

## Usage

Show the actual commands with examples. Use absolute paths from skill directory.

## Tools / Commands

List each tool/command with description and parameters.

## Patterns

Common workflows or usage patterns.

## Troubleshooting

Common issues and solutions.
```

## Bundled Resources

### Scripts (`scripts/`)

Executable code (bash, Node.js, Python, etc.) for tasks requiring deterministic reliability or repeated execution.

**When to include**:
- The same code is being rewritten repeatedly
- Deterministic reliability is needed
- Complex API interactions

**Example**: `scripts/rotate_pdf.py` for PDF rotation tasks

**Setup with npm dependencies**:
```
my-skill/
├── SKILL.md
├── package.json       # Declares dependencies
└── scripts/
    └── search.js      # Uses dependencies from package.json
```

Run `npm install` or `bun install` in the skill directory to install dependencies.

**Reference in SKILL.md**:
```markdown
## Usage

```bash
bun ~/.pi/agent/skills/my-skill/scripts/search.js "query"
```
```

### References (`references/`)

Documentation and reference material loaded on-demand to inform the agent's process.

**When to include**:
- Detailed documentation that would bloat SKILL.md
- Database schemas, API docs, domain knowledge
- Company policies or templates
- Detailed workflow guides

**Benefits**:
- Keeps SKILL.md lean
- Loaded only when needed
- Avoids context bloat

**Best Practice**: If files are large (>10k words), include grep search patterns in SKILL.md

**Reference in SKILL.md**:
```markdown
See `references/schema.md` for the complete database schema.
```

**Reference-First Pattern for Complex Skills**:

When a skill covers a large platform (many products, APIs, or modes), structure references by product and keep SKILL.md as a router.

```
my-platform-skill/
├── SKILL.md           # Decision tree + routing logic
└── references/
    ├── product-a/
    │   ├── README.md
    │   ├── api.md
    │   ├── configuration.md
    │   ├── patterns.md
    │   └── gotchas.md
    └── product-b/
        ├── README.md
        ├── api.md
        └── gotchas.md
```

**SKILL.md as Router**:
```markdown
## Which Product?

Need to store data?
├─ Cache/read-heavy key-value → `references/kv/`
├─ SQL queries and relational data → `references/d1/`
├─ Object/blob storage → `references/r2/`
└─ Stateful per-entity coordination → `references/durable-objects/`

Once you've identified the product, read:
1. `references/<product>/README.md` - Overview and when to use
2. For setup: `references/<product>/configuration.md`
3. For implementation: `references/<product>/api.md` and `references/<product>/patterns.md`
4. For debugging: `references/<product>/gotchas.md`
```

**Reference File Standards**:

Each product directory should have:
- `README.md`: Overview, When to use, When not to use, See also
- `api.md`: Core APIs, Parameters, Return values, Examples
- `configuration.md`: Required config, Optional config, Environment notes
- `patterns.md`: Common workflows, Recommended architecture, Performance patterns
- `gotchas.md`: Limits, Common errors, Debug checklist

**Gotchas Template**:
```markdown
## <Problem Name>

**Symptom**: <error text or behavior>
**Root cause**: <underlying reason>
**Fix**: <specific remediation steps>

```language
// BAD
...

// GOOD
...
```
```

### Assets (`assets/`)

Files not loaded into context, but used in the output the agent produces.

**When to include**:
- Templates, images, icons
- Boilerplate code
- Sample documents that get copied or modified

**Example**: `assets/template.html` for HTML boilerplate

**Benefits**: Separates output resources from documentation

## Core Principles

### Concise is Key

The context window is a public good. Skills share context with system prompt, conversation history, and other skills.

**Default assumption: The agent is already very smart.**

Only add context the agent doesn't already have. Challenge each piece: "Does the agent really need this?" and "Does this justify its token cost?"

Prefer concise examples over verbose explanations.

### Set Appropriate Degrees of Freedom

Match specificity to task fragility:

- **High freedom** (text instructions): Multiple approaches valid, context-dependent decisions
- **Medium freedom** (pseudocode with parameters): Preferred pattern exists, some variation acceptable
- **Low freedom** (specific scripts): Operations fragile, consistency critical, specific sequence required

### Progressive Disclosure

- Keep SKILL.md body under 500 lines
- Split complex content into `references/`
- Load reference files on-demand
- Keep cross-references one level deep (SKILL.md → reference, no deep chains)

### What NOT to Include

Do NOT create extraneous documentation:
- README.md (SKILL.md IS the readme)
- INSTALLATION_GUIDE.md
- QUICK_REFERENCE.md
- CHANGELOG.md

Skills should only contain information needed for the agent to do the job.

## Skill Creation Process

### 1. Understand with Concrete Examples

Start by understanding how the skill will be used:
- "What functionality should this skill support?"
- "Can you give examples of how this skill would be used?"
- "What would a user say that should trigger this skill?"

### 2. Plan Reusable Contents

Analyze examples to identify reusable resources:
- Scripts (repeated code, API integrations)
- References (schemas, documentation, domain knowledge)
- Assets (templates, boilerplate, files for output)

### 3. Create the Skill

#### Option A: Create from Scratch

```bash
mkdir -p ~/.pi/agent/skills/my-skill
touch ~/.pi/agent/skills/my-skill/SKILL.md
```

Add frontmatter and body following the format above.

#### Option B: Convert MCP Server with MCPorter

For MCP servers, use MCPorter to generate a standalone CLI:

**Step 1: Discover Available MCP Servers**

```bash
npx mcporter list
```

**Step 2: Inspect Server Tools**

```bash
npx mcporter list <server-name> --all-parameters
```

Review tool signatures and parameters.

**Step 3: Generate CLI**

Try compiled binary first (standalone, no runtime):
```bash
npx mcporter generate-cli <server-name> --compile --output /tmp/mcporter-gen/<server-name>
```

If compile fails, use bundled JS (requires bun):
```bash
npx mcporter generate-cli <server-name> --bundle /tmp/mcporter-gen/<server-name>.js
```

**Step 4: Test the CLI**

```bash
bun /tmp/mcporter-gen/<server-name>.js
```

Pick one tool and test it.

**Step 5: Install as Skill**

```bash
mkdir -p ~/.pi/agent/skills/<server-name>
cp /tmp/mcporter-gen/<server-name>.js ~/.pi/agent/skills/<server-name>/
```

**Step 6: Write SKILL.md**

Create `~/.pi/agent/skills/<server-name>/SKILL.md` with:
- Frontmatter: name, description (what tools do, when to use)
- Setup: Any required env vars or auth
- Usage: Show CLI commands with examples for each tool
- Tool Reference: List each tool with parameters

Use output from `npx mcporter list <server-name> --all-parameters` as reference.

**Step 7: Clean Up**

```bash
rm -f ./<server-name>.ts  # Remove template if created
```

### 4. Implement Resources

**Scripts**: Create executable files in `scripts/`, add shebang, make executable
**References**: Create markdown files in `references/`
**Assets**: Add templates, data files to `assets/`

If using npm dependencies, create `package.json` and run `npm install` or `bun install`.

Test scripts by actually running them.

### 5. Write SKILL.md

Follow the format above:
- Complete frontmatter with comprehensive description
- Clear setup instructions
- Concrete usage examples with full paths
- Reference bundled resources

**Writing Guidelines**:
- Use imperative/infinitive form
- Include "when to use" information in description, NOT in body
- Body is only loaded after triggering

### 6. Iterate

Use the skill on real tasks and refine:
1. Notice struggles or inefficiencies
2. Identify improvements to SKILL.md or bundled resources
3. Implement changes and test again

## Examples

### Simple Bash Script Skill

```
~/.pi/agent/skills/transcribe/
├── SKILL.md
└── transcribe.sh
```

**SKILL.md**:
```markdown
---
name: transcribe
description: Speech-to-text transcription using Groq Whisper API. Supports m4a, mp3, wav, ogg, flac, webm. Use when user needs to transcribe audio files.
---

# Transcribe

Speech-to-text using Groq Whisper API.

## Setup

Requires `GROQ_API_KEY` environment variable.

## Usage

```bash
bash ~/.pi/agent/skills/transcribe/transcribe.sh <audio-file>
```
```

### MCP-Generated CLI Skill

```
~/.pi/agent/skills/grep_app/
├── SKILL.md
└── grep_app.js
```

**SKILL.md**: See `references/mcporter-example.md` for complete example.

### Complex Platform Skill

```
~/.pi/agent/skills/cloudflare/
├── SKILL.md
├── references/
│   ├── kv/
│   │   ├── README.md
│   │   ├── api.md
│   │   └── gotchas.md
│   └── d1/
│       ├── README.md
│       ├── api.md
│       └── gotchas.md
└── scripts/
    └── deploy.sh
```

## Validation

After creating a skill, test it:

1. Restart pi or wait for hot-reload
2. Verify skill appears in skill list
3. Test triggering: Ask a question that should activate the skill
4. Verify the agent loads and uses the skill correctly

## Best Practices

### MUST
- Use the three-part description pattern (capability + use cases + triggers)
- Keep SKILL.md focused and under 500 lines
- Use `references/` for detailed documentation
- Include validation steps
- Use absolute paths from skill directory in examples

### SHOULD
- Prefer bash scripts for simple tasks
- Use npm/bun scripts only when bash + curl insufficient
- Test all scripts before publishing
- Include gotchas.md for complex domains
- Keep reference files under 250 lines each

### MUST NOT
- Create overly broad skills (prefer focused, composable skills)
- Duplicate content from other skills
- Include secrets or credentials in skill files
- Create deep reference chains (>1 level)
- Add extraneous documentation files

## Related Resources

See `references/mcporter-example.md` for a complete MCPorter workflow example.
See `references/workflows.md` for sequential workflow patterns.
See `references/output-patterns.md` for template and example patterns.
