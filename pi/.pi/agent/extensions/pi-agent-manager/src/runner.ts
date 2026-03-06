import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { spawn } from "node:child_process";
import type { AgentConfig } from "./types.js";
import { PI_SESSIONS_DIR, getSessionPath } from "./utils.js";
import { activeSubagentProcesses } from "./store.js";

/**
 * Subagent runner.
 * Spawns 'pi' in JSON mode to capture messages.
 * Supports native session persistence and recursive extension loading for permissions.
 */
export async function runSubagent(
  agent: AgentConfig,
  task: string,
  cwd: string,
  sessionId: string,
  onUpdate?: (data: { output: string; toolCalls: string[]; isThinking: boolean }) => void,
  signal?: AbortSignal,
): Promise<string> {
  if (!fs.existsSync(PI_SESSIONS_DIR)) fs.mkdirSync(PI_SESSIONS_DIR, { recursive: true });

  const sessionFile = getSessionPath(sessionId);
  const args = ["--mode", "json", "-p"];

  if (task.includes("[AGENT_ARCHITECT_MODE]")) {
    args.push("--no-session");
  } else {
    args.push("--session", sessionFile);
  }

  if (agent.model) {
    args.push("--model", agent.model);
  }
  if (agent.thinkingEffort) {
    args.push("--thinking", agent.thinkingEffort);
  }

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "pi-agent-manager-"));
  const promptPath = path.join(tempDir, "system-prompt.txt");
  fs.writeFileSync(promptPath, agent.systemPrompt);
  args.push("--append-system-prompt", promptPath);

  args.push(task);

  const spawnEnv = { ...process.env };
  if (agent.skillPermissions) {
    const allowed = Object.entries(agent.skillPermissions)
      .filter(([s, act]) => act === "allow" && s !== "*")
      .map(([s]) => s);
    spawnEnv.SUBAGENT_WHITELIST = allowed.join(",");
  }

  return new Promise((resolve, reject) => {
    const proc = spawn("pi", args, { cwd, env: spawnEnv, stdio: ["ignore", "pipe", "pipe"] });
    if (proc.pid) activeSubagentProcesses.set(proc.pid, agent.name);

    if (signal) {
      signal.addEventListener(
        "abort",
        () => {
          if (proc.pid) {
            try {
              process.kill(proc.pid, "SIGTERM");
            } catch {}
          }
        },
        { once: true },
      );
    }

    let output = "";
    let buf = "";
    const toolCalls: string[] = [];
    let isThinking = false;

    const processLine = (line: string) => {
      if (!line.trim()) return;
      try {
        const evt = JSON.parse(line);

        if (evt.type === "thinking_start") {
          isThinking = true;
          if (onUpdate) onUpdate({ output, toolCalls, isThinking });
        }
        if (evt.type === "thinking_end") {
          isThinking = false;
          if (onUpdate) onUpdate({ output, toolCalls, isThinking });
        }

        if (evt.type === "tool_execution_start" && evt.toolName) {
          toolCalls.push(evt.toolName);
          if (toolCalls.length > 3) toolCalls.shift();
          if (onUpdate) onUpdate({ output, toolCalls, isThinking });
        }

        if (evt.type === "message_end" && evt.message?.role === "assistant") {
          const content = evt.message.content;
          if (Array.isArray(content)) {
            let currentMessageText = "";
            for (const part of content) {
              if (part.type === "text") {
                currentMessageText += part.text;
              }
            }
            if (currentMessageText) {
              output = currentMessageText;
              if (onUpdate) onUpdate({ output, toolCalls, isThinking });
            }
          }
        }
      } catch {}
    };

    proc.stdout.on("data", (d) => {
      buf += d.toString();
      const lines = buf.split("\n");
      buf = lines.pop() || "";
      lines.forEach(processLine);
    });

    proc.on("close", (code, signalCode) => {
      if (proc.pid) activeSubagentProcesses.delete(proc.pid);
      fs.rmSync(tempDir, { recursive: true, force: true });
      if (code === 0) resolve(output.trim() || "(No response from agent)");
      else if (signal?.aborted || signalCode === "SIGTERM") resolve("Task aborted by user.");
      else reject(new Error(`Subagent exited with code ${code} (signal: ${signalCode})`));
    });

    proc.on("error", (err) => {
      if (proc.pid) activeSubagentProcesses.delete(proc.pid);
      fs.rmSync(tempDir, { recursive: true, force: true });
      reject(err);
    });
  });
}
