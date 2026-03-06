# Skill Permission Testing Procedure

This document outlines the exact procedure used to verify the recursive skill whitelisting system in `pi-agent-manager`.

## 1. Preparation

- **Extension**: Ensure `pi-agent-manager` is loaded in the main Pi session.
- **Diagnostic Agent**: Deploy the `skill-confirmer` subagent to `.pi/agents/skill-confirmer.md`.
- **Skills**: Ensure the system has several global skills available (e.g., `commit`, `github`, `extending-pi`).

## 2. Test Case 1: Strict Deny-All (Default)

**Objective**: Verify that a subagent with no whitelisted skills sees an empty list.

1. **Configuration**: Edit `skill-confirmer.md` frontmatter:
   ```yaml
   permission:
     skill:
       "*": deny
   ```
2. **Execution**: Run `invoke_subagent(agent="skill-confirmer", task="Report available skills")`.
3. **Success Criteria**: The subagent returns an empty list or indicates that no skills are available between the `<available_skills>` tags.

## 3. Test Case 2: Single Whitelist Override

**Objective**: Verify that explicitly allowing a skill makes it visible while keeping others hidden.

1. **Configuration**: Edit `skill-confirmer.md` frontmatter:
   ```yaml
   permission:
     skill:
       "*": deny
       "extending-pi": allow
   ```
2. **Execution**: Run `invoke_subagent(agent="skill-confirmer", task="Report available skills")`.
3. **Success Criteria**: The subagent reports exactly one skill: `extending-pi`.

## 4. Test Case 3: Multiple Whitelist Override

**Objective**: Verify that multiple skills can be whitelisted simultaneously.

1. **Configuration**: Edit `skill-confirmer.md` frontmatter:
   ```yaml
   permission:
     skill:
       "*": deny
       "extending-pi": allow
       "commit": allow
   ```
2. **Execution**: Run `invoke_subagent(agent="skill-confirmer", task="Report available skills")`.
3. **Success Criteria**: The subagent reports exactly two skills: `extending-pi` and `commit`.

## 5. Test Case 4: Main Agent Blacklist (Independent Check)

**Objective**: Verify that the Main Agent's blacklist does not interfere with Subagent whitelists.

1. **Action**: Use `/agents` -> **Manage Skill Permissions** to disable a skill (e.g., `github`) for the Main Agent.
2. **Verification**:
   - Ask the Main Agent to list its skills (verify `github` is gone).
   - Whitelist `github` for `skill-confirmer`.
   - Invoke `skill-confirmer`.
3. **Success Criteria**: The Subagent should see `github` even if the Main Agent has it disabled.

## Troubleshooting / Common Failures

- **Cached State**: If changes to `.md` files aren't reflecting, use the `/reload` command or trigger a `hot_reload`.
- **Regex Mismatch**: Ensure the subagent prompt contains exactly `<available_skills>` (Pi default).
- **Environment Variable**: Verify that `SUBAGENT_WHITELIST` is being correctly populated in the `runSubagent` spawn logic.
