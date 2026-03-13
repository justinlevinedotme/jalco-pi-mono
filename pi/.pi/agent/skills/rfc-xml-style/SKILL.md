---
name: rfc-xml-style
description: |-
  RFC 2119 keywords and XML tag structure guide for agent prompts, skill definitions, and internal documentation.
  Use when writing, reviewing, or refactoring markdown files that instruct AI agents — including skills, prompt templates,
  system prompts, and workflow docs. Provides keyword semantics, XML tag catalog, nesting best practices, and before/after examples.

  Examples:
  - user: "Refactor this skill to use RFC keywords" → apply RFC 2119 keyword conventions
  - user: "Add XML structure to this prompt" → wrap sections in semantic XML tags
  - user: "Review my SKILL.md formatting" → audit RFC keyword usage and XML structure
  - user: "Convert this doc to RFC+XML style" → full transformation with style guide
  - user: "/refactor-rfc-xml ./prompts" → batch refactor all markdown in a folder
---

<overview>
Authoritative reference for structuring agent-facing documentation with RFC 2119 requirement-level keywords and semantic XML tags. Covers keyword definitions, XML tag catalog, naming conventions, nesting rules, and combined usage patterns.
</overview>

<constraints>

## RFC/XML is for STRUCTURE, not COMMUNICATION

RFC 2119 keywords and XML tags are for structuring agent prompts, skill definitions, and internal documentation ONLY.

Files MUST NOT be modified such that agents would:
- Speak to users using RFC keywords ("You MUST provide a file path")
- Output XML tags in their responses to users
- Adopt a formal/robotic communication style

Refactored files SHOULD make agents BEHAVE correctly, not SPEAK formally.

## NO RFC Boilerplate

You MUST NOT add any RFC 2119 preamble or boilerplate text to files. Models already know what RFC keywords mean. Adding a preamble wastes tokens and clutters the file.

</constraints>

<instructions>

Read the full style guide reference before applying any transformations:

- **Style Guide**: [references/style-guide.md](references/style-guide.md) — RFC 2119 keyword definitions, XML tag catalog, naming conventions, nesting rules, and combined patterns

</instructions>

<workflow>

## Applying RFC+XML to a file

1. Read the file and identify its type (skill, prompt template, system prompt, workflow doc)
2. Identify sections that map to XML tags (instructions, workflows, examples, constraints, etc.)
3. Identify requirement-level language that SHOULD use RFC keywords
4. Apply XML tags to wrap logical sections — use consistent naming, max 3-4 nesting levels
5. Apply RFC 2119 keywords — convert casual requirement language to proper keywords
6. Preserve YAML frontmatter, code blocks, links, and original intent exactly as-is
7. Verify XML is well-formed (proper nesting, all tags closed)
8. Verify RFC keywords are used appropriately (not overused, not in user-facing output)

</workflow>

<quality-checklist>

- [ ] XML is well-formed (proper nesting, all tags closed)
- [ ] RFC keywords used appropriately (not overused)
- [ ] Frontmatter preserved exactly
- [ ] Code blocks and their content untouched
- [ ] Files remain readable and clear
- [ ] Tags enhance structure, don't obscure content
- [ ] NO RFC/XML leakage into agent communication style
- [ ] Agents still speak naturally to users

</quality-checklist>

<examples>
<example type="correct">
Internal instruction: "The agent MUST verify file exists before editing"
</example>
<example type="wrong">
User-facing output: "I MUST inform you that the file does not exist"
</example>
<example type="correct">
Internal structure: `<workflow>1. Check permissions 2. Edit file</workflow>`
</example>
<example type="wrong">
User-facing output: `<response>File has been edited</response>`
</example>
</examples>
