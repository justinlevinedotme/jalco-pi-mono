import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import type { AgentConfig } from "./types.js";
import { parseMarkdown } from "./utils.js";

// --- Module-level State ---

export const disabledSkills = new Set<string>();
export const disabledAgents = new Set<string>();
export const activeSubagentProcesses = new Map<number, string>();

// --- Persistence ---

const PERMISSIONS_FILE = ".pi/agent-manager-permissions.json";
let permissionsLoaded = false;

export function loadPermissions(cwd: string) {
  if (permissionsLoaded) return;
  const filePath = path.join(cwd, PERMISSIONS_FILE);
  if (!fs.existsSync(filePath)) return;
  try {
    const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    if (Array.isArray(data.disabledSkills)) {
      disabledSkills.clear();
      for (const s of data.disabledSkills) disabledSkills.add(s);
    }
    if (Array.isArray(data.disabledAgents)) {
      disabledAgents.clear();
      for (const a of data.disabledAgents) disabledAgents.add(a);
    }
    permissionsLoaded = true;
  } catch (e) {
    console.error("Failed to load permissions:", e);
  }
}

export function savePermissions(cwd: string) {
  const dir = path.join(cwd, ".pi");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(cwd, PERMISSIONS_FILE);
  const data = {
    disabledSkills: Array.from(disabledSkills),
    disabledAgents: Array.from(disabledAgents),
  };
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("Failed to save permissions:", e);
  }
}

// --- Agent Loading ---

export function loadAgents(cwd: string): AgentConfig[] {
  const agents: AgentConfig[] = [];
  const dirs: { path: string; source: "user" | "project" }[] = [
    { path: path.join(os.homedir(), ".pi", "agent", "agents"), source: "user" },
    ...(cwd ? [{ path: path.join(cwd, ".pi", "agents"), source: "project" as const }] : []),
  ];

  for (const { path: dir, source } of dirs) {
    if (!fs.existsSync(dir)) continue;
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.name.endsWith(".md")) continue;
        const filePath = path.join(dir, entry.name);
        try {
          const content = fs.readFileSync(filePath, "utf-8");
          const { frontmatter, body } = parseMarkdown(content);
          if (frontmatter.name && frontmatter.description) {
            agents.push({
              name: frontmatter.name,
              description: frontmatter.description,
              systemPrompt: body,
              source,
              filePath,
              model: frontmatter.model,
              skillPermissions: frontmatter.skill,
            });
          }
        } catch {}
      }
    } catch {}
  }
  return agents;
}
