import fs from "node:fs/promises";
import { readFileSync, readdirSync, statSync } from "node:fs";
import type { TodoFrontMatter } from "../../core/types.js";
import { splitFrontMatter, parseFrontMatter } from "../../core/parser.js";
import { sortTodos } from "../../format/index.js";

function toTodo(id: string, content: string, modifiedAt: string): TodoFrontMatter {
  const parts = splitFrontMatter(content);
  const parsed = parseFrontMatter(parts.frontMatter, id);
  return {
    id,
    title: parsed.title,
    tags: parsed.tags ?? [],
    status: parsed.status,
    created_at: parsed.created_at,
    modified_at: modifiedAt,
    assigned_to_session: parsed.assigned_to_session,
    checklist: parsed.checklist,
    type: parsed.type,
    template: parsed.template,
    links: parsed.links,
    agent_rules: parsed.agent_rules,
    worktree: parsed.worktree,
    ralph_loop_mode: parsed.ralph_loop_mode,
  };
}

async function files(todosDir: string): Promise<string[]> {
  const list: string[] = [];
  const scan = async (dir: string): Promise<void> => {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = `${dir}/${entry.name}`;
      if (entry.isDirectory()) {
        await scan(full);
        continue;
      }
      if (!entry.name.endsWith(".md")) continue;
      list.push(full);
    }
  };
  await scan(todosDir);
  return list;
}
export async function listTodos(todosDir: string): Promise<TodoFrontMatter[]> {
  let entries: string[] = [];
  try {
    entries = await files(todosDir);
  } catch {
    return [];
  }
  const todos: TodoFrontMatter[] = [];
  for (const entry of entries) {
    const file = entry.split("/").pop() || "";
    if (!file.endsWith(".md")) continue;
    const id = file.slice(0, -3);
    try {
      const content = await fs.readFile(entry, "utf8");
      const stat = await fs.stat(entry);
      todos.push(toTodo(id, content, stat.mtime.toISOString()));
    } catch {
      continue;
    }
  }
  return sortTodos(todos);
}
export function listTodosSync(todosDir: string): TodoFrontMatter[] {
  let entries: string[] = [];
  try {
    const roots = [todosDir, `${todosDir}/prds`, `${todosDir}/specs`, `${todosDir}/todos`];
    for (const root of roots) {
      let names: string[] = [];
      try {
        names = readdirSync(root);
      } catch {
        continue;
      }
      for (const name of names) entries.push(`${root}/${name}`);
    }
  } catch {
    return [];
  }
  const todos: TodoFrontMatter[] = [];
  for (const entry of entries) {
    const file = entry.split("/").pop() || "";
    if (!file.endsWith(".md")) continue;
    const id = file.slice(0, -3);
    try {
      const content = readFileSync(entry, "utf8");
      const stat = statSync(entry);
      todos.push(toTodo(id, content, stat.mtime.toISOString()));
    } catch {
      continue;
    }
  }
  return sortTodos(todos);
}
