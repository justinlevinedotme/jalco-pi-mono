import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import type { ExtensionContext } from "@mariozechner/pi-coding-agent";
import type { RalphLoopMode, TodoRecord } from "../../core/types.js";
import { validateTodoId } from "../../core/parser.js";
import { clearAssignmentIfClosed, displayTodoId, isTodoClosed } from "../../format/index.js";
import { ensureTodoExists, writeTodoFile } from "../files/files.js";
import { getTodoPath } from "../files/path.js";

function notFound(id: string): { error: string } {
  return { error: `Todo ${displayTodoId(id)} not found` };
}

async function withExisting(
  todosDir: string,
  id: string,
  ctx: ExtensionContext,
  run: (
    todo: TodoRecord,
    filePath: string,
    sessionId: string,
  ) => Promise<TodoRecord | { error: string }>,
): Promise<TodoRecord | { error: string }> {
  const validated = validateTodoId(id);
  if ("error" in validated) return { error: validated.error };
  const normalizedId = validated.id;
  const filePath = getTodoPath(todosDir, normalizedId);
  if (!existsSync(filePath)) return notFound(id);
  const sessionId = ctx.sessionManager.getSessionId();
  const existing = await ensureTodoExists(filePath, normalizedId);
  if (!existing) return notFound(id);
  return run(existing, filePath, sessionId);
}

export async function updateTodoStatus(
  todosDir: string,
  id: string,
  status: string,
  ctx: ExtensionContext,
): Promise<TodoRecord | { error: string }> {
  return withExisting(todosDir, id, ctx, async (existing, filePath) => {
    existing.status = status;
    clearAssignmentIfClosed(existing);
    await writeTodoFile(filePath, existing);
    return existing;
  });
}

export async function claimTodoAssignment(
  todosDir: string,
  id: string,
  ctx: ExtensionContext,
  force = false,
): Promise<TodoRecord | { error: string }> {
  return withExisting(todosDir, id, ctx, async (existing, filePath, sessionId) => {
    if (isTodoClosed(existing.status)) return { error: `Todo ${displayTodoId(id)} is closed` };
    const assigned = existing.assigned_to_session;
    if (assigned && assigned !== sessionId && !force) {
      return {
        error: `Todo ${displayTodoId(id)} is already assigned to session ${assigned}. Use force to override.`,
      };
    }
    if (assigned !== sessionId) {
      existing.assigned_to_session = sessionId;
      const sessionFile = ctx.sessionManager.getSessionFile();
      existing.assigned_to_session_file =
        sessionFile && sessionFile.trim() ? sessionFile : undefined;
      await writeTodoFile(filePath, existing);
    }
    return existing;
  });
}

export async function releaseTodoAssignment(
  todosDir: string,
  id: string,
  ctx: ExtensionContext,
  force = false,
): Promise<TodoRecord | { error: string }> {
  return withExisting(todosDir, id, ctx, async (existing, filePath, sessionId) => {
    const assigned = existing.assigned_to_session;
    if (!assigned) return existing;
    if (assigned !== sessionId && !force) {
      return {
        error: `Todo ${displayTodoId(id)} is assigned to session ${assigned}. Use force to release.`,
      };
    }
    existing.assigned_to_session = undefined;
    existing.assigned_to_session_file = undefined;
    await writeTodoFile(filePath, existing);
    return existing;
  });
}

export async function deleteTodo(
  todosDir: string,
  id: string,
  ctx: ExtensionContext,
): Promise<TodoRecord | { error: string }> {
  return withExisting(todosDir, id, ctx, async (existing, filePath) => {
    await fs.unlink(filePath);
    return existing;
  });
}

export async function reopenTodoForUser(
  todosDir: string,
  id: string,
  ctx: ExtensionContext,
): Promise<TodoRecord | { error: string }> {
  return withExisting(todosDir, id, ctx, async (existing, filePath) => {
    if (existing.checklist?.length) {
      existing.checklist = existing.checklist.map((item) => ({
        id: item.id,
        title: item.title,
        status: "unchecked",
      }));
    }
    existing.status = "open";
    existing.assigned_to_session = undefined;
    existing.assigned_to_session_file = undefined;
    await writeTodoFile(filePath, existing);
    return existing;
  });
}

export async function setTodoRalphLoopMode(
  todosDir: string,
  id: string,
  mode: RalphLoopMode,
  ctx: ExtensionContext,
): Promise<TodoRecord | { error: string }> {
  return withExisting(todosDir, id, ctx, async (existing, filePath) => {
    existing.ralph_loop_mode = mode;
    await writeTodoFile(filePath, existing);
    return existing;
  });
}
