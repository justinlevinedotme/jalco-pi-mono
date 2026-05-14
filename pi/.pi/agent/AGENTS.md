# agents.md

<context>
Applies to all projects and agents regardless of language, framework, or toolchain. Project-level rules MUST be declared inside `<project-override>` tags — only those rules take precedence over globals. Anything outside `<project-override>` tags in a project-level `agents.md` extends rather than replaces the global.
</context>

---

## 1. Socratic Questioning

<rules>

MUST NOT start coding when a task is large, ambiguous, or spans multiple systems. MUST ask first.

### Ask when

- Scope is unclear
- Task has more than one reasonable interpretation
- More than ~2 non-trivial architectural decisions are required
- Work spans files, services, or domains not yet seen
- "Done" is undefined

### How

MUST use available question tools — MUST NOT dump a wall of text.

- MUST ask one question at a time
- SHOULD offer concrete options over open-ended blanks
- MUST state current assumption so the user can correct rather than re-explain
- MUST stop once enough context exists for a confident first step

### Do not ask when

- Task is small and self-contained
- User said "just do it" or "use your best judgment"
- Context is already established in the conversation

</rules>

---

## 2. Branch Naming

<rules>

MUST follow: `<type>/<short-description>` — lowercase, hyphens only.

| Type | Use |
|---|---|
| `feat/` | New feature |
| `fix/` | Bug fix |
| `chore/` | Maintenance, deps, config |
| `refactor/` | Restructuring, no behaviour change |
| `docs/` | Documentation only |
| `test/` | Tests |
| `ci/` | CI/CD |
| `hotfix/` | Urgent production fix |
| `release/` | Release prep |

<examples>
<example>
<output>
feat/user-avatar-upload
fix/session-timeout-loop
hotfix/null-pointer-checkout
</output>
</example>
</examples>

- Description MUST be under 50 characters after the prefix
- Features MUST branch from `main` or `develop`; hotfixes from `main`
- MUST delete branch after merge
- MUST NOT commit directly to `main`, `master`, or `develop`

</rules>

---

## 3. Commit Messages

<rules>

MUST follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <summary>

[body]

[footer]
```

| Type | Use |
|---|---|
| `feat` | New feature |
| `fix` | Bug fix |
| `chore` | Build, tooling, deps |
| `refactor` | No behaviour change |
| `docs` | Docs only |
| `test` | Tests |
| `ci` | CI/CD |
| `perf` | Performance |
| `style` | Formatting only |
| `revert` | Reverts a commit |

**Summary:** imperative mood, lowercase after colon, no trailing period, ≤ 72 characters, specific.

**Body:** what and why (not how), wrapped at 72 characters, blank line after summary.

**Footer:** SHOULD reference issues (`Closes #123`). MUST declare `BREAKING CHANGE: <description>`.

<examples>
<example type="correct">
<output>
feat(auth): add OAuth2 login with Google

Allows sign-in via Google account. Token stored in httpOnly cookie.

Closes #88
</output>
</example>
<example type="wrong">
<output>
fixed stuff
feat: Added Login.
WIP
</output>
</example>
</examples>

</rules>

---

## 4. Pull Requests & Review

<instructions>

MUST check for `CONTRIBUTING.md` (or `.github/CONTRIBUTING.md`) first. If present, it takes precedence — follow it exactly. Rules below are the fallback.

<rules>

**Title:** MUST match conventional commit format — `feat(scope): description`.

**Description MUST include:**

- What — summary of the change
- Why — motivation or linked issue
- How — non-obvious decisions
- Testing — how it was verified
- Screenshots — REQUIRED for UI changes

<guidelines>
```markdown
## What

## Why
Closes #

## How

## Testing

## Screenshots (if UI change)
```
</guidelines>

**Size:** SHOULD be under 400 lines. If unavoidably large, MUST include a "Tour" section describing reading order. MUST NOT bundle unrelated changes.

**Opening:**
- MUST NOT open against `main` while WIP — MUST use `draft`
- MUST run linting, formatting, and tests before pushing
- MUST resolve all conflict markers before review
- MUST NOT self-approve

**Reviewing:**
- MUST lead with the most important concern
- MUST prefix feedback: `blocker:`, `nit:`, `suggestion:`, `question:`
- MUST NOT approve unless safe to merge without further review
- MUST NOT leave a PR unresponded for more than one business day

**Merging:**
- Feature branches MUST squash merge
- Release branches MUST use merge commit
- Rebase merge MAY be used when history is clean and worth preserving
- MUST delete source branch after merge
- MUST NOT force-push to a shared branch

</rules>

</instructions>

---

## 5. Library & Tooling

<instructions>

<context>
Prefer what the ecosystem is moving toward. Default to the modern equivalent.
</context>

<rules>

- MUST NOT choose a tool based on familiarity or search popularity
- MUST flag legacy libraries as technical debt — MUST NOT migrate without being asked
- MUST check for a native runtime solution before adding any dependency
- MUST NOT add a library for operations the language or runtime handles natively
- MUST check recency — if docs or releases are more than two years old, search for a maintained alternative
- SHOULD prefer tools that consolidate multiple legacy tools into one

</rules>

<guidelines>

A tool is modern if it:
- Has active maintenance and recent releases
- Is recommended by the ecosystem for new projects
- Consolidates or replaces older tools in its category
- Is built on current platform primitives

If most answers are no, treat as legacy and surface the alternative.

</guidelines>

</instructions>

---

## 6. General Behaviour

<rules>

- MUST read existing conventions before writing new code — MUST match the style found
- MUST NOT silently fix unrelated issues — MUST surface them as separate suggestions
- MUST fail loudly — never silently skip or guess when blocked or uncertain
- SHOULD improve what is touched, but MUST NOT scope-creep beyond the current task
- MUST NOT hardcode secrets — MUST use environment variables or a secret manager

</rules>

---

## 7. Editing This File

<instructions>

Any modification to this file MUST follow the [RFC-XML-STYLE-GUIDE](https://github.com/jal-co/jalco-opencode/blob/main/opencode/.config/opencode/at/RFC-XML-STYLE-GUIDE.md).

<rules>

- MUST wrap new sections in appropriate XML tags
- MUST use uppercase RFC 2119 keywords for normative requirements
- MUST use lowercase for non-normative language
- MUST NOT add RFC boilerplate or preamble
- XML MUST be well-formed — all tags closed and properly nested
- MUST NOT let RFC/XML conventions surface in user-facing responses

**Project overrides:**
- Project-level rules that replace a global rule MUST be placed inside `<project-override>` tags
- MUST name the section being overridden via the `section` attribute
- Rules outside `<project-override>` in a project `agents.md` are additive — they extend, not replace, the global
- When reading a project `agents.md`, MUST apply `<project-override>` rules in place of the named global section

</rules>

<examples>
<example>
<output>
<project-override section="2. Branch Naming">
MUST follow `<ticket-id>/<short-description>` — e.g. `PROJ-123/add-login`.
</project-override>

<project-override section="4. Pull Requests & Review">
MUST use the repo's existing PR template — skip the global template.
</project-override>
</output>
</example>
</examples>

<guidelines>

| Content | Tag |
|---|---|
| Behavioural directives | `<instructions>` |
| Hard requirements | `<rules>` |
| Preferences | `<guidelines>` |
| Scope limits | `<constraints>` |
| Step-by-step processes | `<workflow>` |
| Demonstrations | `<examples>` / `<example>` |
| Background | `<context>` |

</guidelines>

</instructions>