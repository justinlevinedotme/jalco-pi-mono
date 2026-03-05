import fs from "node:fs";
import type { ExtensionCommandContext } from "@mariozechner/pi-coding-agent";
import type {
  RalphLoopMode,
  TodoFrontMatter,
  TodoMenuAction,
  TodoQuickAction,
  TodoRecord,
} from "../../core/types.js";
import { resolveLinkedPaths } from "../../format/index.js";
import {
  claimTodoAssignment,
  deleteTodo,
  getTodoPath,
  releaseTodoAssignment,
  reopenTodoForUser,
  setTodoRalphLoopMode,
  updateTodoStatus,
} from "../../io/index.js";
import { ensureWorktree } from "../../core/worktree.js";
import { prepareRalphLoop } from "../../core/ralph-loop.js";
import * as flow from "../../ui/gui/actions.js";

type SessionSwitch = (path: string) => Promise<{ cancelled: boolean }>;

function getSessionSwitch(ctx: ExtensionCommandContext): SessionSwitch | null {
  const value: unknown = Reflect.get(ctx, "switchSession");
  if (typeof value !== "function") return null;
  return value as SessionSwitch;
}

function validateLinks(record: TodoFrontMatter): { ok: true } | { error: string } {
  if (!record.links) return { ok: true };
  const root = record.links.root_abs || "";
  const paths = resolveLinkedPaths(record.links);
  const hasRelative = paths.some((p) => !p.startsWith("/"));
  if (hasRelative && !root)
    return { error: "links.root_abs is required when links contain repo-relative files." };
  for (const item of paths) {
    if (!fs.existsSync(item)) return { error: `Required linked file not found: ${item}` };
  }
  return { ok: true };
}

function withWorktree(prompt: string, worktreePath?: string): string {
  if (!worktreePath) return prompt;
  return (
    `You MUST execute this task from worktree path "${worktreePath}".\n` +
    `Before any edits, you MUST set your working directory to "${worktreePath}" and keep all repo operations scoped there.\n\n` +
    prompt
  );
}

function ralphMode(record: TodoFrontMatter): RalphLoopMode {
  return record.ralph_loop_mode || "off";
}

async function runWork(
  todosDir: string,
  record: TodoFrontMatter,
  ctx: ExtensionCommandContext,
  done: () => void,
  setPrompt: (value: string) => void,
): Promise<"stay" | "exit"> {
  if (ralphMode(record) !== "off") {
    return runRalph(todosDir, record, ctx, done);
  }
  const links = validateLinks(record);
  if ("error" in links) {
    ctx.ui.notify(links.error, "error");
    return "stay";
  }
  let worktreePath: string | undefined;
  try {
    const worktree = await ensureWorktree(record, ctx);
    if ("path" in worktree) {
      worktreePath = worktree.path;
      if (worktree.created) ctx.ui.notify(`Created worktree ${worktree.path}`, "info");
      if (!worktree.created) ctx.ui.notify(`Switched worktree ${worktree.path}`, "info");
    }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown worktree setup error";
    ctx.ui.notify(`Worktree setup failed: ${message}`, "error");
    return "stay";
  }
  const filePath = getTodoPath(todosDir, record.id, record.type);
  setPrompt(withWorktree(flow.work(record, filePath), worktreePath));
  done();
  return "exit";
}

async function runRalph(
  todosDir: string,
  record: TodoFrontMatter,
  ctx: ExtensionCommandContext,
  done: () => void,
): Promise<"stay" | "exit"> {
  const mode = ralphMode(record);
  if (mode === "off") {
    ctx.ui.notify("Ralph loop is disabled for this item.", "error");
    return "stay";
  }
  if (mode === "ralph-loop-linked") {
    const links = validateLinks(record);
    if ("error" in links) {
      ctx.ui.notify(links.error, "error");
      return "stay";
    }
  }
  const filePath = getTodoPath(todosDir, record.id, record.type);
  const linked = mode === "ralph-loop-linked" ? resolveLinkedPaths(record.links) : [];
  const prepared = prepareRalphLoop(ctx.cwd, mode, filePath, linked);
  const command = prepared.command;
  const notice = `Ralph loop command staged in editor (${mode}, ${prepared.inputPaths.length} file(s)).`;
  done();
  setTimeout(() => {
    ctx.ui.setEditorText(command);
    ctx.ui.notify(notice, "info");
  }, 0);
  return "exit";
}

export async function applyTodoAction(
  todosDir: string,
  ctx: ExtensionCommandContext,
  refresh: () => Promise<void>,
  done: () => void,
  record: TodoRecord,
  action: TodoMenuAction,
  setPrompt: (value: string) => void,
): Promise<"stay" | "exit"> {
  if (action === "refine") {
    const filePath = getTodoPath(todosDir, record.id, record.type);
    setPrompt(flow.refine(record, filePath));
    done();
    return "exit";
  }
  if (action === "work") return runWork(todosDir, record, ctx, done, setPrompt);
  if (action === "review-item") {
    const links = validateLinks(record);
    if ("error" in links) {
      ctx.ui.notify(links.error, "error");
      return "stay";
    }
    const filePath = getTodoPath(todosDir, record.id, record.type);
    setPrompt(flow.review(record, filePath));
    done();
    return "exit";
  }
  if (action === "toggle-ralph-loop") {
    const current = ralphMode(record);
    const next: RalphLoopMode = current === "ralph-loop" ? "off" : "ralph-loop";
    const updated = await setTodoRalphLoopMode(todosDir, record.id, next, ctx);
    if ("error" in updated) {
      ctx.ui.notify(updated.error, "error");
      return "stay";
    }
    await refresh();
    ctx.ui.notify(`Set Ralph loop mode to ${next} for "${record.title || "(untitled)"}"`, "info");
    return "stay";
  }
  if (action === "toggle-ralph-loop-linked") {
    const current = ralphMode(record);
    const next: RalphLoopMode = current === "ralph-loop-linked" ? "off" : "ralph-loop-linked";
    const updated = await setTodoRalphLoopMode(todosDir, record.id, next, ctx);
    if ("error" in updated) {
      ctx.ui.notify(updated.error, "error");
      return "stay";
    }
    await refresh();
    ctx.ui.notify(`Set Ralph loop mode to ${next} for "${record.title || "(untitled)"}"`, "info");
    return "stay";
  }
  if (action === "run-ralph-loop") return runRalph(todosDir, record, ctx, done);
  if (action === "view") return "stay";
  if (action === "edit-checklist") return "stay";
  if (action === "attach-links") return "stay";
  if (action === "validate-links") return "stay";
  if (action === "audit") return "stay";
  if (action === "assign") {
    const result = await claimTodoAssignment(todosDir, record.id, ctx, false);
    if ("error" in result) {
      ctx.ui.notify(result.error, "error");
      return "stay";
    }
    await refresh();
    ctx.ui.notify(flow.assigned(record), "info");
    return "stay";
  }
  if (action === "release") {
    const result = await releaseTodoAssignment(todosDir, record.id, ctx, true);
    if ("error" in result) {
      ctx.ui.notify(result.error, "error");
      return "stay";
    }
    await refresh();
    ctx.ui.notify(flow.released(record), "info");
    return "stay";
  }
  if (action === "go-to-session") {
    const sessionPath = record.assigned_to_session_file;
    if (!sessionPath) {
      ctx.ui.notify("No assigned session path stored on this item.", "error");
      return "stay";
    }
    const switchSession = getSessionSwitch(ctx);
    if (!switchSession) {
      ctx.ui.notify("Session switching is unavailable in this runtime. Use /resume.", "error");
      return "stay";
    }
    const result = await switchSession(sessionPath);
    if (result.cancelled) {
      ctx.ui.notify("Session switch cancelled.", "error");
      return "stay";
    }
    done();
    return "exit";
  }
  if (action === "delete") {
    const removed = await deleteTodo(todosDir, record.id, ctx);
    if ("error" in removed) {
      ctx.ui.notify(removed.error, "error");
      return "stay";
    }
    await refresh();
    ctx.ui.notify(flow.deleted(record), "info");
    return "stay";
  }
  if (action === "reopen") {
    const reopened = await reopenTodoForUser(todosDir, record.id, ctx);
    if ("error" in reopened) {
      ctx.ui.notify(reopened.error, "error");
      return "stay";
    }
    await refresh();
    ctx.ui.notify(flow.reopened(record), "info");
    return "stay";
  }
  const status = action === "complete" ? "done" : "abandoned";
  const updated = await updateTodoStatus(todosDir, record.id, status, ctx);
  if ("error" in updated) {
    ctx.ui.notify(updated.error, "error");
    return "stay";
  }
  await refresh();
  ctx.ui.notify(flow.done(action === "complete" ? "complete" : "abandon", record), "info");
  return "stay";
}

export async function handleQuickAction(
  todosDir: string,
  todo: TodoFrontMatter | null,
  action: TodoQuickAction,
  showCreateInput: () => void,
  done: () => void,
  setPrompt: (value: string) => void,
  ctx: ExtensionCommandContext,
  resolve: (todo: TodoFrontMatter) => Promise<TodoRecord | null>,
): Promise<void> {
  if (action === "create") return showCreateInput();
  if (!todo) return;
  if (action === "refine") {
    const filePath = getTodoPath(todosDir, todo.id, todo.type);
    setPrompt(flow.refine(todo, filePath));
    done();
    return;
  }
  if (action === "work") {
    const record = await resolve(todo);
    if (!record) return;
    await runWork(todosDir, record, ctx, done, setPrompt);
    return;
  }
}
