import * as os from "node:os";
import * as path from "node:path";
import type { AgentConfig } from "./types.js";

// --- Constants ---

export const PI_SESSIONS_DIR = path.join(os.homedir(), ".pi", "agent", "sessions");

// --- Pure Helpers ---

export function bareSkillName(name: string): string {
  return name.replace(/^skill:/, "");
}

export function getSessionPath(sessionId: string): string {
  const safeId = sessionId.replace(/[^a-zA-Z0-9-]/g, "_");
  return path.join(PI_SESSIONS_DIR, `${safeId}.jsonl`);
}

/**
 * Filters XML-style <skill> blocks from a string based on permissions.
 */
export function filterSkills(
  content: string,
  allowedSet?: Set<string>,
  disabledSet?: Set<string>,
): string {
  const startTag = "<available_skills>";
  const endTag = "</available_skills>";

  const blocks = [...content.matchAll(/<available_skills>([\s\S]*?)<\/available_skills>/gi)];
  if (blocks.length === 0) return content;

  let newContent = content;

  for (const blockMatch of blocks) {
    const fullMatch = blockMatch[0];
    let skillsInner = blockMatch[1];

    const filteredInner = skillsInner.replace(/(\s*<skill>[\s\S]*?<\/skill>)/gi, (match) => {
      const nameMatch = match.match(/<name>(.*?)<\/name>/i);
      if (!nameMatch?.[1]) return match;

      const name = nameMatch[1].trim();
      if (allowedSet && !allowedSet.has(name)) return "";
      if (disabledSet && disabledSet.has(name)) return "";
      return match;
    });

    newContent = newContent.replace(fullMatch, startTag + filteredInner + endTag);
  }

  return newContent;
}

export function parseMarkdown(content: string): { frontmatter: Record<string, any>; body: string } {
  const frontmatter: Record<string, any> = {};
  const normalized = content.replace(/\r\n/g, "\n");
  const lines = normalized.split("\n");

  if (!lines[0]?.startsWith("---")) return { frontmatter, body: normalized };

  let i = 1;
  let yamlBlock = "";
  while (i < lines.length && !lines[i]?.startsWith("---")) {
    yamlBlock += lines[i] + "\n";
    i++;
  }

  const yamlLines = yamlBlock.split("\n");
  let inPermissionBlock = false;
  let inSkillBlock = false;

  for (const line of yamlLines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const indent = line.match(/^(\s*)/)?.[0].length || 0;

    if (indent === 0) {
      const match = trimmed.match(/^([\w-]+):\s*(.*)$/);
      if (match) {
        const key = match[1]!;
        const val = match[2]!.trim().replace(/^['"]|['"]$/g, "");
        inPermissionBlock = key === "permission";
        if (key === "thinking_effort" || key === "thinking") {
          frontmatter.thinkingEffort = val;
        }
        inSkillBlock = false;
        if (!inPermissionBlock) frontmatter[key] = val;
      }
    } else if (inPermissionBlock && indent === 2) {
      const match = trimmed.match(/^([\w-]+):\s*(.*)$/);
      if (match && match[1] === "skill") {
        inSkillBlock = true;
        frontmatter.skill = {};
      } else {
        inSkillBlock = false;
      }
    } else if (inSkillBlock && indent >= 4) {
      const skillMatch = trimmed.match(/^["']?(.*?)["']?:\s*["']?(allow|deny)["']?$/);
      if (skillMatch) {
        frontmatter.skill[skillMatch[1]!] = skillMatch[2];
      }
    }
  }

  return {
    frontmatter,
    body: lines
      .slice(i + 1)
      .join("\n")
      .trim(),
  };
}

export function serializeFrontmatter(config: Partial<AgentConfig>): string {
  let yaml = "---\n";
  yaml += `name: ${config.name}\n`;
  yaml += `description: "${config.description}"\n`;
  if (config.model) yaml += `model: ${config.model}\n`;
  if (config.thinkingEffort) yaml += `thinking: ${config.thinkingEffort}\n`;
  if (config.skillPermissions) {
    yaml += "permission:\n  skill:\n";
    for (const [s, action] of Object.entries(config.skillPermissions))
      yaml += `      "${s}": ${action}\n`;
  } else yaml += 'permission:\n  skill:\n      "*": deny\n';
  yaml += "---\n";
  return yaml;
}
