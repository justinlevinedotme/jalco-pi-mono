import { buildCreateBase } from "../../ui/gui/create-prompt.js";

export function buildCreatePrdPrompt(userPrompt: string, cli: string, cwd: string): string {
  return buildCreateBase(
    "PRD",
    "You MUST produce a PRD type document that captures product objective, user problem, scope boundaries, non-goals, constraints, deliverables, and testable acceptance criteria.",
    userPrompt,
    cli,
    cwd,
  );
}
