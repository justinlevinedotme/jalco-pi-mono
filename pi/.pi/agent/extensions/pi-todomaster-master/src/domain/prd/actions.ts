import type { TodoFrontMatter, TodoRecord } from "../../core/types.js";
import {
  buildPrdRefinePrompt,
  buildPrdReviewPrompt,
  buildPrdWorkPrompt,
} from "../../format/prompts.js";

export function refine(title: string, filePath: string, links?: TodoFrontMatter["links"]): string {
  return buildPrdRefinePrompt(title, filePath, links);
}

export function work(title: string, filePath: string, links?: TodoFrontMatter["links"]): string {
  return buildPrdWorkPrompt(title, filePath, links);
}

export function review(title: string, filePath: string, links?: TodoFrontMatter["links"]): string {
  return buildPrdReviewPrompt(title, filePath, links);
}

export function done(action: "complete" | "abandon", record: TodoRecord): string {
  const verb = action === "complete" ? "Completed" : "Abandoned";
  return `${verb} PRD "${record.title || "(untitled)"}"`;
}

export function assigned(record: TodoRecord): string {
  return `Assigned PRD "${record.title || "(untitled)"}"`;
}

export function released(record: TodoRecord): string {
  return `Released PRD "${record.title || "(untitled)"}"`;
}

export function deleted(record: TodoRecord): string {
  return `Deleted PRD "${record.title || "(untitled)"}"`;
}

export function reopened(record: TodoRecord): string {
  return `Reopened PRD "${record.title || "(untitled)"}" and reset checklist`;
}
