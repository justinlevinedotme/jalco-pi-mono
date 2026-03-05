import type { TodoFrontMatter, TodoRecord } from "../../core/types.js";
import {
  buildTodoRefinePrompt,
  buildTodoReviewPrompt,
  buildTodoWorkPrompt,
} from "../../format/prompts.js";

export function refine(title: string, filePath: string, links?: TodoFrontMatter["links"]): string {
  return buildTodoRefinePrompt(title, filePath, links);
}

export function work(title: string, filePath: string, links?: TodoFrontMatter["links"]): string {
  return buildTodoWorkPrompt(title, filePath, links);
}

export function review(title: string, filePath: string, links?: TodoFrontMatter["links"]): string {
  return buildTodoReviewPrompt(title, filePath, links);
}

export function done(action: "complete" | "abandon", record: TodoRecord): string {
  const verb = action === "complete" ? "Completed" : "Abandoned";
  return `${verb} todo "${record.title || "(untitled)"}"`;
}

export function assigned(record: TodoRecord): string {
  return `Assigned todo "${record.title || "(untitled)"}"`;
}

export function released(record: TodoRecord): string {
  return `Released todo "${record.title || "(untitled)"}"`;
}

export function deleted(record: TodoRecord): string {
  return `Deleted todo "${record.title || "(untitled)"}"`;
}

export function reopened(record: TodoRecord): string {
  return `Reopened todo "${record.title || "(untitled)"}" and reset checklist`;
}
