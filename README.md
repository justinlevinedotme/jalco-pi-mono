# jalco-pi-mono

My personal configuration and agent setup for [pi](https://github.com/badlogic/pi-mono). This repository contains custom extensions, skills, prompt templates, MCP configuration patterns, and settings—all managed with GNU Stow for easy deployment.

## Extensions

| Extension | Description | Credit |
|-----------|-------------|--------|
| **apply-patch** | Apply multi-file patches using the Codex/Claude patch format (`*** Begin Patch` / `*** End Patch`). | custom |
| **confirm-destructive** | Prompts for confirmation before destructive session actions (clear, switch, branch). | [pi examples](https://github.com/badlogic/pi-mono) |
| **custom-header** | Minimal Vercel-themed header showing pi version, skill count, and tool count. | custom |
| **git-push-gate** | Prompts for confirmation before git push operations. | custom |
| **handoff** | Transfer context to a new focused session instead of compacting. Extracts what matters and creates a new session with a generated prompt. | [pi examples](https://github.com/badlogic/pi-mono) |
| **nvidia-nim-clean** | Routes LLM calls through NVIDIA NIM API with clean assistant message event stream handling. | custom |
| **permission-gate** | Prompts for confirmation before running potentially dangerous bash commands (`rm -rf`, `sudo`, `chmod 777`). | [pi examples](https://github.com/badlogic/pi-mono) |
| **pi-agent-manager** | Subagent and skill permission manager for Pi. | [IgorWarzocha](https://github.com/IgorWarzocha) |
| **pi-rfc-keywords** | Uppercases RFC 2119/8174 requirement keywords (`must`, `should`, `may`, etc.) in user prompts automatically. | [IgorWarzocha](https://github.com/IgorWarzocha) |
| **pi-skills-sh** | Integration with the [skills.sh](https://skills.sh) ecosystem. | [skills.sh](https://skills.sh) |
| **question** | Ask the user a single question with selectable options. Full custom UI with arrow-key navigation and free-form "Type something" input. | [pi examples](https://github.com/badlogic/pi-mono) |
| **questionnaire** | Ask one or more questions with a tab-based interface. Supports multi-step wizards for clarifying requirements and preferences. | [pi examples](https://github.com/badlogic/pi-mono) |
| **titlebar-spinner** | Shows a braille spinner animation in the terminal title while the agent is working. | [pi examples](https://github.com/badlogic/pi-mono) |
| **zmux** | Terminal multiplexer integration — braille spinner in terminal title with working-state tracking. | custom |

## Skills

| Skill | Description | Credit |
|-------|-------------|--------|
| **browser-tools** | Interactive browser automation via Chrome DevTools Protocol — navigate, evaluate JS, screenshot, pick elements, extract content. Configured for Brave Browser with remote debugging on `:9222`. | [pi-skills](https://github.com/badlogic/pi-skills) |
| **color-accessibility** | Design accessible color palettes — contrast standards, CVD simulation, inclusive design patterns. | custom |
| **component-engineering** | React component engineering standard — accessibility, composition, and styling patterns. | [IgorWarzocha](https://github.com/IgorWarzocha) |
| **exa** | Web search, content crawling, code context, company research, and deep AI research via Exa. | [Exa](https://exa.ai) |
| **find-skills** | Discover and install agent skills from the skills.sh ecosystem. | [skills ecosystem](https://github.com/anthropics/skills) |
| **git** | Git and GitHub CLI workflows — conventional commits, branching, PRs, rebases, conflict resolution. | custom |
| **grep-app** | Search real-world code examples across a million GitHub repositories — find usage patterns, implementation examples, and production code. | [grep.app](https://grep.app) |
| **impeccable** | Frontend design audit, critique, polish, and redesign — UX review, visual hierarchy, accessibility, typography, color, motion, and design systems. | [impeccable](https://github.com/designcomputer/impeccable) |
| **mcp-management** | Create, update, migrate, and debug MCP server configuration for Pi using `pi-mcp-adapter`, `~/.pi/agent/mcp.json`, and env-based auth in `~/.zshrc.local`. | custom |
| **openclaw-skills** | Create, structure, and refine Agent Skills (OpenClaw format) — the open standard for extending AI agents across 30+ clients. | custom |
| **pi-skills** | Meta-skill for creating pi skills — progressive disclosure patterns, bundled resources, env-based auth guidance, MCP documentation patterns. | Synthesized from [Anthropic](https://github.com/anthropics/skills) and [pi docs](https://github.com/badlogic/pi-mono) |
| **repo-ci** | Set up GitHub repo CI with Husky git hooks, commit-check-action, conventional commits, and conventional branch naming. Handles greenfield and existing repos. | custom |
| **rfc-xml-style** | RFC 2119 keywords and XML tag structure guide for agent prompts, skills, and internal docs. Provides keyword semantics, XML tag catalog, nesting best practices, and before/after examples. | custom |
| **security-ai-keys** | Detect leaked AI provider API keys (OpenAI, Anthropic, etc.) in codebases. | [IgorWarzocha](https://github.com/IgorWarzocha) |
| **security-secrets** | High-signal secret/credential scanning with automated scripts. | [IgorWarzocha](https://github.com/IgorWarzocha) |
| **shadcn-ui** | Complete shadcn/ui component library patterns including installation, configuration, and accessible React components. | [skills ecosystem](https://github.com/anthropics/skills) |

> **Note:** Several personal skills (`write-like-justin`, `job-search`, `real-app`) are excluded from version control — they contain PII, voice samples, or account-specific data. See `.gitignore`.

## MCP Setup

MCP servers are managed with `pi-mcp-adapter` — configure servers in `~/.pi/agent/mcp.json`, keep auth in `~/.zshrc.local`, and reference auth values with `${VAR}` interpolation.

### Install

```bash
pi install npm:pi-mcp-adapter
```

Restart Pi after installation.

### Auth

Append secrets to `~/.zshrc.local` with `echo`:

```bash
echo 'export COOLIFY_BASE_URL="https://your-coolify-instance.com"' >> ~/.zshrc.local
echo 'export COOLIFY_ACCESS_TOKEN="your-coolify-api-token"' >> ~/.zshrc.local
source ~/.zshrc.local
```

For Proxmox:

```bash
echo 'export PROXMOX_HOST="pve1"' >> ~/.zshrc.local
echo 'export PROXMOX_PORT="8006"' >> ~/.zshrc.local
echo 'export PROXMOX_USER="root@pam"' >> ~/.zshrc.local
echo 'export PROXMOX_TOKEN_NAME="skill"' >> ~/.zshrc.local
echo 'export PROXMOX_TOKEN_VALUE="your-token-here"' >> ~/.zshrc.local
echo 'export PROXMOX_SSL_MODE="insecure"' >> ~/.zshrc.local
echo 'export PROXMOX_ALLOW_ELEVATED="true"' >> ~/.zshrc.local
source ~/.zshrc.local
```

For Supabase:

```bash
echo 'export SUPABASE_ACCESS_TOKEN="your-supabase-pat"' >> ~/.zshrc.local
echo 'export SUPABASE_PROJECT_REF="your-project-ref"' >> ~/.zshrc.local
source ~/.zshrc.local
```

For Exa:

```bash
echo 'export EXA_API_KEY="your-exa-api-key"' >> ~/.zshrc.local
source ~/.zshrc.local
```

Note: repeated `echo >> ~/.zshrc.local` commands create duplicate entries. Replace old lines when updating values.

### Example `~/.pi/agent/mcp.json`

```json
{
  "settings": {
    "toolPrefix": "server",
    "idleTimeout": 10
  },
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": ["-y", "chrome-devtools-mcp@latest"]
    },
    "coolify": {
      "command": "npx",
      "args": ["-y", "@masonator/coolify-mcp"],
      "env": {
        "COOLIFY_BASE_URL": "${COOLIFY_BASE_URL}",
        "COOLIFY_ACCESS_TOKEN": "${COOLIFY_ACCESS_TOKEN}"
      }
    },
    "insomnia": {
      "command": "npx",
      "args": ["-y", "mcp-insomnia"],
      "directTools": true
    },
    "exa": {
      "command": "npx",
      "args": ["-y", "exa-mcp-server"],
      "env": {
        "EXA_API_KEY": "${EXA_API_KEY}"
      }
    },
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
      },
      "directTools": true
    },
    "supabase": {
      "url": "https://mcp.supabase.com/mcp?project_ref=${SUPABASE_PROJECT_REF}&features=docs,account,database,debugging,development,functions,branching,storage",
      "auth": "bearer",
      "bearerTokenEnv": "SUPABASE_ACCESS_TOKEN"
    },
    "firecrawl": {
      "command": "npx",
      "args": ["-y", "firecrawl-mcp"],
      "env": {
        "FIRECRAWL_API_KEY": "${FIRECRAWL_API_KEY}"
      }
    }
  }
}
```

### Why this approach

- **Lower context cost.** `pi-mcp-adapter` exposes one MCP proxy tool by default instead of stuffing every MCP tool into the prompt.
- **Lazy startup.** Servers connect only when needed.
- **Centralized config.** MCP lives in `~/.pi/agent/mcp.json` instead of scattered generated wrappers.
- **Better separation.** Skills document workflows; MCP servers provide live tools.

## Prompt Templates

| Template | Description |
|----------|-------------|
| **`/install-mcp`** | Install and configure an MCP server using `pi-mcp-adapter`, `~/.pi/agent/mcp.json`, and env-based auth in `~/.zshrc.local`. Usage: `/install-mcp chrome-devtools` |
| **`/refactor-rfc-xml`** | Refactor all markdown files in a folder into RFC 2119 + XML tag structure. Loads the `rfc-xml-style` skill automatically. Usage: `/refactor-rfc-xml ./path/to/folder` |
| **`/setup-ci`** | Set up a GitHub repo CI pipeline with Husky, commit-check-action, conventional commits, and conventional branch naming. Loads the `repo-ci` skill automatically. Usage: `/setup-ci` or `/setup-ci ./path/to/repo` |

## Configuration

### Provider & Model

| Provider | Model | Notes |
|----------|-------|-------|
| Anthropic | claude-opus-4-6 | Default provider/model |

### Settings

```jsonc
{
  "defaultProvider": "anthropic",
  "defaultModel": "claude-opus-4-6"
}
```

## Installation

```bash
# Clone the repository
git clone --recurse-submodules https://github.com/justinlevinedotme/jalco-pi-mono.git ~/jalco-pi-mono

# Use GNU Stow to symlink configuration
cd ~/jalco-pi-mono
stow -t ~ pi

# Install extension import dependencies
cd ~/.pi/agent/extensions && npm install
cd ~/.pi/agent/extensions/pi-rfc-keywords && npm install

# packages in settings.json are auto-installed by pi on first startup
```

## Usage

```bash
# After editing extensions or config:
cd ~/jalco-pi-mono
stow -R -t ~ pi          # Re-stow (refresh symlinks)

# Unstow (remove symlinks):
stow -D -t ~ pi
```

## Structure

```
jalco-pi-mono/
├── pi/                             # Stow package → targets ~/
│   └── .pi/
│       └── agent/
│           ├── AGENTS.md           # Global agent rules (conventional commits, branching, etc.)
│           ├── settings.json       # Pi settings (provider, model, packages)
│           ├── models.json         # Custom model/provider definitions
│           ├── mcp.json            # MCP server config for pi-mcp-adapter
│           ├── keybindings.json    # Custom keybindings
│           ├── prompts/            # Prompt templates
│           │   ├── install-mcp.md
│           │   ├── refactor-rfc-xml.md
│           │   └── setup-ci.md
│           ├── extensions/         # Custom extensions (.ts)
│           │   ├── package.json    # Shared import dependencies
│           │   ├── *.ts            # Single-file extensions
│           │   ├── pi-agent-manager/
│           │   ├── pi-rfc-keywords/
│           │   ├── pi-skills-sh/
│           │   └── pi-webfetch/
│           └── skills/             # Installed skills
│               ├── browser-tools/
│               ├── color-accessibility/
│               ├── component-engineering/
│               ├── exa/
│               ├── find-skills/
│               ├── git/
│               ├── grep-app/
│               ├── impeccable/
│               ├── mcp-management/
│               ├── openclaw-skills/
│               ├── pi-skills/
│               ├── repo-ci/
│               ├── rfc-xml-style/
│               ├── security-ai-keys/
│               ├── security-secrets/
│               └── shadcn-ui/
├── .gitignore
├── .stow-local-ignore
└── README.md
```

### What's tracked

- `AGENTS.md` — global agent rules and conventions
- `settings.json` — default provider/model and installed Pi packages
- `models.json` — custom model/provider definitions
- `mcp.json` — MCP server configuration for `pi-mcp-adapter`
- `keybindings.json` — custom keybindings
- `prompts/*.md` — prompt templates (except `jobs.md`)
- `extensions/*.ts` — custom tools & event handlers
- `extensions/package.json` — shared import dependencies for local extensions
- `skills/` — installed pi skills (except personal ones)

### What's ignored

- `auth.json` — provider auth state
- `mcp-cache.json` / `mcp-npx-cache.json` — MCP metadata caches
- `update-cache.json` — updater state
- `sessions/` — conversation history
- `bin/` — binaries (pi recreates on install)
- `node_modules/` — reinstall with `npm install`
- `skills/write-like-justin/` — personal voice/style (contains PII)
- `skills/job-search/` — job search pipeline (contains resume, contact info)
- `skills/real-app/` — personal app account operations
- `prompts/jobs.md` — job search prompt (contains resume details)

## Acknowledgments

- [pi](https://github.com/badlogic/pi-mono) by [badlogic](https://github.com/badlogic) — the coding agent that makes this all possible
- [pi examples](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent/examples/extensions) — source of several extensions in this repo
- [pi-mcp-adapter](https://github.com/nicobailon/pi-mcp-adapter) by [nicobailon](https://github.com/nicobailon) — token-efficient MCP adapter for Pi
- [pi-annotate](https://github.com/nicobailon/pi-annotate) by [nicobailon](https://github.com/nicobailon) — visual browser-to-AI annotation with element picking, comments, and screenshots
- [IgorWarzocha](https://github.com/IgorWarzocha) — pi-rfc-keywords, pi-agent-manager extensions, component-engineering and security skills
- [impeccable](https://github.com/designcomputer/impeccable) — frontend design audit and polish skill
