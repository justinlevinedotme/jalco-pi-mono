export interface AgentConfig {
  name: string;
  description: string;
  systemPrompt: string;
  source: "user" | "project";
  filePath: string;
  model?: string;
  thinkingEffort?: string;
  skillPermissions?: Record<string, "allow" | "deny">;
}

export interface SubagentTask {
  agent: string;
  task: string;
  cwd?: string;
}
