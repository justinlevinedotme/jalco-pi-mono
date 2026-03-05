import path from "node:path";
import { existsSync } from "node:fs";
import { TODO_DIR_NAME, TODO_SETTINGS_NAME } from "../../core/constants.js";
export function getTodosDir(cwd: string): string {
  return path.resolve(cwd, TODO_DIR_NAME);
}

export function getTodoSettingsPath(todosDir: string): string {
  return path.join(todosDir, TODO_SETTINGS_NAME);
}

function group(type: string): string {
  if (type === "prd") return "prds";
  if (type === "spec") return "specs";
  return "todos";
}

export function getTodoPath(todosDir: string, id: string, type?: string): string {
  if (type) return path.join(todosDir, group(type), `${id}.md`);
  const direct = path.join(todosDir, `${id}.md`);
  if (existsSync(direct)) return direct;
  const prd = path.join(todosDir, "prds", `${id}.md`);
  if (existsSync(prd)) return prd;
  const spec = path.join(todosDir, "specs", `${id}.md`);
  if (existsSync(spec)) return spec;
  const todo = path.join(todosDir, "todos", `${id}.md`);
  if (existsSync(todo)) return todo;
  return path.join(todosDir, "todos", `${id}.md`);
}
