# MCPorter Workflow Example: grep_app

Complete example of converting an MCP server into a pi skill using MCPorter.

## Overview

MCPorter converts MCP servers into standalone CLI tools that can be installed as pi skills. This eliminates the need for MCP runtime while preserving the functionality.

## Complete Workflow

### Step 1: Discover Available MCP Servers

```bash
npx mcporter list
```

**Output**:
```
mcporter 0.7.3 — Listing 14 server(s)
- exa (7 tools, 0.6s)
- grep_app (1 tool, 0.8s)
- github (43 tools, 1.4s)
- puppeteer (7 tools, 1.1s)
...
```

Pick a server you want to convert.

### Step 2: Inspect the Server

```bash
npx mcporter list grep_app --all-parameters
```

**Output**:
```
grep_app

  /**
   * Find real-world code examples from over a million public GitHub repositories...
   */
  function searchGitHub(
    query: string,
    matchCase?: boolean,
    matchWholeWords?: boolean,
    useRegexp?: boolean,
    repo?: string,
    path?: string,
    language?: string[]
  );
```

Review tool signatures to understand what the CLI will expose.

### Step 3: Generate the CLI

**Try compiled binary first** (standalone, no runtime dependency):

```bash
mkdir -p /tmp/mcporter-gen
npx mcporter generate-cli grep_app --compile --output /tmp/mcporter-gen/grep_app
```

**If compile fails**, fall back to bundled JS:

```bash
npx mcporter generate-cli grep_app --bundle /tmp/mcporter-gen/grep_app.js
```

**Output**:
```
Generated CLI at ./grep_app.ts
Bundled executable created at /tmp/mcporter-gen/grep_app.js
```

### Step 4: Test the CLI

**View help**:
```bash
bun /tmp/mcporter-gen/grep_app.js
```

**Output**:
```
grep_app — mcp-typescript server on vercel

Usage: grep_app <command> [options]

Embedded tools
  searchGitHub - Find real-world code examples...
    --query <query> [--match-case <true|false>] ...
```

**Smoke test**:
```bash
bun /tmp/mcporter-gen/grep_app.js searchGitHub \
  --query "useState(" \
  --language "TypeScript"
```

**Output**:
```
Repository: mifi/lossless-cut
Path: src/renderer/src/hooks/useUserSettingsRoot.ts
URL: https://github.com/mifi/lossless-cut/blob/master/...

Snippets:
--- Snippet 1 (Line 53) ---
  const [lastAppVersion, setLastAppVersion] = useState(...);
  ...
```

### Step 5: Install as Pi Skill

```bash
mkdir -p ~/.pi/agent/skills/grep_app
cp /tmp/mcporter-gen/grep_app.js ~/.pi/agent/skills/grep_app/
```

### Step 6: Write SKILL.md

Create `~/.pi/agent/skills/grep_app/SKILL.md`:

```markdown
---
name: grep_app
description: Search for real-world code examples across a million GitHub repositories. Use when you need to find actual code patterns, library usage examples, or implementation patterns. Triggers include "search GitHub for", "find code examples of", "how do developers use", "show real-world usage of", or any need to see production code patterns.
---

# grep_app

CLI generated from the grep_app MCP server via [MCPorter](https://github.com/steipete/mcporter).

Search over a million public GitHub repositories to find real-world code examples and usage patterns.

## Setup

No authentication required. The tool connects to the public grep.app service.

## Usage

The CLI is located at `~/.pi/agent/skills/grep_app/grep_app.js` and requires `bun` to run.

### Basic Search

Search for literal code patterns (like grep):

```bash
bun ~/.pi/agent/skills/grep_app/grep_app.js searchGitHub --query "useState("
```

### Search with Language Filter

Find TypeScript examples:

```bash
bun ~/.pi/agent/skills/grep_app/grep_app.js searchGitHub \
  --query "getServerSession" \
  --language "TypeScript,TSX"
```

### Case-Sensitive Search

```bash
bun ~/.pi/agent/skills/grep_app/grep_app.js searchGitHub \
  --query "CORS(" \
  --match-case true \
  --language "Python"
```

### Regular Expression Search

Search across multiple lines using regex:

```bash
bun ~/.pi/agent/skills/grep_app/grep_app.js searchGitHub \
  --query "(?s)useEffect\(\(\) => {.*removeEventListener" \
  --use-regexp true
```

### Filter by Repository

Search within specific repos:

```bash
bun ~/.pi/agent/skills/grep_app/grep_app.js searchGitHub \
  --query "ErrorBoundary" \
  --repo "vercel/"
```

### Filter by File Path

Search in specific file paths:

```bash
bun ~/.pi/agent/skills/grep_app/grep_app.js searchGitHub \
  --query "export default" \
  --path "route.ts"
```

### JSON Output

Get structured output for parsing:

```bash
bun ~/.pi/agent/skills/grep_app/grep_app.js searchGitHub \
  --query "async function" \
  --output json
```

## Tools

### searchGitHub

Find real-world code examples from over a million public GitHub repositories.

**Parameters:**

- `--query <string>` (required) - The literal code pattern to search for
- `--match-case <boolean>` (optional) - Whether the search should be case sensitive
- `--match-whole-words <boolean>` (optional) - Whether to match whole words only
- `--use-regexp <boolean>` (optional) - Whether to interpret the query as a regular expression
- `--repo <string>` (optional) - Filter by repository (e.g., 'facebook/react', 'vercel/')
- `--path <string>` (optional) - Filter by file path (e.g., 'src/components/', '/route.ts')
- `--language <string>` (optional) - Filter by programming language (comma-separated)

**Important Usage Notes:**

✅ **Good queries** (literal code patterns):
- `'useState('`
- `'import React from'`
- `'async function'`

❌ **Bad queries** (keywords/questions):
- `'react tutorial'`
- `'best practices'`

**When to use:**
- Implementing unfamiliar APIs or libraries
- Finding real usage patterns and syntax
- Looking for production-ready examples
- Understanding how libraries work together
```

### Step 7: Clean Up

```bash
rm -f ./grep_app.ts  # Remove temporary template
```

### Step 8: Verify

Restart pi or wait for hot-reload, then test:

```
Search GitHub for useState examples in TypeScript
```

The agent should load the grep_app skill and execute the CLI.

## MCPorter Options

### For Non-Config MCP Servers

If the MCP server isn't in any config file:

```bash
npx mcporter generate-cli --command "npx -y <package>" --compile
```

### For HTTP MCP Servers

```bash
npx mcporter generate-cli --http-url https://example.com/mcp --compile
```

### OAuth Authentication

If a server needs OAuth:

```bash
npx mcporter auth <server-name>
```

Run this before generating the CLI.

## Benefits

- **No MCP runtime dependency** - CLIs are standalone
- **Simpler integration** - Just bash commands
- **Easier debugging** - Direct CLI testing
- **Smaller context** - No MCP protocol overhead
- **Works anywhere** - Not tied to MCP-aware tools

## Limitations

- **Bundled CLIs require bun** - Compiled binaries don't always work
- **Static generation** - Can't dynamically update tools
- **Manual updates** - Need to regenerate when MCP server updates
