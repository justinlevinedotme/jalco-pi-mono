import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import * as path from "node:path";
import { randomUUID } from "node:crypto";
import type { SubagentTask } from "./types.js";
import { filterSkills } from "./utils.js";
import {
  loadAgents,
  disabledSkills,
  disabledAgents,
  activeSubagentProcesses,
  loadPermissions,
  savePermissions,
} from "./store.js";
import { runSubagent } from "./runner.js";
import { selectCwd, manageSubagents, manageSkills, createAgent } from "./ui.js";

// --- Extension Entry Point ---

function createDashboard(taskStatuses: any[], isFinal = false) {
  const spinner = ["|", "/", "-", "\\"];
  const char = spinner[Math.floor(Date.now() / 200) % spinner.length];

  const summary = taskStatuses
    .map((s) => {
      const toolText = s.toolCalls.length > 0 ? ` [${s.toolCalls.join("->")}]` : "";
      const statusText = s.status === "running" ? (isFinal ? "completed" : char) : s.status;
      return `- **${s.name}**: ${statusText}${toolText}\n  - *Task:* ${s.task.slice(0, 100)}${s.task.length > 100 ? "..." : ""}\n  - *CWD:* ${path.basename(s.cwd)}`;
    })
    .join("\n");

  if (isFinal) {
    const fullOutput = taskStatuses
      .map((s) => `### Result from Subagent: ${s.name}\n\n${s.output || "(No response)"}`)
      .join("\n\n---\n\n");
    return `### Subagent Execution Results\n${summary}\n\n${fullOutput}`;
  }

  const lastActive = taskStatuses.find((s) => s.status === "running") || taskStatuses[taskStatuses.length - 1];
  const activeOutput = lastActive?.output ? `#### Current Output from ${lastActive.name}\n${lastActive.output}` : "";

  return `### Subagent Execution Dashboard\n${summary}\n\n${activeOutput}`;
}

export default function (pi: ExtensionAPI) {
  // 1. System Prompt Orchestration
  pi.on("before_agent_start", async (event, ctx) => {
    loadPermissions(ctx.cwd);
    let { systemPrompt } = event;
    if (!systemPrompt) return undefined;

    const subagentWhitelistRaw = process.env.SUBAGENT_WHITELIST;
    if (subagentWhitelistRaw !== undefined) {
      const allowed = new Set(subagentWhitelistRaw.split(",").filter(Boolean));
      systemPrompt = filterSkills(systemPrompt, allowed, undefined);
    } else if (disabledSkills.size > 0) {
      systemPrompt = filterSkills(systemPrompt, undefined, disabledSkills);
    }

    const agents = loadAgents(ctx.cwd).filter((a) => !disabledAgents.has(a.name));
    let injection = "";
    if (agents.length > 0) {
      const agentList = agents
        .map(
          (a) =>
            `  <agent>\n    <name>${a.name}</name>\n    <description>${a.description}</description>\n  </agent>`,
        )
        .join("\n");
      injection += `\n\n<available_subagents>\n${agentList}\n</available_subagents>\n`;
      injection += `\n<delegation_rules>\nIf a task is predicted to be substantial, focused, or highly specialized (e.g., pure research, heavy refactoring, or specific domain optimization), you SHOULD proactively suggest creating a new subagent or delegating to an existing one from <available_subagents> using the 'invoke_subagent' tool.\n</delegation_rules>\n`;
    }

    const skillEnd = systemPrompt.indexOf("</available_skills>");
    if (skillEnd !== -1) {
      systemPrompt =
        systemPrompt.substring(0, skillEnd + "</available_skills>".length) +
        injection +
        systemPrompt.substring(skillEnd + "</available_skills>".length);
    } else {
      systemPrompt = injection + systemPrompt;
    }
    return { systemPrompt };
  });

  // 2. invoke_subagent tool
  pi.registerTool({
    name: "invoke_subagent",
    description:
      "Delegate a specific task to specialized subagents. Supports multiple agents via the 'tasks' parameter. Only use agents listed in <available_subagents>.",
    label: "Invoke Subagent",
    parameters: {
      type: "object" as any,
      properties: {
        agent: {
          type: "string",
          description: "Name of the agent to invoke (ignored if 'tasks' provided)",
        },
        task: {
          type: "string",
          description: "The instructions for the agent (ignored if 'tasks' provided)",
        },
        cwd: { type: "string", description: "Optional: Override working directory for the agent" },
        session_id: { type: "string", description: "Optional: ID of a previous session to resume" },
        parallel: {
          type: "boolean",
          description: "Run multiple tasks in parallel (default: false)",
        },
        tasks: {
          type: "array",
          items: {
            type: "object",
            properties: {
              agent: { type: "string" },
              task: { type: "string" },
              cwd: { type: "string" },
            },
            required: ["agent", "task"],
          },
          description: "Batch multiple subagent tasks.",
        },
      },
      required: [],
    } as any,
    async execute(toolCallId, params, signal, onUpdate, ctx) {
      const p = params as any;
      const tasksToRun: SubagentTask[] =
        p.tasks || (p.agent && p.task ? [{ agent: p.agent, task: p.task, cwd: p.cwd }] : []);
      if (tasksToRun.length === 0) throw new Error("No tasks or agent/task provided.");

      const agents = loadAgents(ctx.cwd);
      const isParallel = p.parallel === true;
      const taskStatuses = tasksToRun.map((t) => ({
        name: t.agent,
        task: t.task,
        cwd: t.cwd || ctx.cwd,
        status: "pending",
        output: "",
        toolCalls: [] as string[],
      }));

      const updateUI = () => {
        if (!onUpdate || signal?.aborted) return;
        onUpdate({ content: [{ type: "text", text: createDashboard(taskStatuses) }], details: {} });
      };

      if (isParallel) {
        if (ctx.hasUI) ctx.ui.notify(`DELEGATING ${tasksToRun.length} TASKS IN PARALLEL`, "info");
        await Promise.all(
          tasksToRun.map(async (taskInfo, i) => {
            const agentConfig = agents.find((a) => a.name === taskInfo.agent);
            if (!agentConfig) throw new Error(`Agent '${taskInfo.agent}' not found.`);
            if (disabledAgents.has(taskInfo.agent))
              throw new Error(`Agent '${taskInfo.agent}' is currently disabled.`);
            const activeSessionId = p.session_id || randomUUID();
            taskStatuses[i]!.status = "running";
            const output = await runSubagent(
              agentConfig,
              taskInfo.task,
              taskStatuses[i]!.cwd,
              activeSessionId,
              (data) => {
                taskStatuses[i]!.output = data.output;
                taskStatuses[i]!.toolCalls = data.toolCalls;
                updateUI();
              },
              signal,
            );
            taskStatuses[i]!.status = "completed";
            taskStatuses[i]!.output = output;
          }),
        );
        if (signal?.aborted)
          return { content: [{ type: "text", text: "Parallel batch aborted by user." }], details: {} };
        return { content: [{ type: "text", text: createDashboard(taskStatuses, true) }], details: {} };
      } else {
        for (let i = 0; i < tasksToRun.length; i++) {
          const taskInfo = tasksToRun[i]!;
          const agentConfig = agents.find((a) => a.name === taskInfo.agent);
          if (!agentConfig) throw new Error(`Agent '${taskInfo.agent}' not found.`);
          if (disabledAgents.has(taskInfo.agent))
            throw new Error(`Agent '${taskInfo.agent}' is currently disabled.`);
          const activeSessionId = p.session_id || randomUUID();
          taskStatuses[i]!.status = "running";
          if (ctx.hasUI)
            ctx.ui.notify(
              `DELEGATING [${i + 1}/${tasksToRun.length}] TO '${taskInfo.agent}'`,
              "info",
            );
          const output = await runSubagent(
            agentConfig,
            taskInfo.task,
            taskStatuses[i]!.cwd,
            activeSessionId,
            (data) => {
              taskStatuses[i]!.output = data.output;
              taskStatuses[i]!.toolCalls = data.toolCalls;
              updateUI();
            },
            signal,
          );
          if (signal?.aborted)
            return {
              content: [{ type: "text", text: createDashboard(taskStatuses) + "\n\nBatch aborted by user." }],
              details: {},
            };
          taskStatuses[i]!.status = "completed";
          taskStatuses[i]!.output = output;
        }
        return { content: [{ type: "text", text: createDashboard(taskStatuses, true) }], details: {} };
      }
    },
  });

  // 3. Command /agents for GUI
  pi.registerCommand("agents", {
    description: "Manage and launch subagents, skill permissions, and orchestrator prompt",
    handler: async (_args, ctx) => {
      while (true) {
        const choice = await ctx.ui.select("Agent Manager", [
          "Launch Subagent(s)",
          "Manage Subagents",
          "Manage Skill Permissions",
          "Abort Active Subagents",
          "Done",
        ]);
        if (!choice || choice === "Done") break;
        if (choice === "Launch Subagent(s)") {
          await launchMultiGui(pi, ctx);
        } else if (choice === "Manage Subagents") {
          await manageSubagents(pi, ctx);
        } else if (choice === "Manage Skill Permissions") {
          await manageSkills(pi, ctx, disabledSkills, "Main Agent Skill Permissions");
        } else if (choice === "Abort Active Subagents") {
          if (activeSubagentProcesses.size === 0) {
            ctx.ui.notify("No active processes.", "warning");
          } else {
            const count = activeSubagentProcesses.size;
            for (const [pid] of activeSubagentProcesses.entries()) {
              try { process.kill(pid, "SIGTERM"); } catch {}
            }
            activeSubagentProcesses.clear();
            ctx.ui.notify(`Aborted ${count} processes.`, "info");
          }
        }
      }
    },
  });

  pi.on("session_start", (_event, ctx) => {
    if (ctx.hasUI) ctx.ui.notify("Agent Manager loaded. Use /agents to configure.", "info");
  });

  pi.on("input", async (event, ctx) => {
    const text = event.text.trim();
    if (text.startsWith("/subagent:")) return { action: "handled" };
    return { action: "continue" };
  });
}

async function launchMultiGui(pi: ExtensionAPI, ctx: any) {
  const agents = loadAgents(ctx.cwd).filter((a) => !disabledAgents.has(a.name));
  const batch: SubagentTask[] = [];
  let isParallel = false;
  while (true) {
    const currentBatchSummary = batch
      .map((t, i) => `${i + 1}. ${t.agent} (@ ${path.basename(t.cwd || ctx.cwd)})`)
      .join("\n");
    const options = [
      ...agents.map((a) => `Add ${a.name}`),
      "---",
      `${isParallel ? "✅" : "❌"} Run in Parallel`,
      "Execute Batch",
      "Clear Batch",
      "Back",
    ];
    const choice = await ctx.ui.select(
      `Multi-Agent Queue:\n${currentBatchSummary || "(Empty)"}`,
      options,
    );
    if (!choice || choice === "Back") break;
    if (choice.includes("Run in Parallel")) {
      isParallel = !isParallel;
      continue;
    }
    if (choice === "Execute Batch") {
      if (batch.length === 0) {
        ctx.ui.notify("Queue is empty.", "warning");
        continue;
      }
      pi.sendUserMessage(
        `invoke_subagent(tasks=${JSON.stringify(batch)}, parallel=${isParallel})`,
        { deliverAs: "steer" },
      );
      break;
    }
    if (choice === "Clear Batch") {
      batch.length = 0;
      continue;
    }
    if (choice.startsWith("Add ")) {
      const agentName = choice.replace("Add ", "");
      const task = await ctx.ui.input(
        `Prompt for ${agentName}`,
        "Enter specific instructions...",
      );
      if (!task) continue;
      const targetCwd = await selectCwd(ctx);
      batch.push({ agent: agentName, task, cwd: targetCwd });
    }
  }
}
