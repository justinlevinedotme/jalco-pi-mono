# Pi Agent Manager

A comprehensive subagent orchestration and resource permission system for Pi. This extension allows you to create, manage, and delegate tasks to specialized specialists while maintaining strict control over skill access.

## Features

- **Subagent Management GUI**: Use `/agents` to create, edit, toggle, or delete specialized agents.
- **Recursive Permission System**: Enforces `deny-all` skill permissions for subagents by default. Skills must be explicitly whitelisted in the subagent's frontmatter.
- **RFC 2119 Compliance**: New subagents are automatically initialized with an expert-level, RFC-compliant system prompt structure.
- **Stateful Resumption**: Subagents support session persistence via `session_id`, allowing for follow-up tasks without losing context.
- **Live Observability**: Real-time tool-trace and status spinner during subagent execution.
- **Skill Filtering**: Dynamic pruning of `<available_skills>` XML blocks in both Main Agent and Subagent sessions.

## Usage

### Slash Commands

- `/agents`: Open the interactive management GUI.

### Subagent Delegation

The Main Agent will automatically see enabled subagents in its `<available_subagents>` block. It can delegate tasks using the `invoke_subagent` tool:

```json
{
  "agent": "explore",
  "task": "Search the codebase for authentication logic."
}
```

### Skill Permissions

Subagent `.md` files use a specialized frontmatter for skill access:

```yaml
---
name: specialist
description: "Instruction-heavy rule for the Main Agent."
permission:
  skill:
    "*": deny
    "websearch": allow
---
```

## Storage Locations

- **Project Agents**: `.pi/agents/*.md`
- **Global Agents**: `~/.pi/agent/agents/*.md`
- **Sessions**: `~/.pi/agent/sessions/*.jsonl`
