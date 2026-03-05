#!/usr/bin/env bun
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import YAML from "yaml";
import { resolveRoot } from "./root.js";
import { validateItem } from "./validate.js";
type Type = "prd" | "spec" | "todo";

interface Entry {
  id: string;
  type: Type;
  title: string;
  tags: string[];
  status: string;
  created_at: string;
  modified_at: string;
  assigned_to_session: null;
  agent_rules: string;
  worktree: { enabled: boolean; branch: string };
  ralph_loop_mode: "off" | "ralph-loop" | "ralph-loop-linked";
  links: { root_abs: string; prds: string[]; specs: string[]; todos: string[] };
  checklist: Array<{ id: string; title: string; done: boolean }>;
}

function checklist(items: string[]): Array<{ id: string; title: string; done: boolean }> {
  if (!items.length) return [];
  const list: Array<{ id: string; title: string; done: boolean }> = [];
  for (let index = 0; index < items.length; index += 1) {
    const title = items[index]?.trim();
    if (!title) fail("Checklist items MUST NOT be empty.");
    list.push({ id: `${index + 1}`, title, done: false });
  }
  return list;
}

function fail(message: string): never {
  throw new Error(message);
}

function now(): string {
  return new Date().toISOString();
}

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

function type(value: string | undefined): Type {
  if (value === "prd" || value === "spec" || value === "todo") return value;
  fail("Invalid type. Expected one of: prd, spec, todo.");
}

function map(type: Type): string {
  if (type === "prd") return "prds";
  if (type === "spec") return "specs";
  return "todos";
}

function branch(type: Type, title: string, id: string): string {
  const value = slug(title) || id;
  if (type === "prd") return `feat/prd-${value}`;
  return `feat/todo-${value}`;
}

function id(): string {
  return crypto.randomBytes(4).toString("hex");
}

function field(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  if (index === -1) return undefined;
  return args[index + 1];
}

function pick(args: string[], names: string[]): string | undefined {
  for (let index = 0; index < names.length; index += 1) {
    const value = field(args, names[index]);
    if (value !== undefined) return value;
  }
  return undefined;
}

function picks(args: string[], names: string[]): string[] {
  const values: string[] = [];
  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];
    if (!names.includes(value)) continue;
    const item = args[index + 1];
    if (item === undefined || item.startsWith("-")) {
      fail(`Missing value for ${value}.`);
    }
    values.push(item);
  }
  return values;
}

function dir(): string {
  return resolveRoot();
}

function links(root: string): {
  root_abs: string;
  prds: string[];
  specs: string[];
  todos: string[];
} {
  return { root_abs: root, prds: [], specs: [], todos: [] };
}

function has(args: string[], names: string[]): boolean {
  for (let index = 0; index < names.length; index += 1) {
    if (args.includes(names[index])) return true;
  }
  return false;
}

function enforce(type: Type, args: string[]): void {
  const extra = has(args, [
    "--agent_rules",
    "-agent_rules",
    "--worktree",
    "-worktree",
    "--template",
    "-template",
    "--ralph_loop",
    "-ralph_loop",
    "--ralph_loop_mode",
    "-ralph_loop_mode",
    "--links",
    "-links",
    "--request",
    "-request",
    "--root",
    "-root",
  ]);
  if (extra)
    fail(
      "Do not pass managed flags (agent_rules/worktree/ralph_loop/ralph_loop_mode/template/links/request/root). Use minimal create inputs only.",
    );
  const checklist = has(args, ["--checklist", "-checklist"]);
  if (checklist) fail("--checklist is unsupported. Use repeated --item flags.");
  const item = has(args, ["--item", "-item"]);
  if (type !== "todo" && item) fail("--item is only supported for type=todo.");
}

function schema(type: Type): string {
  const lines = [
    `Create input schema for ${type}:`,
    "---",
    "command: create",
    `type: ${type}`,
    "title: <string>",
    "tags: <csv> # REQUIRED",
    "body: <markdown> # REQUIRED",
  ];
  if (type === "todo") lines.push("item: <string> # REQUIRED, repeatable (--item <value>)");
  lines.push("---");
  return lines.join("\n");
}

async function create(args: string[]): Promise<void> {
  const value = type(pick(args, ["--type", "-type"]));
  enforce(value, args);
  const title = pick(args, ["--title", "-title"])?.trim();
  if (!title) fail("Missing --title for create command.");
  const body = pick(args, ["--body", "-body"])?.trim();
  if (!body) fail("Missing --body for create command.");
  const tags = (pick(args, ["--tags", "-tags"]) || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  if (!tags.length) fail("Missing --tags for create command.");
  const list = checklist(picks(args, ["--item", "-item"]));
  if (value === "todo" && !list.length) {
    fail(
      "Missing --item for create command when type=todo. Repeat --item for each checklist entry.",
    );
  }
  const root = dir();
  const valueId = id();
  const ts = now();
  const valueLinks = links(root);
  const entry: Entry = {
    id: valueId,
    type: value,
    title,
    tags,
    status: "open",
    created_at: ts,
    modified_at: ts,
    assigned_to_session: null,
    agent_rules:
      "MUST update checklist done booleans during execution, not after completion. MUST edit only fields and sections explicitly allowed by the active instruction.",
    worktree: { enabled: true, branch: branch(value, title, valueId) },
    ralph_loop_mode: "off",
    links: valueLinks,
    checklist: value === "todo" ? list : [],
  };
  const outdir = path.join(root, ".pi", "plans", map(value));
  await fs.mkdir(outdir, { recursive: true });
  const file = path.join(outdir, `${valueId}.md`);
  const front = YAML.stringify(entry).trimEnd();
  const text = `---\n${front}\n---\n\n${body}`;
  await fs.writeFile(file, `${text.trimEnd()}\n`, "utf8");
  process.stdout.write(`Created: ${file}\n`);
  if (value === "prd")
    process.stdout.write("Next: You MUST ask the user whether they want to refine this PRD now.\n");
  if (value === "spec")
    process.stdout.write(
      "Next: You MUST ask the user whether they want to refine this spec now.\n",
    );
  if (value === "todo")
    process.stdout.write(
      "Next: You MUST ask the user whether they want to refine this todo now.\n",
    );
  process.stdout.write(
    "Next: You MUST keep frontmatter stable unless the user explicitly requests frontmatter changes.\n",
  );
  if (value === "prd")
    process.stdout.write(
      "Next: You SHOULD suggest creating either a spec or a todo from this PRD.\n",
    );
  if (value === "spec")
    process.stdout.write("Next: You SHOULD suggest creating a todo from this spec.\n");
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (!args.length)
    fail("Missing command. Use '-schema <type>' or 'create --type <type> --title <title>'.");
  if (args[0] === "--help" || args[0] === "-h") {
    process.stdout.write(
      "This CLI does not provide interactive help. You MUST run '-schema <type>' (prd|spec|todo) and then call 'create' with required flags.\n",
    );
    return;
  }
  if (args[0] === "--validate" || args[0] === "-validate") {
    const filePath = pick(args, ["--filepath", "-filepath"]);
    if (!filePath) fail("Missing --filepath for validate command.");
    const result = await validateItem(dir(), filePath);
    process.stdout.write(`${JSON.stringify(result)}\n`);
    return;
  }
  if (args[0] === "-schema") {
    const value = type(args[1]);
    process.stdout.write(`${schema(value)}\n`);
    return;
  }
  if (args[0] === "create" || args[0] === "-create") {
    await create(args);
    return;
  }
  fail("Unsupported command. Use '--validate', '-schema', or 'create'.");
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : "Unknown CLI failure";
  process.stderr.write(`${message}\n`);
  process.exit(1);
});
