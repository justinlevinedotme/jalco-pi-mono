import type { TodoFrontMatter, TodoRecord } from "./types.js";

export function todoType(record: TodoFrontMatter | TodoRecord): "prd" | "spec" | "todo" {
  const value = record.type || "todo";
  if (value === "prd") return "prd";
  if (value === "spec") return "spec";
  return "todo";
}
