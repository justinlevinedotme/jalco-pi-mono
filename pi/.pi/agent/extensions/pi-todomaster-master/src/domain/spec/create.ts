import { buildCreateBase } from "../../ui/gui/create-prompt.js";

export function buildCreateSpecPrompt(
  userPrompt: string,
  cli: string,
  cwd: string,
  prds: string[],
): string {
  const attach = prds.length
    ? [
        "Attach this spec to these PRDs and treat them as required context:",
        ...prds.map((item) => `- ${item}`),
        "",
        "You MUST read every listed PRD file before drafting or creating the spec.",
        "",
        "You MUST update the new spec frontmatter links.prds to include every selected PRD path (repo-relative) and set links.root_abs.",
        "",
        "After creating the spec, you MUST update each listed PRD frontmatter links.specs to include the new spec path (repo-relative).",
        "",
        "You MUST preserve and merge existing links arrays; you MUST NOT overwrite existing linked entries.",
        "",
      ].join("\n")
    : "No PRD attachments were selected. This is a standalone spec.\n";
  return buildCreateBase(
    "Spec",
    `${attach}You MUST produce a spec type document that defines technical design, interfaces, constraints, edge cases, and deterministic verification criteria. You MUST keep lifecycle user-controlled. You MUST maximize cross-links between related PRD/spec/todo items so relationships form a complete web.`,
    userPrompt,
    cli,
    cwd,
  );
}
