# jalco-pi-mono

My [pi](https://github.com/badlogic/pi) coding agent configuration, managed with [GNU Stow](https://www.gnu.org/software/stow/).

## Structure

```
jalco-pi-mono/
├── pi/                         # Stow package → targets ~/
│   └── .pi/
│       └── agent/
│           ├── settings.json   # Pi settings (model, provider)
│           ├── extensions/     # Custom extensions (.ts)
│           ├── skills/         # Installed skills
│           └── bin/            # Custom binaries
├── .gitignore
├── .stow-local-ignore
└── README.md
```

## Setup

```bash
# Clone
git clone https://github.com/justinlevinedotme/jalco-pi-mono.git ~/jalco-pi-mono

# Stow (creates ~/.pi → symlinks into repo)
cd ~/jalco-pi-mono
stow -t ~ pi

# Install extension dependencies
cd ~/.pi/agent/extensions
npm install
```

## Usage

```bash
# After editing extensions or config in the repo:
cd ~/jalco-pi-mono
stow -R -t ~ pi          # Re-stow (refresh symlinks)

# Unstow (remove symlinks)
stow -D -t ~ pi
```

## What's tracked

- `settings.json` — default provider/model
- `extensions/*.ts` — custom tools & event handlers
- `extensions/package.json` — extension dependencies
- `skills/` — installed pi skills
- `bin/` — custom binaries (fd, etc.)

## What's ignored

- `auth.json` — API keys & credentials
- `sessions/` — conversation history
- `node_modules/` — reinstall with `npm install`
