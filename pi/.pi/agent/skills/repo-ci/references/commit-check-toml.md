# commit-check.toml Configuration Reference

Full configuration reference for commit-check v2. Place at repository root as `commit-check.toml` or `cchk.toml`.

## [commit] Section

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `conventional_commits` | bool | `true` | Enforce conventional commit format |
| `subject_capitalized` | bool | `false` | Require capitalized subject (conflicts with conventional commits) |
| `subject_imperative` | bool | `true` | Require imperative mood in subject |
| `subject_max_length` | int | `80` | Maximum subject line length |
| `subject_min_length` | int | `5` | Minimum subject line length |
| `allow_commit_types` | list | see below | Allowed commit type prefixes |
| `allow_merge_commits` | bool | `true` | Allow merge commits (bypass checks) |
| `allow_revert_commits` | bool | `true` | Allow revert commits (bypass checks) |
| `allow_empty_commits` | bool | `false` | Allow empty commit messages |
| `allow_fixup_commits` | bool | `true` | Allow fixup! commits (bypass checks) |
| `allow_wip_commits` | bool | `false` | Allow WIP commits |
| `require_body` | bool | `false` | Require commit body |
| `require_signed_off_by` | bool | `false` | Require `Signed-off-by:` footer |
| `ignore_authors` | list | `[]` | Bot authors to ignore |

### Default allow_commit_types

```toml
allow_commit_types = ["feat", "fix", "docs", "style", "refactor", "test", "chore", "ci"]
```

Extended set (recommended):

```toml
allow_commit_types = ["feat", "fix", "docs", "style", "refactor", "perf", "test", "chore", "ci", "build", "revert"]
```

## [branch] Section

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `conventional_branch` | bool | `true` | Enforce conventional branch naming |
| `allow_branch_types` | list | see below | Allowed branch prefixes |
| `require_rebase_target` | string | `"origin/main"` | Rebase target branch |
| `ignore_authors` | list | `[]` | Bot authors to ignore |

### Default allow_branch_types

```toml
allow_branch_types = ["feature", "bugfix", "hotfix", "release", "chore", "feat", "fix"]
```

## Conventional Commits Quick Reference

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Types

| Type | SemVer | Description |
|------|--------|-------------|
| `feat` | MINOR | New feature |
| `fix` | PATCH | Bug fix |
| `docs` | — | Documentation only |
| `style` | — | Formatting, no code change |
| `refactor` | — | Code change, no feature/fix |
| `perf` | PATCH | Performance improvement |
| `test` | — | Adding/fixing tests |
| `chore` | — | Maintenance, tooling |
| `ci` | — | CI/CD changes |
| `build` | — | Build system changes |
| `revert` | — | Revert previous commit |

### Breaking Changes

Append `!` after type/scope or add `BREAKING CHANGE:` footer → MAJOR version bump.

```
feat(api)!: remove deprecated v1 endpoints

BREAKING CHANGE: v1 API endpoints are no longer available
```

## Conventional Branch Quick Reference

```
<type>/<description>
```

### Types

| Prefix | Use |
|--------|-----|
| `feature/` or `feat/` | New features |
| `bugfix/` or `fix/` | Bug fixes |
| `hotfix/` | Urgent production fixes |
| `release/` | Release preparation |
| `chore/` | Non-code tasks (deps, docs) |

### Rules

- Lowercase alphanumerics, hyphens, dots only
- No consecutive/leading/trailing hyphens or dots
- Include ticket numbers when applicable: `feat/issue-123-add-login`
- `main`, `master`, `develop` are allowed as-is

## Source Links

- Conventional Commits: https://www.conventionalcommits.org/en/v1.0.0/
- Conventional Branch: https://conventional-branch.github.io/
- commit-check: https://github.com/commit-check/commit-check
- commit-check-action: https://github.com/commit-check/commit-check-action
- Husky: https://typicode.github.io/husky/
