export function buildCreateBase(
  type: "PRD" | "Spec" | "Todo",
  rules: string,
  userPrompt: string,
  cli: string,
  cwd: string,
): string {
  const run = `PI_TODOS_CWD="${cwd}" ${cli}`;
  const item =
    type === "Todo"
      ? "For todo creation, checklist entries MUST be passed as repeated --item flags; JSON checklist input MUST NOT be used.\n"
      : "";
  return (
    "Procedure requirements:\n" +
    `1. You MUST use this command prefix for plan creation: ${run}\n` +
    `2. You MUST start by running: ${run} -schema ${type.toLowerCase()}\n` +
    "3. You MUST read schema output and satisfy every REQUIRED field.\n" +
    "4. You MUST NOT call --help or -h; this CLI does not provide help output for creation workflows.\n" +
    "5. You MUST use only the specified arguments and then execute create with the same command prefix.\n" +
    "6. After create, you MUST edit markdown body sections only unless the user explicitly requests frontmatter updates.\n" +
    item +
    "7. You MUST preserve existing frontmatter arrays by merging entries when link updates are required.\n" +
    "8. You MUST assume this may run in a fresh session with no prior context.\n" +
    "9. You MUST use document type terminology (PRD, spec, todo). You MAY encounter legacy 'type' field names MUST be used consistently.\n" +
    "10. You MAY ask clarifying questions when requirements are ambiguous.\n\n" +
    `${rules}\n\n` +
    `User request: ${userPrompt}`
  );
}
