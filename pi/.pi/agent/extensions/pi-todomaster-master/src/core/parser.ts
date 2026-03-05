import YAML from "yaml";
import type {
  ChecklistItem,
  RalphLoopMode,
  TodoFrontMatter,
  TodoLinks,
  TodoRecord,
  TodoWorktree,
} from "./types.js";
import { TODO_ID_PATTERN } from "./constants.js";

export function parseFrontMatter(text: string, idFallback: string): TodoFrontMatter {
  const data: TodoFrontMatter = {
    id: idFallback,
    title: "",
    tags: [],
    status: "open",
    created_at: "",
    modified_at: undefined,
    assigned_to_session: undefined,
    assigned_to_session_file: undefined,
    checklist: undefined,
    type: undefined,
    template: undefined,
    links: undefined,
    agent_rules: undefined,
    worktree: undefined,
    ralph_loop_mode: "off",
  };

  const trimmed = text.trim();
  if (!trimmed) return data;

  try {
    const parsed = parseFrontMatterObject(trimmed);
    if (!parsed || typeof parsed !== "object") return data;
    if (typeof parsed.id === "string" && parsed.id) data.id = parsed.id;
    if (typeof parsed.title === "string") data.title = parsed.title;
    if (typeof parsed.status === "string" && parsed.status) data.status = parsed.status;
    if (typeof parsed.created_at === "string") data.created_at = parsed.created_at;
    if (typeof parsed.modified_at === "string" && parsed.modified_at)
      data.modified_at = parsed.modified_at;
    if (typeof parsed.assigned_to_session === "string" && parsed.assigned_to_session.trim()) {
      data.assigned_to_session = parsed.assigned_to_session;
    }
    if (
      typeof parsed.assigned_to_session_file === "string" &&
      parsed.assigned_to_session_file.trim()
    ) {
      data.assigned_to_session_file = parsed.assigned_to_session_file;
    }
    if (Array.isArray(parsed.tags)) {
      data.tags = parsed.tags.filter((tag): tag is string => typeof tag === "string");
    }
    if (Array.isArray(parsed.checklist)) data.checklist = parseChecklist(parsed.checklist);
    if (typeof parsed.type === "string") data.type = parsed.type;
    if (typeof parsed.template === "boolean") data.template = parsed.template;
    if (typeof parsed.agent_rules === "string") data.agent_rules = parsed.agent_rules;
    const links = parseLinks(parsed.links);
    if (links) data.links = links;
    const worktree = parseWorktree(parsed.worktree);
    if (worktree) data.worktree = worktree;
    data.ralph_loop_mode = parseRalphLoopMode(parsed.ralph_loop_mode, parsed.ralph_loop);
  } catch {
    return data;
  }

  return data;
}

function parseFrontMatterObject(text: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(text) as Record<string, unknown> | null;
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    const parsed = YAML.parse(text) as Record<string, unknown> | null;
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  }
}

function parseChecklist(items: unknown[]): ChecklistItem[] {
  const checklist: ChecklistItem[] = [];
  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    if (typeof item !== "object" || item === null) continue;
    const obj = item as Record<string, unknown>;
    if (typeof obj.title !== "string") continue;
    const id = typeof obj.id === "string" && obj.id ? obj.id : `${index + 1}`;
    const done = typeof obj.done === "boolean" ? obj.done : obj.status === "checked";
    const status = done ? "checked" : "unchecked";
    checklist.push({ id, title: obj.title, status, done });
  }
  return checklist;
}

function parseStringList(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const list = value.filter((item): item is string => typeof item === "string");
  if (!list.length) return [];
  return list;
}

function parseLinks(value: unknown): TodoLinks | null {
  if (typeof value !== "object" || value === null) return null;
  const obj = value as Record<string, unknown>;
  return {
    root_abs: typeof obj.root_abs === "string" ? obj.root_abs : undefined,
    prds: parseStringList(obj.prds),
    specs: parseStringList(obj.specs),
    todos: parseStringList(obj.todos),
    reads: parseStringList(obj.reads),
  };
}

function parseWorktree(value: unknown): TodoWorktree | null {
  if (typeof value !== "object" || value === null) return null;
  const obj = value as Record<string, unknown>;
  return {
    enabled: typeof obj.enabled === "boolean" ? obj.enabled : undefined,
    branch: typeof obj.branch === "string" ? obj.branch : undefined,
  };
}

function parseRalphLoopMode(mode: unknown, legacy: unknown): RalphLoopMode {
  if (mode === "ralph-loop" || mode === "ralph-loop-linked" || mode === "off") return mode;
  if (typeof legacy === "boolean") return legacy ? "ralph-loop" : "off";
  return "off";
}

export function findJsonObjectEnd(content: string): number {
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = 0; i < content.length; i += 1) {
    const char = content[i];

    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === "\\") {
        escaped = true;
        continue;
      }
      if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === "{") {
      depth += 1;
      continue;
    }

    if (char === "}") {
      depth -= 1;
      if (depth === 0) return i;
    }
  }

  return -1;
}

export function splitFrontMatter(content: string): { frontMatter: string; body: string } {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (match) {
    const frontMatter = match[1] ?? "";
    const body = content.slice(match[0].length);
    return { frontMatter, body };
  }

  if (!content.startsWith("{")) {
    return { frontMatter: "", body: content };
  }

  const endIndex = findJsonObjectEnd(content);
  if (endIndex === -1) {
    return { frontMatter: "", body: content };
  }

  const frontMatter = content.slice(0, endIndex + 1);
  const body = content.slice(endIndex + 1).replace(/^\r?\n+/, "");
  return { frontMatter, body };
}

export function parseTodoContent(content: string, idFallback: string): TodoRecord {
  const parts = splitFrontMatter(content);
  const parsed = parseFrontMatter(parts.frontMatter, idFallback);
  return {
    id: idFallback,
    title: parsed.title,
    tags: parsed.tags ?? [],
    status: parsed.status,
    created_at: parsed.created_at,
    modified_at: parsed.modified_at,
    assigned_to_session: parsed.assigned_to_session,
    assigned_to_session_file: parsed.assigned_to_session_file,
    checklist: parsed.checklist,
    type: parsed.type,
    template: parsed.template,
    links: parsed.links,
    agent_rules: parsed.agent_rules,
    worktree: parsed.worktree,
    ralph_loop_mode: parsed.ralph_loop_mode,
    body: parts.body ?? "",
  };
}

export function serializeTodo(todo: TodoRecord): string {
  const front = {
    id: todo.id,
    title: todo.title,
    tags: todo.tags ?? [],
    status: todo.status,
    created_at: todo.created_at,
    modified_at: todo.modified_at,
    assigned_to_session: todo.assigned_to_session || undefined,
    assigned_to_session_file: todo.assigned_to_session_file || undefined,
    template: todo.template,
    links: todo.links,
    agent_rules: todo.agent_rules,
    worktree: todo.worktree,
    ralph_loop_mode: todo.ralph_loop_mode || "off",
    checklist: todo.checklist?.map((item) => ({
      id: item.id,
      title: item.title,
      done: item.status === "checked",
    })),
    type: todo.type,
  };
  const frontMatter = YAML.stringify(front).trimEnd();

  const body = todo.body ?? "";
  const trimmedBody = body.replace(/^\n+/, "").replace(/\s+$/, "");
  if (!trimmedBody) return `---\n${frontMatter}\n---\n`;
  return `---\n${frontMatter}\n---\n\n${trimmedBody}\n`;
}

export function validateTodoId(id: string): { id: string } | { error: string } {
  const normalized = normalizeTodoId(id);
  if (!normalized || !TODO_ID_PATTERN.test(normalized)) {
    return { error: "Invalid todo id. Expected TODO-<hex>." };
  }
  return { id: normalized.toLowerCase() };
}

export function normalizeTodoId(id: string): string {
  let trimmed = id.trim();
  if (trimmed.startsWith("#")) {
    trimmed = trimmed.slice(1);
  }
  if (trimmed.toUpperCase().startsWith("TODO-")) {
    trimmed = trimmed.slice(5);
  }
  return trimmed;
}
