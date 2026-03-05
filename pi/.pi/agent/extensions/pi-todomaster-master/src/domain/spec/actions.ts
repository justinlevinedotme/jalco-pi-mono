import type { TodoFrontMatter, TodoRecord } from "../../core/types.js";
import {
  buildSpecRefinePrompt,
  buildSpecReviewPrompt,
  buildSpecWorkPrompt,
} from "../../format/prompts.js";

export function refine(title: string, filePath: string, links?: TodoFrontMatter["links"]): string {
  return buildSpecRefinePrompt(title, filePath, links);
}

export function work(title: string, filePath: string, links?: TodoFrontMatter["links"]): string {
  return buildSpecWorkPrompt(title, filePath, links);
}

export function review(title: string, filePath: string, links?: TodoFrontMatter["links"]): string {
  return buildSpecReviewPrompt(title, filePath, links);
}

export function done(action: "complete" | "abandon", record: TodoRecord): string {
  const verb = action === "complete" ? "Completed" : "Abandoned";
  return `${verb} spec "${record.title || "(untitled)"}"`;
}

export function assigned(record: TodoRecord): string {
  return `Assigned spec "${record.title || "(untitled)"}"`;
}

export function released(record: TodoRecord): string {
  return `Released spec "${record.title || "(untitled)"}"`;
}

export function deleted(record: TodoRecord): string {
  return `Deleted spec "${record.title || "(untitled)"}"`;
}

export function reopened(record: TodoRecord): string {
  return `Reopened spec "${record.title || "(untitled)"}" and reset checklist`;
}
