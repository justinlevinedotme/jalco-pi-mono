import type { TodoFrontMatter, TodoRecord } from "../core/types.js";
import { formatTodoHeading, getTodoStatus, isTodoClosed } from "./base.js";

export function splitTodosByAssignment(todos: TodoFrontMatter[]): {
  assignedTodos: TodoFrontMatter[];
  openTodos: TodoFrontMatter[];
  closedTodos: TodoFrontMatter[];
} {
  const assignedTodos: TodoFrontMatter[] = [];
  const openTodos: TodoFrontMatter[] = [];
  const closedTodos: TodoFrontMatter[] = [];
  for (const todo of todos) {
    if (isTodoClosed(getTodoStatus(todo))) {
      closedTodos.push(todo);
      continue;
    }
    if (todo.assigned_to_session) assignedTodos.push(todo);
    else openTodos.push(todo);
  }
  return { assignedTodos, openTodos, closedTodos };
}

export function formatTodoList(todos: TodoFrontMatter[]): string {
  if (!todos.length) return "No todos.";
  const split = splitTodosByAssignment(todos);
  const lines: string[] = [];
  const pushSection = (label: string, sectionTodos: TodoFrontMatter[]) => {
    lines.push(`${label} (${sectionTodos.length}):`);
    if (!sectionTodos.length) {
      lines.push("  none");
      return;
    }
    for (const todo of sectionTodos) lines.push(`  ${formatTodoHeading(todo)}`);
  };
  pushSection("Assigned todos", split.assignedTodos);
  pushSection("Open todos", split.openTodos);
  pushSection("Closed todos", split.closedTodos);
  return lines.join("\n");
}

export function buildProgressHint(todo: TodoRecord): string | undefined {
  if (!todo.checklist?.length) return undefined;
  const checked = todo.checklist.filter((i) => i.status === "checked").length;
  const total = todo.checklist.length;
  if (checked < 2) return undefined;
  if (checked / total < 0.5) return undefined;
  return `Progress is ${checked}/${total}. You MAY read the full todo now if you need refreshed context before the next step.`;
}

export function serializeTodoForAgent(todo: TodoRecord): string {
  const payload: Record<string, unknown> = { ...todo };
  delete payload.id;
  const hint = buildProgressHint(todo);
  if (hint) payload.agent_hint = hint;
  return JSON.stringify(payload, null, 2);
}

export function serializeTodoListForAgent(todos: TodoFrontMatter[]): string {
  const split = splitTodosByAssignment(todos);
  const mapTodo = (todo: TodoFrontMatter) => ({
    title: todo.title,
    tags: todo.tags,
    status: todo.status,
    created_at: todo.created_at,
    assigned_to_session: todo.assigned_to_session,
    checklist: todo.checklist,
  });
  return JSON.stringify(
    {
      assigned: split.assignedTodos.map(mapTodo),
      open: split.openTodos.map(mapTodo),
      closed: split.closedTodos.map(mapTodo),
    },
    null,
    2,
  );
}
