---
name: repo-ci
description: |-
  Set up GitHub repo CI with Husky git hooks, commit-check-action, conventional commits,
  and conventional branch naming. Handles greenfield and existing repos intelligently — detects
  existing CI, package managers, and config before making changes. Use when setting up CI,
  adding git hooks, enforcing commit conventions, or standardizing branch naming.

  Examples:
  - user: "Set up CI for this repo" → assess repo, install husky + commit-check
  - user: "Add conventional commits" → configure local hooks + GitHub Action
  - user: "Enforce branch naming" → add commit-check branch validation
  - user: "/setup-ci" → full CI pipeline setup with interactive questions
  - user: "Add husky to this project" → install and configure husky hooks
---

# Repo CI Setup

Set up a complete GitHub repo CI pipeline: Husky local git hooks + commit-check-action for GitHub Actions, enforcing conventional commits and conventional branch naming.

## Step 1: Assess the Repository

Before making ANY changes, gather context. Run these checks silently and analyze results:

```bash
# Detect project type and package manager
ls package.json pnpm-lock.yaml yarn.lock bun.lockb package-lock.json 2>/dev/null
cat package.json 2>/dev/null | head -50

# Detect existing CI
ls -la .github/workflows/ 2>/dev/null
ls .husky/ 2>/dev/null
cat .commitlintrc* commitlint.config.* 2>/dev/null
cat .commit-check.yml commit-check.toml cchk.toml 2>/dev/null

# Detect existing git hooks or lint-staged
cat .lintstagedrc* lint-staged.config.* 2>/dev/null
grep -r "lint-staged\|husky\|commitlint\|commit-check" package.json 2>/dev/null

# Check git state
git remote -v 2>/dev/null
git branch --show-current 2>/dev/null
```

### Classification

Based on the assessment, classify the repo:

| Signal | Classification |
|--------|---------------|
| No `package.json` | Non-JS project — skip Husky, use commit-check-action only |
| `package.json` exists, no `.github/workflows/` | Greenfield — full setup |
| `.github/workflows/` exists, no commit checks | Existing CI — add commit checks alongside |
| Husky already installed | Partial setup — fill gaps only |
| `commitlint` present | Migration candidate — ask before replacing |
| `commit-check.toml` present | Already configured — verify and update if needed |

## Step 2: Ask Clarifying Questions

Based on assessment, ask the user ONLY questions that are relevant. Do NOT ask questions whose answers are obvious from the repo state.

**Always ask:**
- Confirm the default branch name (main vs master vs develop)

**Ask if ambiguous:**
- Package manager preference (if no lockfile detected)
- Whether to replace existing commitlint with commit-check (if commitlint found)
- Whether to add PR comments from commit-check-action (adds permissions requirement)
- Whether existing workflows should be modified or a new workflow file created
- Whether to add lint-staged for pre-commit code formatting

**Never ask:**
- Whether to use conventional commits (that's the whole point)
- Whether to use Husky (yes, unless non-JS project)

## Step 3: Install Husky (JS/TS Projects Only)

Skip this step entirely for non-JS projects.

Detect the package manager and use it consistently:

```bash
# Detect package manager (priority order)
if [ -f bun.lockb ]; then PM="bun"; EXEC="bunx"
elif [ -f pnpm-lock.yaml ]; then PM="pnpm"; EXEC="pnpm exec"
elif [ -f yarn.lock ]; then PM="yarn"; EXEC="yarn"
else PM="npm"; EXEC="npx"
fi
```

### Install

```bash
$PM install --save-dev husky
$EXEC husky init
```

This creates `.husky/` directory and adds a `prepare` script to `package.json`.

### Configure commit-msg Hook

Create `.husky/commit-msg`:

```bash
#!/bin/sh

# Validate commit message follows Conventional Commits
# https://www.conventionalcommits.org/en/v1.0.0/
#
# Format: <type>(<scope>): <description>
# Types: feat, fix, docs, style, refactor, perf, test, chore, ci, build, revert

commit_msg=$(cat "$1")

# Allow merge commits
if echo "$commit_msg" | grep -qE "^Merge "; then
  exit 0
fi

# Allow revert commits
if echo "$commit_msg" | grep -qE "^Revert "; then
  exit 0
fi

# Allow fixup commits
if echo "$commit_msg" | grep -qE "^fixup! "; then
  exit 0
fi

# Validate conventional commit format
if ! echo "$commit_msg" | grep -qE "^(feat|fix|docs|style|refactor|perf|test|chore|ci|build|revert)(\(.+\))?(!)?: .{1,}$"; then
  echo ""
  echo "❌ Invalid commit message format."
  echo ""
  echo "Expected: <type>(<scope>): <description>"
  echo ""
  echo "Types: feat, fix, docs, style, refactor, perf, test, chore, ci, build, revert"
  echo ""
  echo "Examples:"
  echo "  feat(auth): add JWT refresh token support"
  echo "  fix: handle null response in user endpoint"
  echo "  docs: update API reference"
  echo "  feat!: remove deprecated v1 endpoints"
  echo ""
  echo "See: https://www.conventionalcommits.org/en/v1.0.0/"
  echo ""
  exit 1
fi

# Check subject line length (max 80 chars)
subject=$(echo "$commit_msg" | head -1)
if [ ${#subject} -gt 80 ]; then
  echo ""
  echo "❌ Commit subject too long (${#subject} chars, max 80)."
  echo ""
  exit 1
fi
```

Make it executable:

```bash
chmod +x .husky/commit-msg
```

### Configure pre-push Hook (Branch Name Validation)

Create `.husky/pre-push`:

```bash
#!/bin/sh

# Validate branch name follows Conventional Branch
# https://conventional-branch.github.io/
#
# Format: <type>/<description>
# Types: feature, feat, bugfix, fix, hotfix, release, chore

branch=$(git branch --show-current)

# Allow main/master/develop
if echo "$branch" | grep -qE "^(main|master|develop)$"; then
  exit 0
fi

# Validate conventional branch format
if ! echo "$branch" | grep -qE "^(feature|feat|bugfix|fix|hotfix|release|chore)/[a-z0-9][a-z0-9.\-]*[a-z0-9]$"; then
  echo ""
  echo "❌ Invalid branch name: $branch"
  echo ""
  echo "Expected: <type>/<description>"
  echo ""
  echo "Types: feature, feat, bugfix, fix, hotfix, release, chore"
  echo ""
  echo "Examples:"
  echo "  feat/add-login-page"
  echo "  fix/header-bug"
  echo "  hotfix/security-patch"
  echo "  release/v1.2.0"
  echo "  chore/update-dependencies"
  echo ""
  echo "Rules:"
  echo "  - Lowercase alphanumerics, hyphens, and dots only"
  echo "  - No consecutive hyphens or dots"
  echo "  - No leading/trailing hyphens or dots in description"
  echo ""
  echo "See: https://conventional-branch.github.io/"
  echo ""
  exit 1
fi
```

Make it executable:

```bash
chmod +x .husky/pre-push
```

### Optional: pre-commit Hook with lint-staged

Only add if user requested or repo already uses lint-staged:

```bash
$PM install --save-dev lint-staged
```

Create `.husky/pre-commit`:

```bash
#!/bin/sh
$EXEC lint-staged
```

Add lint-staged config to `package.json`:

```json
{
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md,yml,yaml}": ["prettier --write"]
  }
}
```

Adjust glob patterns to match the project's actual tooling (eslint, biome, oxlint, etc.).

## Step 4: Configure commit-check-action (GitHub Actions)

### Create commit-check.toml

Place at repository root. See `references/commit-check-toml.md` for the full config reference.

Default config:

```toml
[commit]
conventional_commits = true
subject_capitalized = false
subject_imperative = true
subject_max_length = 80
subject_min_length = 5
allow_commit_types = ["feat", "fix", "docs", "style", "refactor", "perf", "test", "chore", "ci", "build", "revert"]
allow_merge_commits = true
allow_revert_commits = true
allow_empty_commits = false
allow_fixup_commits = true
allow_wip_commits = false
require_body = false
require_signed_off_by = false
ignore_authors = ["dependabot[bot]", "copilot[bot]", "pre-commit-ci[bot]", "github-actions[bot]"]

[branch]
conventional_branch = true
allow_branch_types = ["feature", "bugfix", "hotfix", "release", "chore", "feat", "fix"]
require_rebase_target = "origin/main"
ignore_authors = ["dependabot[bot]", "copilot[bot]", "pre-commit-ci[bot]", "github-actions[bot]"]
```

Adjust `require_rebase_target` to match the actual default branch.

### Create GitHub Actions Workflow

Create `.github/workflows/commit-check.yml`:

```yaml
name: Commit Check

on:
  push:
  pull_request:
    branches: ['main']

permissions:
  contents: read
  pull-requests: write

jobs:
  commit-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: commit-check/commit-check-action@v2
        with:
          message: true
          branch: true
          author-name: false
          author-email: false
          job-summary: true
          pr-comments: ${{ github.event_name == 'pull_request' }}
```

Adjust the `branches` filter to match the actual default branch.

If user does NOT want PR comments, remove the `pull-requests: write` permission and set `pr-comments: false`.

## Step 5: Final Checklist

After setup, verify:

- [ ] `.husky/commit-msg` exists and is executable (JS projects)
- [ ] `.husky/pre-push` exists and is executable (JS projects)
- [ ] `commit-check.toml` exists at repo root
- [ ] `.github/workflows/commit-check.yml` exists
- [ ] `package.json` has `prepare` script for husky (JS projects)
- [ ] `.gitignore` does NOT ignore `.husky/` directory
- [ ] Test: `git commit -m "bad message"` is rejected locally
- [ ] Test: `git commit -m "feat: test message"` is accepted locally

## Summary Output

After completing setup, print a clear summary:

```
✅ CI Pipeline Configured

Local Hooks (Husky):
  .husky/commit-msg  — Validates conventional commit messages
  .husky/pre-push    — Validates conventional branch names

GitHub Actions:
  .github/workflows/commit-check.yml — CI validation on push/PR
  commit-check.toml                  — Shared config for commit-check

Conventions:
  Commits: https://www.conventionalcommits.org/en/v1.0.0/
  Branches: https://conventional-branch.github.io/

Next steps:
  1. Commit these changes: git add -A && git commit -m "ci: add commit and branch conventions"
  2. Push to trigger the GitHub Action
  3. Share conventions with your team
```
