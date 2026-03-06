# jalco-pi-mono

My personal configuration and agent setup for [pi](https://github.com/badlogic/pi-mono). This repository contains custom extensions, skills, prompt templates, and settings—all managed with GNU Stow for easy deployment.

## Extensions

| Extension | Description | Credit |
|-----------|-------------|--------|
| **confirm-destructive** | Prompts for confirmation before destructive session actions (clear, switch, branch). | [pi examples](https://github.com/badlogic/pi-mono) |
| **custom-header** | Minimal Vercel-themed header showing pi version, skill count, and tool count. | custom |
| **handoff** | Transfer context to a new focused session instead of compacting. Extracts what matters and creates a new session with a generated prompt. | [pi examples](https://github.com/badlogic/pi-mono) |
| **hot-reload-extension-v2** | Hot-reload the pi runtime in-place and queue a continuation prompt. | custom |
| **permission-gate** | Prompts for confirmation before running potentially dangerous bash commands (`rm -rf`, `sudo`, `chmod 777`). | [pi examples](https://github.com/badlogic/pi-mono) |
| **pi-agent-manager** | Subagent and skill permission manager for Pi. | [howaboua](https://github.com/howaboua) |
| **pi-rfc-keywords** | Uppercases RFC 2119/8174 requirement keywords (`must`, `should`, `may`, etc.) in user prompts automatically. | [howaboua](https://github.com/howaboua) |
| **pi-skills-sh** | Integration with the [skills.sh](https://skills.sh) ecosystem. | [skills.sh](https://skills.sh) |
| **pi-todomaster** | Checklist-first planning system with interactive `/todo` UI for managing PRDs, specs, and todos under `.pi/plans`. | [howaboua](https://github.com/howaboua) |
| **pi-webfetch** | Fetches and converts web content to markdown, text, or HTML. Read-only URL fetching with auto HTTPS upgrade. | [howaboua](https://github.com/howaboua) |
| **pi-markdown-preview** | Rendered markdown + LaTeX preview with terminal, browser, and PDF output. Supports Mermaid diagrams, syntax highlighting, math rendering, and theme-aware styling. Requires Pandoc. | [omaclaren](https://github.com/omaclaren/pi-markdown-preview) |
| **pi-notify** | Native desktop notifications when agent finishes and waits for input. Supports Ghostty, iTerm2, WezTerm, Kitty, tmux, and Windows Terminal via OSC escape sequences. | [ferologics](https://github.com/ferologics/pi-notify) |
| **pi-updater** | Codex-style auto-updater for pi — checks for new versions on startup, prompts to install, and provides `/update` command for manual checks. | [tonze](https://github.com/tonze/pi-updater) |
| **question** | Ask the user a single question with selectable options. Full custom UI with arrow-key navigation and free-form "Type something" input. | [pi examples](https://github.com/badlogic/pi-mono) |
| **questionnaire** | Ask one or more questions with a tab-based interface. Supports multi-step wizards for clarifying requirements and preferences. | [pi examples](https://github.com/badlogic/pi-mono) |
| **titlebar-spinner** | Shows a braille spinner animation in the terminal title while the agent is working. | [pi examples](https://github.com/badlogic/pi-mono) |

## Skills

| Skill | Description | Credit |
|-------|-------------|--------|
| **agent-browser** | Browser automation CLI for AI agents — navigate pages, fill forms, click buttons, take screenshots, extract data. | [agent-browser](https://github.com/AgoraSquare/agent-browser) |
| **browser-tools** | Interactive browser automation via Chrome DevTools Protocol — navigate, evaluate JS, screenshot, pick elements, extract content. Requires Chrome with remote debugging on `:9222`. | [pi-skills](https://github.com/badlogic/pi-skills) |
| **component-engineering** | React component engineering standard — accessibility, composition, and styling patterns. | [IgorWarzocha](https://github.com/IgorWarzocha) |
| **exa** | Web search, content crawling, code context, company research, and deep AI research via Exa. Generated from MCP with [MCPorter](https://github.com/steipete/mcporter). | [Exa](https://exa.ai) |
| **find-skills** | Discover and install agent skills from the skills.sh ecosystem. | [skills ecosystem](https://github.com/anthropics/skills) |
| **git** | Git and GitHub CLI workflows — conventional commits, branching, PRs, rebases, conflict resolution. | [jalco-opencode](https://github.com/justinlevinedotme/jalco-opencode) |
| **grep_app** | Search real-world code examples across a million GitHub repositories — find usage patterns, implementation examples, and production code. Generated from MCP with [MCPorter](https://github.com/steipete/mcporter). | [grep.app](https://grep.app) |
| **pi-skills** | Meta-skill for creating pi skills — progressive disclosure patterns, bundled resources (scripts/references/assets), MCP-to-CLI conversion via MCPorter, and best practices. Combines Anthropic methodology, OpenCode patterns, and practical workflows. | Synthesized from [Anthropic](https://github.com/anthropics/skills), [jalco-opencode](https://github.com/justinlevinedotme/jalco-opencode), and [thepopebot](https://github.com/stephengpope/thepopebot) |
| **security-ai-keys** | Detect leaked AI provider API keys (OpenAI, Anthropic, etc.) in codebases. | [IgorWarzocha](https://github.com/IgorWarzocha) |
| **security-secrets** | High-signal secret/credential scanning with automated scripts. | [IgorWarzocha](https://github.com/IgorWarzocha) |
| **shadcn-ui** | Complete shadcn/ui component library patterns including installation, configuration, and accessible React components. | [skills ecosystem](https://github.com/anthropics/skills) |

## Why No MCP?

Pi [intentionally ships without MCP](https://mariozechner.at/posts/2025-11-02-what-if-you-dont-need-mcp/). The reasoning:

- **Context bloat.** Popular MCP servers ship dozens of tools with lengthy descriptions — Playwright MCP uses 13.7k tokens, Chrome DevTools MCP uses 18k tokens. That many tools confuse the agent and eat context.
- **No composability.** MCP tool outputs have to round-trip through the agent's context. CLI tools can pipe output to files, chain commands, and let the agent write code that composes them.
- **Hard to extend.** Modifying an MCP server means understanding its codebase. Adding a new CLI script takes minutes.
- **Skills are simpler.** A CLI tool with a README is all an agent needs. It already knows how to write code and use Bash.

This setup previously used `pi-mcp-adapter` to expose MCP servers as tools. It's been removed in favor of skills — plain CLI tools the agent calls via `bash`.

When you *do* want something from the MCP ecosystem, [MCPorter](https://github.com/steipete/mcporter) bridges the gap: it converts any MCP server into a standalone CLI that pi can call without the MCP protocol at runtime. Use the `/mcporter` prompt template to generate and install one as a skill.

## Prompt Templates

| Template | Description |
|----------|-------------|
| **`/mcporter`** | Generate a CLI from any MCP server using [MCPorter](https://github.com/steipete/mcporter) and install it as a pi skill. Usage: `/mcporter context7` |

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
git clone https://github.com/justinlevinedotme/jalco-pi-mono.git ~/jalco-pi-mono

# Use GNU Stow to symlink configuration
cd ~/jalco-pi-mono
stow -t ~ pi

# Install extension dependencies
cd ~/.pi/agent/extensions && npm install
cd ~/.pi/agent/extensions/pi-rfc-keywords && npm install
cd ~/.pi/agent/extensions/pi-todomaster-master && npm install  # or: bun install
cd ~/.pi/agent/extensions/pi-webfetch && npm install
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
│           ├── settings.json       # Pi settings (provider, model)
│           ├── prompts/            # Prompt templates
│           │   └── mcporter.md     # /mcporter — MCP→CLI generator
│           ├── extensions/         # Custom extensions (.ts)
│           │   ├── package.json    # Shared extension dependencies + npm extensions
│           │   ├── node_modules/   # npm-installed extensions (pi-updater)
│           │   ├── *.ts            # Single-file extensions
│           │   ├── hot-reload-extension-v2/
│           │   ├── pi-agent-manager/
│           │   ├── pi-rfc-keywords/
│           │   ├── pi-skills-sh/
│           │   ├── pi-todomaster-master/
│           │   └── pi-webfetch/
│           └── skills/             # Installed skills
│               ├── agent-browser/
│               ├── browser-tools/
│               ├── component-engineering/
│               ├── exa/
│               ├── find-skills/
│               ├── git/
│               ├── grep_app/
│               ├── pi-skills/
│               ├── security-ai-keys/
│               ├── security-secrets/
│               └── shadcn-ui/
├── .gitignore
├── .stow-local-ignore
└── README.md
```

### What's tracked

- `settings.json` — default provider/model
- `prompts/*.md` — prompt templates
- `extensions/*.ts` — custom tools & event handlers
- `extensions/package.json` — extension npm dependencies
- `skills/` — installed pi skills

### What's ignored

- `auth.json` — API keys & credentials
- `mcp.json` / `mcp-cache.json` — MCP config (no longer used)
- `sessions/` — conversation history
- `bin/` — binaries (pi recreates on install)
- `node_modules/` — reinstall with `npm install`

## Acknowledgments

- [pi](https://github.com/badlogic/pi-mono) by [badlogic](https://github.com/badlogic) — the coding agent that makes this all possible
- [pi examples](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent/examples/extensions) — source of several extensions in this repo
- [MCPorter](https://github.com/steipete/mcporter) by [steipete](https://github.com/steipete) — MCP-to-CLI toolkit for generating skills from MCP servers
- [howaboua](https://github.com/howaboua) — pi-rfc-keywords, pi-todomaster, pi-webfetch, and pi-agent-manager extensions
- [IgorWarzocha](https://github.com/IgorWarzocha) — component-engineering and security skills, originally from [jalco-opencode](https://github.com/justinlevinedotme/jalco-opencode)
