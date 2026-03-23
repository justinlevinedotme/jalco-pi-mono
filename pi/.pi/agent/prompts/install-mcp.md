---
description: Install and configure an MCP server in Pi using pi-mcp-adapter, ~/.pi/agent/mcp.json, and env-based auth in ~/.zshrc.local
argument-hint: <server-name-or-package>
---

# Install MCP Server

Install and configure the MCP server `$1` using the current Pi MCP flow.

Follow this workflow exactly:

1. Determine the correct MCP npm package / command for `$1`.
2. If auth or host configuration is required:
   - identify the required environment variables
   - append them to `~/.zshrc.local` using:
     ```bash
     echo 'export NAME="value"' >> ~/.zshrc.local
     ```
   - tell the user repeated `echo >> ~/.zshrc.local` commands create duplicate lines
   - run:
     ```bash
     source ~/.zshrc.local
     ```
3. Ensure Pi is using `pi-mcp-adapter`:
   - if missing, install with:
     ```bash
     pi install npm:pi-mcp-adapter
     ```
4. Add or update the MCP server entry in:
   - `~/.pi/agent/mcp.json`
5. Use `${VAR}` interpolation in `mcp.json` for any auth/config values from shell env.
6. Prefer proxy mode by default; only add `directTools` if there is a clear reason.
7. If helpful, create or update a skill documenting:
   - what the MCP server does
   - when to use it
   - required env vars
   - common workflows
   - troubleshooting
8. Summarize exactly what changed, including file paths.

Constraints:
- Do **not** use MCPorter.
- Do **not** generate standalone CLIs from MCP servers.
- Do **not** put long-lived secrets directly into `mcp.json` when env vars can be used.
- Prefer editing `~/.pi/agent/mcp.json` over ad-hoc local config files.
- If the package or setup is ambiguous, inspect docs before changing config.

Useful target files:
- `~/.pi/agent/mcp.json`
- `~/.zshrc.local`
- `~/.pi/agent/skills/mcp-management/SKILL.md`
- `~/.pi/agent/skills/pi-skills/SKILL.md`

Expected output:
- installed/verified `pi-mcp-adapter`
- updated `~/.pi/agent/mcp.json`
- appended env vars to `~/.zshrc.local` if needed
- clear final summary with exact paths and next steps
