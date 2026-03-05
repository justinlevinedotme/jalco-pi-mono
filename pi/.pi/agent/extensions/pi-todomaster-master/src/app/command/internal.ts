import fs from "node:fs/promises";
import type { ExtensionCommandContext } from "@mariozechner/pi-coding-agent";
import type { ChecklistItem, TodoRecord } from "../../core/types.js";
import {
  generateTodoId,
  getTodosDir,
  getTodoPath,
  readTodoFile,
  writeTodoFile,
} from "../../io/index.js";

interface InternalArgs {
  internal: true;
  action: "create" | "update" | "append" | "tick";
  id?: string;
  type?: "todo" | "prd" | "spec";
  title?: string;
  body?: string;
  checklist?: Array<{ id?: string; title: string; done?: boolean }>;
  item?: string;
}

function now(): string {
  return new Date().toISOString();
}

function fail(error: string): { ok: false; error: string } {
  return { ok: false, error };
}

function parseChecklist(
  items?: Array<{ id?: string; title: string; done?: boolean }>,
): ChecklistItem[] | undefined {
  if (!items) return undefined;
  if (!items.length) return [];
  const list: ChecklistItem[] = [];
  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    if (!item?.title?.trim()) throw new Error("Checklist item title is required.");
    const id = item.id?.trim() || `${index + 1}`;
    const done = item.done === true;
    list.push({ id, title: item.title.trim(), status: done ? "checked" : "unchecked", done });
  }
  return list;
}

async function load(todosDir: string, id: string): Promise<TodoRecord> {
  const filePath = getTodoPath(todosDir, id);
  return readTodoFile(filePath, id);
}

async function save(todosDir: string, todo: TodoRecord): Promise<void> {
  const filePath = getTodoPath(todosDir, todo.id, todo.type);
  await writeTodoFile(filePath, todo);
}

async function runCreate(todosDir: string, args: InternalArgs) {
  const type = args.type || "todo";
  if (!args.title?.trim()) return fail("title is required");
  if (type === "todo" && (!args.checklist || !args.checklist.length))
    return fail("checklist is required");
  const id = await generateTodoId(todosDir);
  const todo: TodoRecord = {
    id,
    title: args.title.trim(),
    tags: [],
    status: "open",
    created_at: now(),
    modified_at: now(),
    type,
    checklist: parseChecklist(args.checklist),
    body: (args.body || "").trim(),
  };
  await save(todosDir, todo);
  return { ok: true as const, action: "create", id };
}

async function runUpdate(todosDir: string, args: InternalArgs) {
  if (!args.id) return fail("id is required");
  const todo = await load(todosDir, args.id);
  if (args.title?.trim()) todo.title = args.title.trim();
  if (typeof args.body === "string") todo.body = args.body;
  if (args.checklist) todo.checklist = parseChecklist(args.checklist);
  todo.modified_at = now();
  await save(todosDir, todo);
  return { ok: true as const, action: "update", id: todo.id };
}

async function runAppend(todosDir: string, args: InternalArgs) {
  if (!args.id) return fail("id is required");
  if (!args.body?.trim()) return fail("body is required");
  const todo = await load(todosDir, args.id);
  const base = todo.body.trim();
  todo.body = `${base}${base ? "\n\n" : ""}${args.body.trim()}\n`;
  todo.modified_at = now();
  await save(todosDir, todo);
  return { ok: true as const, action: "append", id: todo.id };
}

async function runTick(todosDir: string, args: InternalArgs) {
  if (!args.id) return fail("id is required");
  if (!args.item?.trim()) return fail("item is required");
  const todo = await load(todosDir, args.id);
  if (!todo.checklist?.length) return fail("checklist is empty");
  const item = todo.checklist.find((entry) => entry.id === args.item);
  if (!item) return fail("checklist item not found");
  item.status = "checked";
  item.done = true;
  todo.modified_at = now();
  await save(todosDir, todo);
  return { ok: true as const, action: "tick", id: todo.id, item: args.item };
}

export function parseInternalArgs(args: string): InternalArgs | null {
  const trimmed = args.trim();
  if (!trimmed.startsWith("--internal ")) return null;
  const value = trimmed.slice(11).trim();
  if (!value) throw new Error("missing internal payload");
  const parsed = JSON.parse(value) as InternalArgs;
  if (parsed.internal !== true) throw new Error("internal flag must be true");
  return parsed;
}

export async function runInternal(
  args: InternalArgs,
  ctx: ExtensionCommandContext,
): Promise<string> {
  const todosDir = getTodosDir(ctx.cwd);
  await fs.mkdir(todosDir, { recursive: true });
  const action = args.action;
  const result =
    action === "create"
      ? await runCreate(todosDir, args)
      : action === "update"
        ? await runUpdate(todosDir, args)
        : action === "append"
          ? await runAppend(todosDir, args)
          : await runTick(todosDir, args);
  return JSON.stringify(result);
}

export function blockedResponse(): string {
  return JSON.stringify({
    ok: false,
    error:
      "Direct CLI mutation is blocked. Use /todo UI actions. Internal execution requires '--internal <json>' and is reserved for extension-managed calls.",
  });
}
