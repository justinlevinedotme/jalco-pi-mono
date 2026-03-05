import type { TodoFrontMatter, TodoRecord } from "../../core/types.js";
import * as prd from "../../domain/prd/actions.js";
import * as spec from "../../domain/spec/actions.js";
import * as todo from "../../domain/todo/actions.js";
import { todoType } from "../../core/entity.js";

function pick(record: TodoFrontMatter | TodoRecord) {
  const type = todoType(record);
  if (type === "prd") return prd;
  if (type === "spec") return spec;
  return todo;
}

export function refine(record: TodoFrontMatter, filePath: string): string {
  return pick(record).refine(record.title || "(untitled)", filePath, record.links);
}

export function work(record: TodoFrontMatter, filePath: string): string {
  return pick(record).work(record.title || "(untitled)", filePath, record.links);
}

export function review(record: TodoFrontMatter, filePath: string): string {
  return pick(record).review(record.title || "(untitled)", filePath, record.links);
}

export function done(action: "complete" | "abandon", record: TodoRecord): string {
  return pick(record).done(action, record);
}

export function assigned(record: TodoRecord): string {
  return pick(record).assigned(record);
}

export function released(record: TodoRecord): string {
  return pick(record).released(record);
}

export function deleted(record: TodoRecord): string {
  return pick(record).deleted(record);
}

export function reopened(record: TodoRecord): string {
  return pick(record).reopened(record);
}
