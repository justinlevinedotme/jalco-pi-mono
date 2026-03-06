---
description: Generate a CLI from an MCP server using MCPorter and install it as a pi skill
---

# MCPorter → Pi Skill Generator

Convert an MCP server into a standalone CLI tool and install it as a pi skill.

## Steps

### 1. Discover available MCP servers

If the user didn't specify a server, list what's available:

```bash
npx mcporter list 2>&1
```

### 2. Inspect the server's tools

```bash
npx mcporter list $1 --all-parameters 2>&1
```

Review the tool signatures. Note which tools are most useful and what parameters they require.

### 3. Generate the CLI

Generate a Bun-compiled binary (single file, no runtime dependency):

```bash
npx mcporter generate-cli $1 --compile --output /tmp/mcporter-gen/$1.ts 2>&1
```

If `--compile` fails, fall back to a bundled JS file that runs with `bun`:

```bash
npx mcporter generate-cli $1 --bundle /tmp/mcporter-gen/$1.js 2>&1
```

### 4. Test the generated CLI

Run the CLI with no arguments to see its help output:

```bash
bun /tmp/mcporter-gen/$1.js 2>&1
```

If a compiled binary was produced, test that instead:

```bash
/tmp/mcporter-gen/$1 2>&1
```

Pick one tool and do a smoke test to confirm it works. If the server requires auth (API keys, OAuth), note this for the SKILL.md.

### 5. Install as a pi skill

Create the skill directory and move the CLI into it:

```bash
mkdir -p ~/.pi/agent/skills/$1
```

Copy the CLI binary/bundle:

```bash
cp /tmp/mcporter-gen/$1.js ~/.pi/agent/skills/$1/ 2>/dev/null
cp /tmp/mcporter-gen/$1 ~/.pi/agent/skills/$1/ 2>/dev/null
```

### 6. Write the SKILL.md

Create `~/.pi/agent/skills/$1/SKILL.md` with:

- **Frontmatter**: `name` and `description` (describe what the MCP tools do and when to use them)
- **Setup**: Any required environment variables or auth steps
- **Usage**: Show the actual CLI commands with examples for each tool
- **Tool Reference**: List each tool with its parameters and what it does

Use the output from `npx mcporter list $1 --all-parameters` as the reference for tool signatures.

Template:

```markdown
---
name: $1
description: <What this tool does and when to use it. Be specific about triggers.>
---

# $1

CLI generated from the $1 MCP server via [MCPorter](https://github.com/steipete/mcporter).

## Setup

<Any required env vars, auth steps, or one-time setup>

## Usage

<Show bun or binary invocation for each tool with examples>

## Tools

<List each tool with description and parameters>
```

### 7. Verify skill registration

The skill should appear when pi starts. Confirm the SKILL.md is valid:

```bash
head -5 ~/.pi/agent/skills/$1/SKILL.md
```

### 8. Clean up

Remove the mcporter-generated `.ts` template from the working directory if one was created:

```bash
rm -f ./$1.ts
```

## Notes

- MCPorter auto-discovers MCP servers from Cursor, Claude, Codex, Windsurf, OpenCode, and VS Code configs
- Bundled CLIs require `bun` to run. Compiled binaries are standalone.
- For ad-hoc servers not in any config: `npx mcporter generate-cli --command "npx -y <package>" --compile`
- For HTTP MCP servers: `npx mcporter generate-cli --http-url https://example.com/mcp --compile`
- If a server needs OAuth, run `npx mcporter auth <server>` first
- The generated CLI embeds the MCP server definition, so it works independently of any config file
