import path from "node:path";
import type { ExtensionContext } from "@mariozechner/pi-coding-agent";
import type { TodoFrontMatter, TodoLinks, TodoRecord } from "../../core/types.js";
import { ensureTodoExists, writeTodoFile } from "../files/files.js";
import { getTodoPath } from "../files/path.js";

function bucket(type: string | undefined): "prds" | "specs" | "todos" {
  if (type === "prd") return "prds";
  if (type === "spec") return "specs";
  return "todos";
}

function rel(root: string, file: string): string {
  return path.relative(root, file).replaceAll("\\", "/");
}

function merge(list: string[] | undefined, value: string): string[] {
  const set = new Set<string>(list ?? []);
  set.add(value);
  return [...set];
}

function ensureLinks(record: TodoRecord, root: string): TodoLinks {
  const links = record.links ?? {};
  if (!links.root_abs) links.root_abs = root;
  return links;
}

export async function attachLinks(
  todosDir: string,
  source: TodoFrontMatter,
  targets: TodoFrontMatter[],
  ctx: ExtensionContext,
): Promise<{ updated: number } | { error: string }> {
  if (!targets.length) return { error: "Select at least one item to attach." };
  const root = ctx.cwd;
  const sourcePath = getTodoPath(todosDir, source.id, source.type);
  const sourceRecord = await ensureTodoExists(sourcePath, source.id);
  if (!sourceRecord) return { error: "Source item not found." };
  const items: Array<{ record: TodoRecord; file: string }> = [
    { record: sourceRecord, file: sourcePath },
  ];
  for (const target of targets) {
    if (target.id === source.id) return { error: "Cannot attach an item to itself." };
    const targetPath = getTodoPath(todosDir, target.id, target.type);
    const targetRecord = await ensureTodoExists(targetPath, target.id);
    if (!targetRecord) return { error: `Target item not found: ${target.id}` };
    items.push({ record: targetRecord, file: targetPath });
  }
  const sourceRef = rel(root, sourcePath);
  const sourceLinks = ensureLinks(sourceRecord, root);
  for (let index = 1; index < items.length; index += 1) {
    const target = items[index];
    const targetRef = rel(root, target.file);
    const targetLinks = ensureLinks(target.record, root);
    const targetBucket = bucket(target.record.type);
    const sourceBucket = bucket(sourceRecord.type);
    sourceLinks[targetBucket] = merge(sourceLinks[targetBucket], targetRef);
    targetLinks[sourceBucket] = merge(targetLinks[sourceBucket], sourceRef);
    sourceRecord.links = sourceLinks;
    target.record.links = targetLinks;
  }
  for (const item of items) {
    await writeTodoFile(item.file, item.record);
  }
  return { updated: items.length };
}
