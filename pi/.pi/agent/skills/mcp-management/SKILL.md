---
name: mcp-management
description: Create, update, migrate, and debug MCP server configuration for Pi using pi-mcp-adapter. Use when adding an MCP server, editing ~/.pi/agent/mcp.json, importing MCP configs, switching from legacy MCPorter workflows, or documenting MCP setup. Use proactively when auth, server wiring, direct tools, or environment-variable based config is involved.
---

# MCP Management

Manage Pi MCP servers with `pi-mcp-adapter`.

Use this skill when:
- adding a new MCP server
- updating an existing MCP server
- migrating away from MCPorter
- documenting MCP setup for Pi
- debugging `~/.pi/agent/mcp.json`
- deciding whether to use proxy mode or direct tools
- configuring OAuth for remote MCP servers
- importing configs from other tools (Cursor, Claude Desktop, VS Code, etc.)
- working with MCP UI integrations

## Preferred Architecture

Going forward, use:
- `pi install npm:pi-mcp-adapter`
- global config: `~/.pi/agent/mcp.json`
- optional project config: `.pi/mcp.json`
- secrets in shell env, preferably `~/.zshrc.local`

Do **not** store long-lived tokens directly in MCP config if environment variables can be used instead.

## How It Works

- One `mcp` proxy tool in context (~200 tokens) instead of hundreds
- Servers are lazy by default — connect on first tool call, not at startup
- Tool metadata cached to disk (`~/.pi/agent/mcp-cache.json`) so search/list/describe work without live connections
- Idle servers disconnect after 10 minutes (configurable), reconnect automatically on next use
- npx-based servers resolve to direct binary paths, skipping the ~143 MB npm parent process
- Specific tools can be promoted from proxy to first-class Pi tools via `directTools` config

## Auth and Secrets

Put auth in:

```bash
~/.zshrc.local
```

Prefer appending exports with `echo`:

```bash
echo 'export COOLIFY_BASE_URL="https://coolify.example.com"' >> ~/.zshrc.local
echo 'export COOLIFY_ACCESS_TOKEN="your-coolify-token"' >> ~/.zshrc.local

echo 'export PROXMOX_HOST="pve1"' >> ~/.zshrc.local
echo 'export PROXMOX_PORT="8006"' >> ~/.zshrc.local
echo 'export PROXMOX_USER="root@pam"' >> ~/.zshrc.local
echo 'export PROXMOX_TOKEN_NAME="skill"' >> ~/.zshrc.local
echo 'export PROXMOX_TOKEN_VALUE="your-proxmox-token"' >> ~/.zshrc.local
echo 'export PROXMOX_SSL_MODE="insecure"' >> ~/.zshrc.local
echo 'export PROXMOX_ALLOW_ELEVATED="true"' >> ~/.zshrc.local
```

Reload shell state after editing:

```bash
source ~/.zshrc.local
```

Note: repeated `echo >> ~/.zshrc.local` commands create duplicate entries. When updating an existing variable, remove or replace the old line first.

Then reference those values from MCP config with `${VAR}` interpolation.

## Install Adapter

```bash
pi install npm:pi-mcp-adapter
```

Restart Pi after install.

## Config File

Create or edit:

```bash
~/.pi/agent/mcp.json
```

Basic shape:

```json
{
  "settings": {
    "toolPrefix": "server",
    "idleTimeout": 10
  },
  "mcpServers": {}
}
```

## Project-Specific Config

Add `.pi/mcp.json` in any project root for project-scoped MCP servers. These are only available when Pi is launched from that project directory.

**Precedence**: project config > global config > imported configs. A project server with the same name as a global one overrides it entirely.

Same format as global config:

```json
// <project-root>/.pi/mcp.json
{
  "settings": {
    "idleTimeout": 5
  },
  "mcpServers": {
    "project-db": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": {
        "POSTGRES_CONNECTION_STRING": "${PROJECT_DB_URL}"
      }
    }
  }
}
```

Use cases:
- Database servers scoped to a specific project's DB
- Project-specific API servers (e.g., a staging API MCP)
- Overriding global server settings per-project
- Sharing MCP config with teammates via version control (keep secrets in env vars, not the file)

**Tip**: commit `.pi/mcp.json` to the repo so teammates get the same MCP setup. Secrets stay in each person's `~/.zshrc.local`.

## Server Config Options

| Field | Description |
|-------|-------------|
| `command` | Executable for stdio transport |
| `args` | Command arguments |
| `env` | Environment variables (`${VAR}` interpolation) |
| `cwd` | Working directory |
| `url` | HTTP endpoint (StreamableHTTP with SSE fallback) |
| `auth` | `"bearer"` or `"oauth"` |
| `bearerToken` / `bearerTokenEnv` | Token or env var name |
| `lifecycle` | `"lazy"` (default), `"eager"`, or `"keep-alive"` |
| `idleTimeout` | Minutes before idle disconnect (overrides global) |
| `exposeResources` | Expose MCP resources as tools (default: `true`) |
| `directTools` | `true`, `string[]`, or `false` — register tools individually instead of through proxy |
| `debug` | Show server stderr (default: `false`) |

## Add a Server

Example: Coolify

```json
{
  "mcpServers": {
    "coolify": {
      "command": "npx",
      "args": ["-y", "@masonator/coolify-mcp"],
      "env": {
        "COOLIFY_BASE_URL": "${COOLIFY_BASE_URL}",
        "COOLIFY_ACCESS_TOKEN": "${COOLIFY_ACCESS_TOKEN}"
      }
    }
  }
}
```

Example: Chrome DevTools

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": ["-y", "chrome-devtools-mcp@latest"]
    }
  }
}
```

Example: Proxmox

```json
{
  "mcpServers": {
    "proxmox": {
      "command": "npx",
      "args": ["-y", "@bldg-7/proxmox-mcp"],
      "env": {
        "PROXMOX_HOST": "${PROXMOX_HOST}",
        "PROXMOX_PORT": "${PROXMOX_PORT}",
        "PROXMOX_USER": "${PROXMOX_USER}",
        "PROXMOX_TOKEN_NAME": "${PROXMOX_TOKEN_NAME}",
        "PROXMOX_TOKEN_VALUE": "${PROXMOX_TOKEN_VALUE}",
        "PROXMOX_SSL_MODE": "${PROXMOX_SSL_MODE}",
        "PROXMOX_ALLOW_ELEVATED": "${PROXMOX_ALLOW_ELEVATED}"
      }
    }
  }
}
```

Example: HTTP server with bearer auth (Supabase)

```json
{
  "mcpServers": {
    "supabase": {
      "url": "https://mcp.supabase.com/mcp?project_ref=${SUPABASE_PROJECT_REF}&features=docs,account,database,debugging,development,functions,branching,storage",
      "auth": "bearer",
      "bearerTokenEnv": "SUPABASE_ACCESS_TOKEN",
      "directTools": true
    }
  }
}
```

## Lifecycle Modes

| Mode | Behavior |
|------|----------|
| `lazy` (default) | Don't connect at startup. Connect on first tool call. Disconnect after idle timeout. Cached metadata keeps search/list working without connections. |
| `eager` | Connect at startup but don't auto-reconnect if the connection drops. No idle timeout by default (set `idleTimeout` explicitly to enable). |
| `keep-alive` | Connect at startup. Auto-reconnect via health checks. No idle timeout. Use for servers you always need available. |

```json
{
  "lifecycle": "lazy",
  "idleTimeout": 10
}
```

Use `lazy` for most servers. Use `keep-alive` only when a server needs to remain warm.

## Direct Tools

By default, servers are exposed through the single `mcp` proxy tool. This is usually best.

Promote selected tools directly only when that improves usability enough to justify extra context cost (~150-300 tokens per tool).

```json
{
  "directTools": true
}
```

or selectively:

```json
{
  "directTools": ["search_repositories", "get_file_contents"]
}
```

Global default with per-server override:

```json
{
  "settings": {
    "directTools": true
  },
  "mcpServers": {
    "huge-server": {
      "directTools": false
    }
  }
}
```

Per-server `directTools` overrides the global setting.

Direct tools register from the metadata cache (`~/.pi/agent/mcp-cache.json`), so no server connections needed at startup. On the first session after adding `directTools` to a new server, tools fall back to proxy-only and the cache populates in the background. Restart Pi and they'll be available. To force: `/mcp reconnect <server>` then restart.

Use direct tools sparingly. For servers with 75+ tools, stick with proxy or pick specific tools with a `string[]`.

## Import Existing Configs

Already have MCP set up in another tool? Import it:

```json
{
  "imports": ["cursor", "claude-code", "claude-desktop"],
  "mcpServers": {}
}
```

Supported sources: `cursor`, `claude-code`, `claude-desktop`, `vscode`, `windsurf`, `codex`

## OAuth Authentication

For servers that require OAuth 2.1:

```json
{
  "mcpServers": {
    "my-oauth-server": {
      "url": "https://example.com/mcp",
      "auth": "oauth"
    }
  }
}
```

Run `/mcp-auth <server>` to initiate the OAuth flow. See `OAUTH.md` in the pi-mcp-adapter repo for details.

## MCP UI Integration

MCP servers can ship interactive UIs. When a tool has a `_meta.ui.resourceUri`, the adapter opens it in Glimpse (native macOS window) if installed, otherwise falls back to the browser.

- **Session reuse**: calling the same tool again pushes new results to the existing window
- **Bidirectional messaging**: UI can send prompts/intents back to the agent
- **Tool consent**: gates whether UIs can call MCP tools (never/once-per-server/always)

Retrieve UI messages:

```
mcp({ action: "ui-messages" })
```

Set viewer preference via env: `MCP_UI_VIEWER=browser` or `MCP_UI_VIEWER=glimpse`.

## Usage Reference

| Mode | Example |
|------|---------|
| Status | `mcp({ })` |
| List server | `mcp({ server: "name" })` |
| Search | `mcp({ search: "screenshot navigate" })` |
| Describe | `mcp({ describe: "tool_name" })` |
| Call | `mcp({ tool: "...", args: '{"key": "value"}' })` |
| Connect | `mcp({ connect: "server-name" })` |
| UI messages | `mcp({ action: "ui-messages" })` |

**Note**: `args` is a JSON string, not an object.

Search includes both MCP tools and Pi tools (from extensions). Pi tools appear first with `[pi tool]` prefix. Space-separated words are OR'd. Tool names are fuzzy-matched on hyphens and underscores.

## Commands

| Command | What it does |
|---------|-------------|
| `/mcp` | Interactive panel (server status, tool toggles, reconnect) |
| `/mcp tools` | List all tools |
| `/mcp reconnect` | Reconnect all servers |
| `/mcp reconnect <server>` | Connect or reconnect a single server |
| `/mcp-auth <server>` | OAuth setup |

## Common Workflows

### Add a server

**IMPORTANT**: Always ask the user whether they want the MCP server added:
- **Globally** (`~/.pi/agent/mcp.json`) — available in all projects
- **Locally** (`.pi/mcp.json` in current project) — scoped to this project only

Prompt with something like:
> "Do you want this MCP server available globally or just for this project?"

Then proceed:

1. Identify package / launch command
2. If auth is required, append to `~/.zshrc.local` using `echo 'export ...' >> ~/.zshrc.local`
3. Run `source ~/.zshrc.local`
4. Add `mcpServers.<name>` entry to:
   - `~/.pi/agent/mcp.json` (global), or
   - `.pi/mcp.json` in project root (local)
5. Restart Pi
6. Verify from Pi using `/mcp` or tool discovery

**Guidance for the prompt**:
- Suggest **local** if the server is project-specific (project DB, staging API, project-scoped service)
- Suggest **global** if the server is general-purpose (browser tools, search, general APIs)
- If unsure, default to asking

### Update a server
1. Adjust `args`, `env`, `url`, or lifecycle settings
2. Keep secrets in env, not inline JSON
3. Restart Pi
4. Reconnect or verify behavior

### Migrate from MCPorter
1. Identify legacy generated CLI skills or `~/.mcporter/mcporter.json`
2. Preserve useful standalone skills only if they still help
3. Install `pi-mcp-adapter`
4. Move MCP server config to `~/.pi/agent/mcp.json`
5. Move secrets into `~/.zshrc.local`
6. Remove old MCPorter config and package if no longer used
7. Update docs to describe the new path

### Import from another tool
1. Add `"imports": ["cursor"]` (or whichever source) to `~/.pi/agent/mcp.json`
2. Imported servers are merged — local `mcpServers` entries override imports
3. Restart Pi

## Skill vs MCP Server

Use a **skill** when:
- the agent needs domain guidance, workflows, examples, or scripts
- you want routing logic or opinionated procedures
- the capability is mostly documentation + commands

Use an **MCP server** when:
- there is a real external tool API or service
- you need structured remote tool calls
- the tool surface is dynamic or too large to hand-maintain as scripts

Often you want both:
- MCP server for tool access
- skill for guidance on when and how to use it

## Documentation Rules

When documenting MCP setup:
- prefer `pi-mcp-adapter`, not MCPorter
- mention `~/.pi/agent/mcp.json`
- mention `~/.zshrc.local` for auth
- show `${VAR}` interpolation in examples
- avoid committing secrets into repo docs or config snippets
- say when a legacy skill is standalone vs MCP-backed

## Troubleshooting

### Server not available
- Confirm `pi-mcp-adapter` is installed
- Confirm `~/.pi/agent/mcp.json` is valid JSON
- Restart Pi
- Verify command/package exists

### Auth failures
- Confirm vars exist in shell
- Run `source ~/.zshrc.local`
- Restart Pi from a shell that has those vars

### Too many tools / context bloat
- Prefer proxy mode
- Avoid `directTools: true` on huge servers
- Expose only the few direct tools that are worth it

### Direct tools not showing up
- Cache needs to populate first — run `/mcp reconnect <server>` then restart Pi
- Check `~/.pi/agent/mcp-cache.json` for cached metadata

### OAuth issues
- Run `/mcp-auth <server>` to initiate flow
- Ensure the server's `url` is correct and `auth` is set to `"oauth"`
