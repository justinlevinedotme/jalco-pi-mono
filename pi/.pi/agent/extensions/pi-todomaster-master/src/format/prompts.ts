import type { ChecklistItem } from "../core/types.js";
import path from "node:path";

interface Links {
  root_abs?: string;
  prds?: string[];
  specs?: string[];
  todos?: string[];
  reads?: string[];
}

function normalizePaths(paths: string[]): string[] {
  const seen = new Set<string>();
  const list: string[] = [];
  for (const item of paths) {
    const value = item.trim();
    if (!value) continue;
    if (seen.has(value)) continue;
    seen.add(value);
    list.push(value);
  }
  return list;
}

function legacy(value: string): boolean {
  return /^[a-f0-9]{8}$/i.test(value);
}

function resolve(base: string, value: string, type?: "prds" | "specs" | "todos"): string {
  if (path.isAbsolute(value)) return value;
  if (value.includes("/")) return base ? path.resolve(base, value) : value;
  if (!type || !legacy(value)) return base ? path.resolve(base, value) : value;
  const file = path.join(".pi", "plans", type, `${value}.md`);
  return base ? path.resolve(base, file) : file;
}

export function resolveLinkedPaths(links?: Links): string[] {
  const base = links?.root_abs ?? "";
  const values = [
    ...(links?.prds ?? []).map((item) => resolve(base, item, "prds")),
    ...(links?.specs ?? []).map((item) => resolve(base, item, "specs")),
    ...(links?.todos ?? []).map((item) => resolve(base, item, "todos")),
    ...(links?.reads ?? []).map((item) => resolve(base, item)),
  ];
  return normalizePaths(values);
}

function readBlock(filePath: string, links?: Links): string {
  const resolved = resolveLinkedPaths(links);
  const lines = [`- ${filePath}`, ...resolved.map((item) => `- ${item}`)];
  return `You MUST read these files before making changes:\n${normalizePaths(
    lines.map((item) => item.slice(2)),
  )
    .map((item) => `- ${item}`)
    .join("\n")}`;
}

export function buildTodoRefinePrompt(title: string, filePath: string, links?: Links): string {
  return (
    `Refine todo at path "${filePath}" (title: "${title}").\n\n` +
    `${readBlock(filePath, links)}\n\n` +
    "You MUST ask targeted clarifying questions when requirements are ambiguous.\n" +
    "You MUST identify concrete execution steps that are required to complete this task.\n" +
    "You MUST update the todo file directly after clarification.\n" +
    "You MUST write a checklist with actionable steps; generic placeholders MUST NOT be used.\n" +
    "Each checklist item MUST describe one observable action with a verifiable outcome.\n"
  );
}

export function buildPrdRefinePrompt(title: string, filePath: string, links?: Links): string {
  return (
    `Refine PRD at path "${filePath}" (title: "${title}").\n\n` +
    `${readBlock(filePath, links)}\n\n` +
    "You MUST ask targeted clarifying questions when requirements are ambiguous.\n" +
    "You MUST improve product framing: objective, non-goals, users, constraints, and acceptance criteria.\n" +
    "Acceptance criteria MUST be explicit, testable, and user-observable.\n" +
    "You MUST update the PRD file directly after clarification.\n"
  );
}

export function buildSpecRefinePrompt(title: string, filePath: string, links?: Links): string {
  return (
    `Refine spec at path "${filePath}" (title: "${title}").\n\n` +
    `${readBlock(filePath, links)}\n\n` +
    "You MUST ask targeted clarifying questions when requirements are ambiguous.\n" +
    "You MUST improve technical precision: architecture decisions, interfaces, edge cases, and validation strategy.\n" +
    "Verification criteria MUST be deterministic and implementation-ready.\n" +
    "You MUST update the spec file directly after clarification.\n"
  );
}

export function buildTodoWorkPrompt(title: string, filePath: string, links?: Links): string {
  return (
    `Work on todo at path "${filePath}" (title: "${title}").\n\n` +
    `${readBlock(filePath, links)}\n\n` +
    "You MUST execute checklist steps in order unless dependencies require reordering.\n" +
    "As work progresses, you MUST update checklist done booleans during execution; you MUST NOT batch checklist updates after completion.\n" +
    "As work progresses, you MUST edit ONLY frontmatter fields in this todo file (checklist/status/links/assignment fields as needed).\n" +
    "You MUST NOT modify frontmatter fields outside checklist/status/links/assignment.\n" +
    "You MUST NOT modify the agent_rules field.\n" +
    "You MUST NOT write progress notes into the markdown body during work execution.\n" +
    "Goal: complete this todo document to 100%. You MUST NOT stop after partial progress, and you MUST continue until all required steps are done.\n" +
    "You MUST ensure linked PRD/spec/todo markdown files remain a complete bidirectional link web.\n"
  );
}

export function buildPrdWorkPrompt(title: string, filePath: string, links?: Links): string {
  return (
    `Work on PRD at path "${filePath}" (title: "${title}").\n\n` +
    `${readBlock(filePath, links)}\n\n` +
    "You MUST focus on product definition quality and requirement clarity.\n" +
    "As work progresses, you MUST update checklist done booleans during execution; you MUST NOT batch checklist updates after completion.\n" +
    "As work progresses, you MUST edit ONLY frontmatter fields in this PRD file (checklist/status/links/assignment fields as needed).\n" +
    "You MUST NOT modify frontmatter fields outside checklist/status/links/assignment.\n" +
    "You MUST NOT modify the agent_rules field.\n" +
    "You MUST NOT write progress notes into the markdown body during work execution.\n" +
    "Goal: complete this PRD document to 100%. You MUST NOT stop after partial progress, and you MUST continue until all required steps are done.\n" +
    "You MUST preserve intent consistency across linked specs and todos.\n"
  );
}

export function buildSpecWorkPrompt(title: string, filePath: string, links?: Links): string {
  return (
    `Work on spec at path "${filePath}" (title: "${title}").\n\n` +
    `${readBlock(filePath, links)}\n\n` +
    "You MUST focus on deterministic technical behavior and implementation constraints.\n" +
    "As work progresses, you MUST update checklist done booleans during execution; you MUST NOT batch checklist updates after completion.\n" +
    "As work progresses, you MUST edit ONLY frontmatter fields in this spec file (checklist/status/links/assignment fields as needed).\n" +
    "You MUST NOT modify frontmatter fields outside checklist/status/links/assignment.\n" +
    "You MUST NOT modify the agent_rules field.\n" +
    "You MUST NOT write progress notes into the markdown body during work execution.\n" +
    "Goal: complete this spec document to 100%. You MUST NOT stop after partial progress, and you MUST continue until all required steps are done.\n" +
    "You MUST preserve consistency with linked PRDs and implementation todos.\n"
  );
}

export function buildTodoReviewPrompt(title: string, filePath: string, links?: Links): string {
  return (
    `${buildTodoWorkPrompt(title, filePath, links)}\n` +
    "Then review implementation completeness, unresolved gaps, and missing link relationships."
  );
}

export function buildPrdReviewPrompt(title: string, filePath: string, links?: Links): string {
  return `${buildPrdWorkPrompt(title, filePath, links)}\nThen review product requirement completeness and unresolved gaps.`;
}

export function buildSpecReviewPrompt(title: string, filePath: string, links?: Links): string {
  return `${buildSpecWorkPrompt(title, filePath, links)}\nThen review technical completeness, edge-case coverage, and unresolved gaps.`;
}

export function buildEditChecklistPrompt(
  title: string,
  filePath: string,
  checklist: ChecklistItem[],
  userIntent: string,
): string {
  const checklistText = checklist
    .map((item) => {
      const status = item.done === true || item.status === "checked" ? "[x]" : "[ ]";
      return `  ${status} ${item.id}: ${item.title}`;
    })
    .join("\n");
  return (
    `Update the checklist in file "${filePath}" (title: "${title}") based on this request:\n` +
    `"${userIntent}"\n\n` +
    `${readBlock(filePath)}\n\n` +
    `Current checklist:\n${checklistText}\n\n` +
    "You MUST keep existing frontmatter fields stable.\n" +
    "You MUST edit only checklist entries and checklist-related status updates.\n" +
    "You MUST NOT modify the agent_rules field.\n" +
    "You MUST review all linked files before editing the checklist.\n" +
    "If links show the todo is mis-scoped and needs a full rework, you MUST report that first and wait for confirmation before editing.\n" +
    "You MUST write checklist items as concrete actions required to complete the task.\n" +
    "Generic checklist items MUST NOT be used.\n"
  );
}

export function buildValidateAuditPrompt(currentPath: string, scope: string[]): string {
  const lines = scope.map((item) => `- ${item}`).join("\n");
  return (
    `Perform an audit on the following item:\n${currentPath}\n\n` +
    "Requirements:\n" +
    "1. You MUST treat this as an audit-only task. You MUST NOT edit any files.\n" +
    "2. You MUST read every listed file before producing findings.\n" +
    "3. You MUST verify frontmatter link integrity across PRD/spec/todo items: bidirectional links, type-correct buckets, root_abs presence when repo-relative links exist, missing or broken linked files, duplicate or stale links.\n" +
    "4. You MUST verify cross-document consistency: requirement coverage across PRD -> spec -> todo, contradictory statements, missing implementation tasks for required spec behavior, orphaned or obsolete items.\n" +
    "5. You MUST separate deterministic facts from judgment calls.\n" +
    "6. You MUST output a short Executive Summary first.\n" +
    "7. You MUST output one findings table with these exact columns: type | name | issue (3-5 words).\n" +
    "8. You MUST include only issues in the table.\n" +
    "9. After the table, you MUST output a markdown bullet list named 'Proposed Changes' with concrete recommended changes/questions.\n" +
    "10. You MAY ask clarifying questions only if a blocking ambiguity prevents assessment.\n\n" +
    `Audit scope (absolute paths):\n${lines}`
  );
}
