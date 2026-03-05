import fs from "node:fs/promises";
import type { TodoSettings } from "../../core/types.js";
import { DEFAULT_TODO_SETTINGS } from "../../core/constants.js";
import { splitFrontMatter, parseFrontMatter } from "../../core/parser.js";
import { isTodoClosed } from "../../format/index.js";
import { getTodoSettingsPath } from "../files/path.js";

function normalizeTodoSettings(raw: Partial<TodoSettings>): TodoSettings {
  const gc = raw.gc ?? DEFAULT_TODO_SETTINGS.gc;
  const gcDays =
    raw.gcDays !== undefined && Number.isFinite(raw.gcDays)
      ? raw.gcDays
      : DEFAULT_TODO_SETTINGS.gcDays;
  return {
    gc: Boolean(gc),
    gcDays: Math.max(0, Math.floor(gcDays)),
  };
}

export async function readTodoSettings(todosDir: string): Promise<TodoSettings> {
  const settingsPath = getTodoSettingsPath(todosDir);
  let data: Partial<TodoSettings> = {};
  try {
    const raw = await fs.readFile(settingsPath, "utf8");
    data = JSON.parse(raw) as Partial<TodoSettings>;
  } catch {
    data = {};
  }
  return normalizeTodoSettings(data);
}

export async function garbageCollectTodos(todosDir: string, settings: TodoSettings): Promise<void> {
  if (!settings.gc) return;
  const groups = ["prds", "specs", "todos"];
  const files: string[] = [];
  for (const group of groups) {
    let entries: string[] = [];
    try {
      entries = await fs.readdir(`${todosDir}/${group}`);
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (!entry.endsWith(".md")) continue;
      files.push(`${todosDir}/${group}/${entry}`);
    }
  }
  const cutoff = Date.now() - settings.gcDays * 24 * 60 * 60 * 1000;
  await Promise.all(
    files.map(async (filePath) => {
      const file = filePath.split("/").pop() || "";
      if (!file.endsWith(".md")) return;
      const id = file.slice(0, -3);
      try {
        const content = await fs.readFile(filePath, "utf8");
        const parts = splitFrontMatter(content);
        const parsed = parseFrontMatter(parts.frontMatter, id);
        if (!isTodoClosed(parsed.status)) return;
        const stats = await fs.stat(filePath);
        if (!Number.isFinite(stats.mtimeMs)) return;
        if (stats.mtimeMs < cutoff) await fs.unlink(filePath);
      } catch {
        return;
      }
    }),
  );
}
