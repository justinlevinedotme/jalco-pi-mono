import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import crypto from "node:crypto";
import type { TodoRecord } from "../../core/types.js";
import { parseTodoContent, serializeTodo } from "../../core/parser.js";
import { getTodoPath } from "../files/path.js";

export async function ensureTodosDir(todosDir: string): Promise<void> {
  await fs.mkdir(todosDir, { recursive: true });
}

export async function readTodoFile(filePath: string, idFallback: string): Promise<TodoRecord> {
  const content = await fs.readFile(filePath, "utf8");
  return parseTodoContent(content, idFallback);
}

export async function writeTodoFile(filePath: string, todo: TodoRecord): Promise<void> {
  todo.modified_at = new Date().toISOString();
  await fs.writeFile(filePath, serializeTodo(todo), "utf8");
}

export async function generateTodoId(todosDir: string): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const id = crypto.randomBytes(4).toString("hex");
    if (!existsSync(getTodoPath(todosDir, id))) return id;
  }
  throw new Error("Failed to generate unique todo id");
}

export async function ensureTodoExists(filePath: string, id: string): Promise<TodoRecord | null> {
  if (!existsSync(filePath)) return null;
  return readTodoFile(filePath, id);
}

export async function appendTodoBody(
  filePath: string,
  todo: TodoRecord,
  text: string,
): Promise<TodoRecord> {
  const spacer = todo.body.trim().length ? "\n\n" : "";
  const body = `${todo.body.replace(/\s+$/, "")}${spacer}${text.trim()}\n`;
  const updated: TodoRecord = { ...todo, body };
  await writeTodoFile(filePath, updated);
  return updated;
}
