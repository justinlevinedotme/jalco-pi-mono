import type { TodoFrontMatter, TodoRecord } from "../core/types.js";
import { TODO_ID_PREFIX } from "../core/constants.js";
import { normalizeTodoId } from "../core/parser.js";

export function formatTodoId(id: string): string {
  return `${TODO_ID_PREFIX}${id}`;
}

export function displayTodoId(id: string): string {
  return formatTodoId(normalizeTodoId(id));
}

export function isTodoClosed(status: string): boolean {
  return ["closed", "done", "abandoned"].includes(status.toLowerCase());
}

function isChecklistItemDone(item: { status?: string; done?: boolean }): boolean {
  if (typeof item.done === "boolean") return item.done;
  return item.status === "checked";
}

function countChecklistDone(todo: {
  checklist?: Array<{ status?: string; done?: boolean }>;
}): number {
  if (!todo.checklist?.length) return 0;
  return todo.checklist.filter((item) => isChecklistItemDone(item)).length;
}

export function deriveTodoStatus(todo: TodoRecord): string {
  if (!todo.checklist?.length) return todo.status;
  const checked = countChecklistDone(todo);
  if (checked === 0) return "open";
  if (checked === todo.checklist.length) return "done";
  return "in-progress";
}

export function formatChecklistProgress(todo: TodoFrontMatter): string {
  if (!todo.checklist?.length) return "";
  const checked = countChecklistDone(todo);
  return ` (${checked}/${todo.checklist.length})`;
}

export function getTodoTitle(todo: TodoFrontMatter): string {
  return todo.title || "(untitled)";
}

export function getTodoStatus(todo: TodoFrontMatter): string {
  return todo.status || "open";
}

export function clearAssignmentIfClosed(todo: TodoFrontMatter): void {
  if (!isTodoClosed(getTodoStatus(todo))) return;
  todo.assigned_to_session = undefined;
  todo.assigned_to_session_file = undefined;
}

export function sortTodos(todos: TodoFrontMatter[]): TodoFrontMatter[] {
  const rank = (todo: TodoFrontMatter): number => {
    const status = deriveTodoStatus(todo as TodoRecord).toLowerCase();
    if (status === "done") return 0;
    if (status === "closed") return 1;
    if (status === "abandoned") return 2;
    return 3;
  };
  const openRank = (todo: TodoFrontMatter): number => {
    const status = deriveTodoStatus(todo as TodoRecord).toLowerCase();
    if (status === "done") return -1;
    if (status === "in-progress") return 0;
    if (status === "open") return 1;
    return 2;
  };
  const modified = (todo: TodoFrontMatter): number => {
    const value = Date.parse(todo.modified_at || todo.created_at || "");
    if (!Number.isFinite(value)) return 0;
    return value;
  };
  return [...todos].sort((a, b) => {
    const aStatus = deriveTodoStatus(a as TodoRecord);
    const bStatus = deriveTodoStatus(b as TodoRecord);
    const aClosed = isTodoClosed(aStatus);
    const bClosed = isTodoClosed(bStatus);
    if (aClosed !== bClosed) return aClosed ? 1 : -1;
    if (!aClosed) {
      const aOpenRank = openRank(a);
      const bOpenRank = openRank(b);
      if (aOpenRank !== bOpenRank) return aOpenRank - bOpenRank;
      const aAssigned = Boolean(a.assigned_to_session);
      const bAssigned = Boolean(b.assigned_to_session);
      if (aAssigned !== bAssigned) return aAssigned ? -1 : 1;
      return modified(b) - modified(a);
    }
    if (aClosed && bClosed) {
      const aRank = rank(a);
      const bRank = rank(b);
      if (aRank !== bRank) return aRank - bRank;
      return modified(b) - modified(a);
    }
    return (a.created_at || "").localeCompare(b.created_at || "");
  });
}

export function buildTodoSearchText(todo: TodoFrontMatter): string {
  const tags = todo.tags.join(" ");
  const assignment = todo.assigned_to_session ? `assigned:${todo.assigned_to_session}` : "";
  return `${todo.title} ${tags} ${todo.status} ${assignment}`.trim();
}

export function formatAssignmentSuffix(todo: TodoFrontMatter): string {
  return todo.assigned_to_session ? ` (assigned: ${todo.assigned_to_session})` : "";
}

export function formatTodoHeading(todo: TodoFrontMatter): string {
  const tagText = todo.tags.length ? ` [${todo.tags.join(", ")}]` : "";
  const progress = formatChecklistProgress(todo);
  return `${getTodoTitle(todo)}${tagText}${formatAssignmentSuffix(todo)}${progress}`;
}
