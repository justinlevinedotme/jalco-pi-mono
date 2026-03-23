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

## Preferred Architecture

Going forward, use:
- `pi install npm:pi-mcp-adapter`
- global config: `~/.pi/agent/mcp.json`
- optional project config: `.pi/mcp.json`
- secrets in shell env, preferably `~/.zshrc.local`

Do **not** store long-lived tokens directly in MCP config if environment variables can be used instead.

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

## Useful Options

### Lifecycle

```json
{
  "lifecycle": "lazy",
  "idleTimeout": 10
}
```

Use:
- `lazy` for most servers
- `keep-alive` only when a server needs to remain warm

### Direct Tools

By default, servers are exposed through the single `mcp` proxy tool. This is usually best.

Promote selected tools directly only when that improves usability enough to justify extra context cost.

```json
{
  "directTools": true
}
```

or:

```json
{
  "directTools": ["search_repositories", "get_file_contents"]
}
```

Use direct tools sparingly.

## Common Workflows

### Add a server
1. identify package / launch command
2. append auth to `~/.zshrc.local` using `echo 'export ...' >> ~/.zshrc.local`
3. run `source ~/.zshrc.local`
4. add `mcpServers.<name>` entry to `~/.pi/agent/mcp.json`
5. restart Pi
6. verify from Pi using `/mcp` or tool discovery

### Update a server
1. adjust `args`, `env`, `url`, or lifecycle settings
2. keep secrets in env, not inline JSON
3. restart Pi
4. reconnect or verify behavior

### Migrate from MCPorter
1. identify legacy generated CLI skills or `~/.mcporter/mcporter.json`
2. preserve useful standalone skills only if they still help
3. install `pi-mcp-adapter`
4. move MCP server config to `~/.pi/agent/mcp.json`
5. move secrets into `~/.zshrc.local`
6. remove old MCPorter config and package if no longer used
7. update docs to describe the new path

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
- confirm `pi-mcp-adapter` is installed
- confirm `~/.pi/agent/mcp.json` is valid JSON
- restart Pi
- verify command/package exists

### Auth failures
- confirm vars exist in shell
- run `source ~/.zshrc.local`
- restart Pi from a shell that has those vars

### Too many tools / context bloat
- prefer proxy mode
- avoid `directTools: true` on huge servers
- expose only the few direct tools that are worth it
