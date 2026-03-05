# jalco-pi-mono

My personal configuration and agent setup for [pi](https://github.com/badlogic/pi-mono). This repository contains custom extensions, skills, and settings—all managed with GNU Stow for easy deployment.

## Extensions

| Extension | Description | Credit |
|-----------|-------------|--------|
| **confirm-destructive** | Prompts for confirmation before destructive session actions (clear, switch, branch). | [pi examples](https://github.com/badlogic/pi-mono) |
| **handoff** | Transfer context to a new focused session instead of compacting. Extracts what matters and creates a new session with a generated prompt. | [pi examples](https://github.com/badlogic/pi-mono) |
| **permission-gate** | Prompts for confirmation before running potentially dangerous bash commands (`rm -rf`, `sudo`, `chmod 777`). | [pi examples](https://github.com/badlogic/pi-mono) |
| **question** | Ask the user a single question with selectable options. Full custom UI with arrow-key navigation and free-form "Type something" input. | [pi examples](https://github.com/badlogic/pi-mono) |
| **questionnaire** | Ask one or more questions with a tab-based interface. Supports multi-step wizards for clarifying requirements and preferences. | [pi examples](https://github.com/badlogic/pi-mono) |
| **titlebar-spinner** | Shows a braille spinner animation in the terminal title while the agent is working. | [pi examples](https://github.com/badlogic/pi-mono) |

## Skills

| Skill | Description | Credit |
|-------|-------------|--------|
| **find-skills** | Helps users discover and install agent skills. Use when looking for functionality that might exist as an installable skill. | [skills ecosystem](https://github.com/anthropics/skills) |
| **shadcn-ui** | Complete shadcn/ui component library patterns including installation, configuration, and implementation of accessible React components. | [skills ecosystem](https://github.com/anthropics/skills) |

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
cd ~/.pi/agent/extensions
npm install
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
│           ├── extensions/         # Custom extensions (.ts)
│           │   ├── package.json    # Extension dependencies
│           │   └── *.ts
│           └── skills/             # Installed skills
│               ├── find-skills/
│               └── shadcn-ui/
├── .gitignore
├── .stow-local-ignore
└── README.md
```

### What's tracked

- `settings.json` — default provider/model
- `extensions/*.ts` — custom tools & event handlers
- `extensions/package.json` — extension npm dependencies
- `skills/` — installed pi skills

### What's ignored

- `auth.json` — API keys & credentials
- `sessions/` — conversation history
- `bin/` — binaries (pi recreates on install)
- `node_modules/` — reinstall with `npm install`

## Acknowledgments

- [pi](https://github.com/badlogic/pi-mono) by [badlogic](https://github.com/badlogic) — the coding agent that makes this all possible
- [pi examples](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent/examples/extensions) — source of most extensions in this repo
