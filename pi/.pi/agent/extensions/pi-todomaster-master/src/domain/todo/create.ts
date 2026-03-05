import { buildCreateBase } from "../../ui/gui/create-prompt.js";

export function buildCreateTodoPrompt(
  userPrompt: string,
  cli: string,
  cwd: string,
  prds: string[],
  specs: string[],
): string {
  const attach =
    prds.length || specs.length
      ? [
          "Attach this todo to selected parent plans and treat them as required context:",
          ...prds.map((item) => `- PRD: ${item}`),
          ...specs.map((item) => `- Spec: ${item}`),
          "",
          "You MUST read every listed parent plan file before drafting or creating the todo.",
          "",
          "You MUST update the new todo frontmatter links.prds/specs to include every selected parent path (repo-relative) and set links.root_abs.",
          "",
          "After creating the todo, you MUST update each listed parent frontmatter links.todos to include the new todo path (repo-relative).",
          "",
          "You MUST preserve and merge existing links arrays; you MUST NOT overwrite existing linked entries.",
          "",
        ].join("\n")
      : "No parent plans were selected. This is a standalone todo.\n";
  return buildCreateBase(
    "Todo",
    `${attach}You MUST produce a todo type document with a non-empty checklist using short IDs and done booleans. Checklist items MUST be concrete execution steps required to complete the task. Checklist items MUST include observable outcomes and MUST NOT use generic placeholders. You MUST NOT close lifecycle state automatically. You MUST maximize cross-links between related PRD/spec/todo items so relationships form a complete web.`,
    userPrompt,
    cli,
    cwd,
  );
}
