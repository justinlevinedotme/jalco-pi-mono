import type { Theme } from "@mariozechner/pi-coding-agent";
import { keyHint } from "@mariozechner/pi-coding-agent";
import type { ChecklistItem, TodoFrontMatter, TodoRecord } from "../core/types.js";
import {
  deriveTodoStatus,
  formatChecklistProgress,
  getTodoStatus,
  getTodoTitle,
  isTodoClosed,
} from "./base.js";
import { splitTodosByAssignment } from "./agent.js";

export function renderAssignmentSuffix(
  theme: Theme,
  todo: TodoFrontMatter,
  currentSessionId?: string,
): string {
  if (!todo.assigned_to_session) return "";
  const isCurrent = todo.assigned_to_session === currentSessionId;
  const color = isCurrent ? "success" : "dim";
  const suffix = isCurrent ? ", current" : "";
  return theme.fg(color, ` (assigned: ${todo.assigned_to_session}${suffix})`);
}

export function renderTodoHeading(
  theme: Theme,
  todo: TodoFrontMatter,
  currentSessionId?: string,
): string {
  const derivedStatus =
    "checklist" in todo && todo.checklist?.length
      ? deriveTodoStatus(todo as TodoRecord)
      : getTodoStatus(todo);
  const closed = isTodoClosed(derivedStatus);
  const titleColor = closed ? "dim" : "text";
  const tagText = todo.tags.length ? theme.fg("dim", ` [${todo.tags.join(", ")}]`) : "";
  const assignmentText = renderAssignmentSuffix(theme, todo, currentSessionId);
  const progress = formatChecklistProgress(todo);
  const progressText = progress ? theme.fg("muted", progress) : "";
  return theme.fg(titleColor, getTodoTitle(todo)) + tagText + assignmentText + progressText;
}

export function renderTodoList(
  theme: Theme,
  todos: TodoFrontMatter[],
  expanded: boolean,
  currentSessionId?: string,
): string {
  if (!todos.length) return theme.fg("dim", "No todos");
  const split = splitTodosByAssignment(todos);
  const lines: string[] = [];
  const pushSection = (label: string, sectionTodos: TodoFrontMatter[]) => {
    lines.push(theme.fg("muted", `${label} (${sectionTodos.length})`));
    if (!sectionTodos.length) {
      lines.push(theme.fg("dim", "  none"));
      return;
    }
    const maxItems = expanded ? sectionTodos.length : Math.min(sectionTodos.length, 3);
    for (let i = 0; i < maxItems; i++)
      lines.push(`  ${renderTodoHeading(theme, sectionTodos[i], currentSessionId)}`);
    if (!expanded && sectionTodos.length > maxItems)
      lines.push(theme.fg("dim", `  ... ${sectionTodos.length - maxItems} more`));
  };
  pushSection("Assigned todos", split.assignedTodos);
  lines.push("");
  pushSection("Open todos", split.openTodos);
  lines.push("");
  pushSection("Closed todos", split.closedTodos);
  return lines.join("\n");
}

export function renderChecklist(theme: Theme, checklist: ChecklistItem[]): string[] {
  if (!checklist.length) return [];
  const lines: string[] = [];
  const checked = checklist.filter((i) => i.status === "checked").length;
  lines.push(theme.fg("muted", `Progress: ${checked}/${checklist.length} items complete`));
  lines.push("");
  for (const item of checklist) {
    const checkbox =
      item.status === "checked" ? theme.fg("success", "[x]") : theme.fg("dim", "[ ]");
    const titleColor = item.status === "checked" ? "dim" : "text";
    lines.push(`${checkbox} ${theme.fg(titleColor, item.title)}`);
  }
  return lines;
}

export function renderTodoDetail(theme: Theme, todo: TodoRecord, expanded: boolean): string {
  const summary = renderTodoHeading(theme, todo);
  if (!expanded) return summary;
  const derivedStatus = deriveTodoStatus(todo);
  const tags = todo.tags.length ? todo.tags.join(", ") : "none";
  const createdAt = todo.created_at || "unknown";
  const bodyText = todo.body?.trim() ? todo.body.trim() : "No details yet.";
  const bodyLines = bodyText.split("\n");
  const checklistLines = todo.checklist?.length ? renderChecklist(theme, todo.checklist) : [];
  const lines = [
    summary,
    theme.fg("muted", `Status: ${derivedStatus}`),
    theme.fg("muted", `Tags: ${tags}`),
    theme.fg("muted", `Created: ${createdAt}`),
    "",
    ...checklistLines,
    checklistLines.length ? "" : "",
    theme.fg("muted", "Body:"),
    ...bodyLines.map((line) => theme.fg("text", `  ${line}`)),
  ];
  return lines.join("\n");
}

export function appendExpandHint(theme: Theme, text: string): string {
  return `${text}\n${theme.fg("dim", `(${keyHint("expandTools", "to expand")})`)}`;
}
