---
name: grep-app
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

- `--query <string>` (required) - The literal code pattern to search for (e.g., 'useState(', 'import React from', 'async function')
- `--match-case <boolean>` (optional) - Whether the search should be case sensitive
- `--match-whole-words <boolean>` (optional) - Whether to match whole words only
- `--use-regexp <boolean>` (optional) - Whether to interpret the query as a regular expression
- `--repo <string>` (optional) - Filter by repository (e.g., 'facebook/react', 'vercel/')
- `--path <string>` (optional) - Filter by file path (e.g., 'src/components/Button.tsx', '/route.ts')
- `--language <string>` (optional) - Filter by programming language (comma-separated: 'TypeScript,TSX', 'JavaScript', 'Python', etc.)

**Important Usage Notes:**

✅ **Good queries** (literal code patterns):
- `'useState('`
- `'import React from'`
- `'async function'`
- `'(?s)try {.*await'` (regex)

❌ **Bad queries** (keywords/questions):
- `'react tutorial'`
- `'best practices'`
- `'how to use'`

**When to use:**
- Implementing unfamiliar APIs or libraries
- Finding real usage patterns and syntax
- Looking for production-ready examples
- Understanding how libraries work together

**Regex patterns:**
- Use `--use-regexp true` for flexible patterns
- Prefix with `(?s)` to match across multiple lines
- Example: `'(?s)useState\(.*loading'` finds useState hooks with loading variables

**Output formats:**
- `--output text` (default) - Human-readable
- `--output markdown` - Formatted markdown
- `--output json` - Structured JSON
- `--output raw` - Raw MCP response
