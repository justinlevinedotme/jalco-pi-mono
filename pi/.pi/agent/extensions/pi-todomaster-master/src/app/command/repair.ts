import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import YAML from "yaml";
import type { ExtensionCommandContext } from "@mariozechner/pi-coding-agent";
import { splitFrontMatter } from "../../core/parser.js";

interface Broken {
  path: string;
  front: string;
  body: string;
  error: string;
}

interface RepairItem {
  path: string;
  frontmatter: string;
}

interface RepairResponse {
  fixes: RepairItem[];
}

interface RepairResult {
  scanned: number;
  broken: number;
  repaired: number;
  failed: number;
}

interface MessageEnd {
  type?: string;
  message?: {
    role?: string;
    content?: Array<{ type?: string; text?: string }>;
  };
}

const SYSTEM =
  "You repair YAML frontmatter with surgical edits. " +
  "You MUST return JSON only. " +
  "You MUST NOT change markdown body text. " +
  "You MUST keep existing keys and values unless quoting is required for YAML validity. " +
  "You MUST prefer minimal quoting changes. " +
  "You MUST only fix frontmatter blocks for the listed files. " +
  "Problematic unquoted symbols include: : # [ ] { } , & * ? | > ! @ ` and leading - or trailing # comments. " +
  'Return: {"fixes":[{"path":"<absolute path>","frontmatter":"<fixed yaml block without --- markers>"}]}.';

function extractJson(text: string): RepairResponse | null {
  const block = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = block ? block[1].trim() : text.trim();
  try {
    const parsed = JSON.parse(raw) as RepairResponse;
    if (!parsed || !Array.isArray(parsed.fixes)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function parseFrontmatterStrict(front: string): { ok: true } | { ok: false; error: string } {
  const trimmed = front.trim();
  if (!trimmed) return { ok: true };
  try {
    if (trimmed.startsWith("{")) {
      JSON.parse(trimmed);
      return { ok: true };
    }
    YAML.parse(trimmed);
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "invalid frontmatter";
    return { ok: false, error: message };
  }
}

function assistantText(line: string): string {
  try {
    const event = JSON.parse(line) as MessageEnd;
    if (event.type !== "message_end") return "";
    if (!event.message || event.message.role !== "assistant") return "";
    if (!event.message.content || !Array.isArray(event.message.content)) return "";
    const rows = event.message.content
      .filter((item) => item.type === "text" && typeof item.text === "string")
      .map((item) => item.text ?? "");
    return rows.join("");
  } catch {
    return "";
  }
}

async function runNoSessionPrompt(cwd: string, prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const args = ["--mode", "json", "--no-session", "-p", prompt];
    const proc = spawn("pi", args, {
      cwd,
      detached: false,
      stdio: ["ignore", "pipe", "pipe"],
      env: process.env,
    });
    let buf = "";
    let out = "";
    let err = "";
    const timer = setTimeout(() => {
      proc.kill("SIGTERM");
      reject(new Error("No-session repair process MUST complete within 90 seconds."));
    }, 90000);
    proc.stdout.on("data", (data) => {
      buf += data.toString();
      const lines = buf.split("\n");
      buf = lines.pop() || "";
      for (let index = 0; index < lines.length; index += 1) {
        const line = lines[index];
        const text = assistantText(line);
        if (text) out = text;
      }
    });
    proc.stderr.on("data", (data) => {
      err += data.toString();
    });
    proc.on("error", (error) => {
      clearTimeout(timer);
      reject(new Error(`No-session repair process MUST start: ${error.message}`));
    });
    proc.on("close", (code) => {
      clearTimeout(timer);
      if (code !== 0) {
        reject(
          new Error(
            `No-session repair process MUST exit 0. Received ${String(code)}. ${err.trim()}`,
          ),
        );
        return;
      }
      if (!out.trim()) {
        reject(new Error("No-session repair process MUST return assistant text output."));
        return;
      }
      resolve(out);
    });
  });
}

async function collectPlanFiles(root: string): Promise<string[]> {
  const bases = ["prds", "specs", "todos"];
  const files: string[] = [];
  for (let index = 0; index < bases.length; index += 1) {
    const group = bases[index];
    const dir = path.join(root, ".pi", "plans", group);
    let names: string[] = [];
    try {
      names = await fs.readdir(dir);
    } catch {
      continue;
    }
    for (let nameIndex = 0; nameIndex < names.length; nameIndex += 1) {
      const name = names[nameIndex];
      if (!name.endsWith(".md")) continue;
      files.push(path.join(dir, name));
    }
  }
  return files;
}

async function findBroken(root: string): Promise<{ scanned: number; broken: Broken[] }> {
  const files = await collectPlanFiles(root);
  const broken: Broken[] = [];
  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];
    let raw = "";
    try {
      raw = await fs.readFile(file, "utf8");
    } catch {
      continue;
    }
    const parts = splitFrontMatter(raw);
    if (!parts.frontMatter.trim()) continue;
    const parsed = parseFrontmatterStrict(parts.frontMatter);
    if (parsed.ok) continue;
    broken.push({ path: file, front: parts.frontMatter, body: parts.body, error: parsed.error });
  }
  return { scanned: files.length, broken };
}

function buildUserPrompt(items: Broken[]): string {
  const rows = items
    .map((item) => {
      return (
        `PATH: ${item.path}\n` +
        `ERROR: ${item.error}\n` +
        "CURRENT_FRONTMATTER:\n" +
        "```yaml\n" +
        `${item.front}\n` +
        "```\n"
      );
    })
    .join("\n");
  return (
    `${SYSTEM}\n\n` +
    "Fix YAML frontmatter in these files. Make surgical changes only. " +
    "Do not rewrite body or restructure unrelated fields. " +
    "Wrap unsafe scalar values in quotes when needed for YAML validity.\n\n" +
    rows
  );
}

async function requestFixes(
  items: Broken[],
  ctx: ExtensionCommandContext,
): Promise<RepairResponse | { error: string }> {
  try {
    const text = await runNoSessionPrompt(ctx.cwd, buildUserPrompt(items));
    const parsed = extractJson(text);
    if (!parsed) return { error: "No-session repair model output MUST be valid JSON fixes." };
    return parsed;
  } catch (error) {
    const message = error instanceof Error ? error.message : "repair request failed";
    return { error: message };
  }
}

async function applyFixes(
  items: Broken[],
  fixes: RepairResponse,
): Promise<{ repaired: number; failed: number }> {
  const map = new Map<string, Broken>();
  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    map.set(item.path, item);
  }
  let repaired = 0;
  let failed = 0;
  for (let index = 0; index < fixes.fixes.length; index += 1) {
    const fix = fixes.fixes[index];
    const item = map.get(fix.path);
    if (!item) {
      failed += 1;
      continue;
    }
    const parsed = parseFrontmatterStrict(fix.frontmatter);
    if (!parsed.ok) {
      failed += 1;
      continue;
    }
    const next = `---\n${fix.frontmatter.trimEnd()}\n---\n${item.body}`;
    await fs.writeFile(item.path, next, "utf8");
    repaired += 1;
    map.delete(fix.path);
  }
  failed += map.size;
  return { repaired, failed };
}

export async function runRepairFrontmatter(
  ctx: ExtensionCommandContext,
): Promise<RepairResult | { error: string }> {
  const scanned = await findBroken(ctx.cwd);
  if (!scanned.broken.length) {
    return { scanned: scanned.scanned, broken: 0, repaired: 0, failed: 0 };
  }
  const result = await requestFixes(scanned.broken, ctx);
  if ("error" in result) return { error: result.error };
  const applied = await applyFixes(scanned.broken, result);
  return {
    scanned: scanned.scanned,
    broken: scanned.broken.length,
    repaired: applied.repaired,
    failed: applied.failed,
  };
}
