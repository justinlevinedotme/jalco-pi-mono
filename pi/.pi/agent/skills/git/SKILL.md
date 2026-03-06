---
name: git
description: |-
  Git and GitHub CLI mastery for version control operations. Use proactively for commits, branches,
  PRs, rebases, conflict resolution, and git history management. Covers conventional commits,
  branching strategies, and GitHub workflows.

  Examples:
  - user: "Commit these changes" → stage files, create conventional commit
  - user: "Create a PR" → push branch, use gh pr create with proper template
  - user: "Rebase on main" → fetch, rebase, handle conflicts
  - user: "Fix merge conflict" → identify conflicts, resolve, complete merge
  - user: "Squash my commits" → interactive rebase guidance
  - user: "What's the git history?" → git log with appropriate flags
---

<overview>

Comprehensive guide for git operations, GitHub CLI usage, commit practices, and version control workflows.

</overview>

<commands>

## Git CLI Essentials

### Status & Information

```bash
# Current state
git status                    # Working tree status
git status -sb                # Short format with branch info

# View changes
git diff                      # Unstaged changes
git diff --staged             # Staged changes
git diff HEAD~3               # Last 3 commits
git diff main...HEAD          # Changes since branching from main

# History
git log --oneline -20         # Last 20 commits, compact
git log --graph --oneline     # Visual branch history
git log --stat                # With file change stats
git log -p path/to/file       # History of specific file
git log --author="name"       # Filter by author

# Blame & inspection
git blame path/to/file        # Line-by-line attribution
git show <commit>             # Show commit details
git show <commit>:path/file   # Show file at specific commit
```

### Staging & Committing

```bash
# Stage changes
git add <file>                # Stage specific file
git add .                     # Stage all changes
git add -p                    # Interactive staging (patch mode)
git add -u                    # Stage modified/deleted, not new

# Unstage
git restore --staged <file>   # Unstage file (keep changes)
git reset HEAD <file>         # Alternative unstage

# Commit
git commit -m "message"       # Commit with message
git commit                    # Open editor for message
git commit -am "message"      # Stage tracked + commit
git commit --amend            # Amend last commit (CAUTION)
git commit --amend --no-edit  # Amend without changing message
```

### Branches

```bash
# List & info
git branch                    # List local branches
git branch -a                 # List all (local + remote)
git branch -vv                # With tracking info

# Create & switch
git branch <name>             # Create branch
git switch <name>             # Switch to branch
git switch -c <name>          # Create and switch
git checkout -b <name>        # Alternative create+switch

# Delete
git branch -d <name>          # Delete (safe - checks merged)
git branch -D <name>          # Force delete (CAUTION)

# Rename
git branch -m <old> <new>     # Rename branch
```

### Remote Operations

```bash
# Fetch & pull
git fetch                     # Fetch all remotes
git fetch origin              # Fetch specific remote
git pull                      # Fetch + merge
git pull --rebase             # Fetch + rebase (cleaner history)

# Push
git push                      # Push current branch
git push -u origin <branch>   # Push and set upstream
git push --force-with-lease   # Safe force push (CAUTION)
git push --force              # Force push (DANGER)

# Remote management
git remote -v                 # List remotes
git remote add <name> <url>   # Add remote
git remote set-url origin <url>  # Change remote URL
```

### Merging & Rebasing

```bash
# Merge
git merge <branch>            # Merge branch into current
git merge --no-ff <branch>    # Merge with merge commit
git merge --abort             # Abort failed merge

# Rebase
git rebase main               # Rebase onto main
git rebase -i HEAD~3          # Interactive rebase last 3
git rebase --abort            # Abort failed rebase
git rebase --continue         # Continue after fixing conflicts

# Cherry-pick
git cherry-pick <commit>      # Apply specific commit
git cherry-pick --abort       # Abort cherry-pick
```

### Undoing Changes

```bash
# Discard working changes
git restore <file>            # Discard file changes
git restore .                 # Discard all changes
git checkout -- <file>        # Alternative discard

# Reset commits
git reset --soft HEAD~1       # Undo commit, keep staged
git reset --mixed HEAD~1      # Undo commit, keep unstaged (default)
git reset --hard HEAD~1       # Undo commit, discard changes (DANGER)

# Revert (safe undo)
git revert <commit>           # Create commit that undoes changes
git revert HEAD               # Revert last commit

# Recovery
git reflog                    # View all HEAD movements
git reset --hard <reflog-ref> # Recover lost commits
```

### Stashing

```bash
git stash                     # Stash changes
git stash -m "message"        # Stash with message
git stash list                # List stashes
git stash pop                 # Apply and remove latest
git stash apply               # Apply without removing
git stash drop                # Remove latest stash
git stash clear               # Remove all stashes
```

## GitHub CLI (`gh`)

### Authentication

```bash
gh auth login                 # Interactive login
gh auth status                # Check auth status
gh auth logout                # Logout
```

### Pull Requests

```bash
# Create
gh pr create                  # Interactive PR creation
gh pr create --title "..." --body "..."
gh pr create --draft          # Create as draft
gh pr create --base main      # Specify base branch

# List & view
gh pr list                    # List open PRs
gh pr list --state all        # All PRs
gh pr view                    # View current branch's PR
gh pr view <number>           # View specific PR
gh pr view --web              # Open in browser

# Review & merge
gh pr review                  # Start review
gh pr review --approve        # Approve PR
gh pr review --request-changes -b "feedback"
gh pr merge                   # Merge PR
gh pr merge --squash          # Squash merge
gh pr merge --rebase          # Rebase merge
gh pr merge --delete-branch   # Delete branch after merge

# Checkout
gh pr checkout <number>       # Checkout PR locally
```

### Issues

```bash
# Create & list
gh issue create               # Interactive issue creation
gh issue create --title "..." --body "..."
gh issue list                 # List open issues
gh issue view <number>        # View issue

# Manage
gh issue close <number>       # Close issue
gh issue reopen <number>      # Reopen issue
gh issue comment <number> -b "..."  # Add comment
```

### Repository

```bash
gh repo view                  # View current repo
gh repo clone <owner/repo>    # Clone repository
gh repo fork                  # Fork current repo
gh repo create                # Create new repo
```

### Workflows & Actions

```bash
gh run list                   # List workflow runs
gh run view <id>              # View run details
gh run watch <id>             # Watch run in progress
gh run rerun <id>             # Rerun workflow

gh workflow list              # List workflows
gh workflow run <name>        # Trigger workflow
```

### API Access

```bash
gh api repos/{owner}/{repo}/pulls
gh api repos/{owner}/{repo}/issues
gh api repos/{owner}/{repo}/pulls/<n>/comments
```

</commands>

<rules>

## Conventional Commits

### Format

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting, no code change |
| `refactor` | Code change, no feature/fix |
| `perf` | Performance improvement |
| `test` | Adding/fixing tests |
| `chore` | Maintenance, tooling |
| `ci` | CI/CD changes |
| `build` | Build system changes |
| `revert` | Revert previous commit |

### Examples

```bash
# Feature
git commit -m "feat(auth): add JWT refresh token support"

# Bug fix
git commit -m "fix(api): handle null response in user endpoint"

# Breaking change
git commit -m "feat(api)!: remove deprecated v1 endpoints

BREAKING CHANGE: v1 API endpoints are no longer available"

# With issue reference
git commit -m "fix(cart): prevent negative quantities

Closes #123"

# Multi-line (use editor)
git commit
# Opens editor:
# feat(dashboard): add real-time notifications
#
# - Implement WebSocket connection
# - Add notification bell component
# - Store notifications in local state
#
# Closes #456
```

### Scopes (Project-Specific)

Common scopes:
- `api`, `auth`, `ui`, `db`, `config`
- `deps`, `ci`, `docs`, `test`
- Feature names: `cart`, `checkout`, `profile`

</rules>

<guidelines>

## Branching Strategies

### Trunk-Based Development (Recommended)

```
main ─────●─────●─────●─────●─────●─────
           \   /       \   /
            ●─●         ●─●
         (short-lived feature branches)
```

**Rules:**
- Main is always deployable
- Feature branches SHOULD live < 2 days
- MUST merge via PR with CI checks
- MUST delete branches after merge

**Workflow:**
```bash
git switch -c feat/add-login
# ... make changes ...
git push -u origin feat/add-login
gh pr create --base main
# After approval:
gh pr merge --squash --delete-branch
```

### GitHub Flow

```
main ─────●─────●─────●─────●─────●─────
           \       /
            ●─────●
          (feature branch)
```

**Workflow:**
1. Create branch from main
2. Add commits
3. Open PR
4. Review & discuss
5. Merge to main
6. Deploy

### Git Flow (Complex Projects)

```
main     ─────●───────────────●─────────
              │               │
develop  ─────●─────●─────●───●─────●───
               \   /       \     /
feature         ●─●         \   /
                         release─●
```

**Branches:**
- `main` - production releases
- `develop` - integration branch
- `feature/*` - new features
- `release/*` - release prep
- `hotfix/*` - production fixes

</guidelines>

<workflow>

## Common Workflows

### Feature Development

```bash
# 1. Start fresh
git switch main
git pull

# 2. Create feature branch
git switch -c feat/user-profile

# 3. Work in small commits
git add -p                    # Stage selectively
git commit -m "feat(profile): add avatar upload"
# ... more work ...
git commit -m "feat(profile): add bio field"

# 4. Keep up with main
git fetch origin
git rebase origin/main        # Or merge

# 5. Push and create PR
git push -u origin feat/user-profile
gh pr create --title "feat(profile): add user profile page" --body "$(cat <<'EOF'
## Summary
- Add avatar upload with S3
- Add bio field with markdown support

## Testing
- [ ] Upload various image formats
- [ ] Test bio with special characters
EOF
)"

# 6. After approval
gh pr merge --squash --delete-branch
git switch main
git pull
```

### Hotfix

```bash
# 1. Branch from main
git switch main
git pull
git switch -c hotfix/fix-login-crash

# 2. Fix and commit
git commit -m "fix(auth): handle null session token"

# 3. Push immediately
git push -u origin hotfix/fix-login-crash
gh pr create --title "fix(auth): critical login crash" --body "..."

# 4. Fast-track review and merge
gh pr merge --merge --delete-branch
```

### Conflict Resolution

```bash
# During merge/rebase, if conflicts occur:

# 1. See conflicted files
git status

# 2. Open conflicted file - look for markers:
# <<<<<<< HEAD
# your changes
# =======
# their changes
# >>>>>>> branch-name

# 3. Edit to resolve (remove markers, keep correct code)

# 4. Mark resolved
git add <resolved-file>

# 5. Continue
git merge --continue          # If merging
git rebase --continue         # If rebasing

# Or abort
git merge --abort
git rebase --abort
```

### Squashing Commits

```bash
# Before pushing (interactive rebase)
git rebase -i HEAD~5          # Last 5 commits

# In editor, change 'pick' to 'squash' or 's':
# pick abc1234 First commit
# squash def5678 WIP
# squash ghi9012 More WIP
# squash jkl3456 Fix typo
# squash mno7890 Final touches

# Save, then edit combined commit message

# Alternative: squash merge in PR
gh pr merge --squash
```

</workflow>

<constraints>

## Safety Practices

### MUST NOT Do (Without Explicit Permission)

```bash
# Force push to shared branches
git push --force origin main     # DANGER
git push --force origin develop  # DANGER

# Hard reset shared branches
git reset --hard origin/main     # On shared branch = DANGER

# Delete remote branches others use
git push origin --delete <shared-branch>
```

### MUST Ask Before

```bash
git push --force-with-lease      # Safer force push, but still ask
git rebase                       # On shared branches
git reset --hard                 # Destructive
git clean -fd                    # Removes untracked files
```

### Safe Practices

```bash
# SHOULD use --force-with-lease instead of --force
git push --force-with-lease origin feat/my-branch

# MUST check before destructive operations
git status
git log --oneline -5
git diff

# SHOULD stash before switching with changes
git stash
git switch other-branch
git switch -
git stash pop

# MAY use reflog for recovery
git reflog                       # Find lost commits
git reset --hard HEAD@{2}        # Recover
```

## Commit Message Best Practices

### MUST

- Use imperative mood: "add feature" not "added feature"
- Keep subject line < 72 characters
- Capitalize first letter of subject
- No period at end of subject
- Separate subject from body with blank line
- Explain "what" and "why" in body, not "how"
- Reference issues: "Closes #123" or "Fixes #456"

### MUST NOT

- Use vague messages: "fix bug", "update code", "WIP"
- Combine unrelated changes in one commit
- Include generated files in commits
- Commit secrets, credentials, or .env files

### Template

```
<type>(<scope>): <what changed>

<why this change was needed>

<any additional context>

<footer: issues, breaking changes>
```

</constraints>

<guidelines>

## Git Configuration

### Recommended Settings

```bash
# Identity
git config --global user.name "Your Name"
git config --global user.email "you@example.com"

# Editor
git config --global core.editor "code --wait"

# Default branch
git config --global init.defaultBranch main

# Pull strategy
git config --global pull.rebase true

# Push default
git config --global push.default current

# Aliases
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.ci commit
git config --global alias.st status
git config --global alias.lg "log --oneline --graph --decorate"
```

### Useful Aliases

```bash
# Add to ~/.gitconfig [alias] section:
[alias]
    # Short status
    s = status -sb
    
    # Pretty log
    lg = log --graph --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset' --abbrev-commit
    
    # Last commit
    last = log -1 HEAD --stat
    
    # Undo last commit (keep changes)
    undo = reset --soft HEAD~1
    
    # Amend without editing message
    amend = commit --amend --no-edit
    
    # List branches by recent
    recent = branch --sort=-committerdate --format='%(committerdate:relative)%09%(refname:short)'
```

</guidelines>

<examples>

## Quick Reference

### Daily Workflow

```bash
# Morning sync
git fetch && git status

# Before starting work
git switch main && git pull
git switch -c feat/new-thing

# During work
git add -p && git commit -m "..."

# Before pushing
git fetch origin
git rebase origin/main

# Push and PR
git push -u origin HEAD
gh pr create
```

### Emergency Commands

```bash
# Undo last commit (keep changes)
git reset --soft HEAD~1

# Discard all local changes
git restore . && git clean -fd

# Recover deleted branch
git reflog
git checkout -b recovered-branch <sha>

# Abort everything
git merge --abort
git rebase --abort
git cherry-pick --abort
```

</examples>
