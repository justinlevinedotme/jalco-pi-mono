import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { runPicker } from "@howaboua/pi-howaboua-extensions-primitives-sdk";
import type { ExtensionCommandContext } from "@mariozechner/pi-coding-agent";
import type { TodoFrontMatter } from "./types.js";

interface Repo {
  path: string;
}

interface SwitchValue {
  repo: string;
  branch: string;
  worktree: string;
}

function buildSwitchValue(value: SwitchValue): string {
  return `switch:${JSON.stringify(value)}`;
}

function parseSwitchValue(value: string): SwitchValue | null {
  if (!value.startsWith("switch:")) return null;
  const raw = value.slice(7);
  try {
    const parsed = JSON.parse(raw) as SwitchValue;
    if (!parsed.repo || !parsed.branch || !parsed.worktree) return null;
    return parsed;
  } catch {
    return null;
  }
}

function run(command: string, args: string[], cwd: string): string {
  return execFileSync(command, args, { cwd, encoding: "utf8" }).trim();
}

function exists(file: string): boolean {
  try {
    fs.accessSync(file);
    return true;
  } catch {
    return false;
  }
}

function findRepos(root: string): Repo[] {
  const repos: Repo[] = [];
  const stack = [root];
  while (stack.length) {
    const current = stack.pop();
    if (!current) continue;
    const git = path.join(current, ".git");
    if (exists(git)) {
      repos.push({ path: current });
      continue;
    }
    let entries: fs.Dirent[] = [];
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (entry.name === "node_modules") continue;
      if (entry.name === ".git") continue;
      stack.push(path.join(current, entry.name));
    }
  }
  return repos;
}

function findEnclosingRepo(root: string): Repo | null {
  let current = path.resolve(root);
  while (true) {
    const git = path.join(current, ".git");
    if (exists(git)) return { path: current };
    const next = path.dirname(current);
    if (next === current) return null;
    current = next;
  }
}

function parseWorktrees(raw: string): { path: string; branch?: string }[] {
  const lines = raw.split("\n");
  const items: { path: string; branch?: string }[] = [];
  let current: { path: string; branch?: string } | null = null;
  for (const line of lines) {
    if (line.startsWith("worktree ")) {
      if (current) items.push(current);
      current = { path: line.slice(9).trim() };
      continue;
    }
    if (!current) continue;
    if (line.startsWith("branch refs/heads/")) current.branch = line.slice(18).trim();
  }
  if (current) items.push(current);
  return items;
}

function normalizeBranch(record: TodoFrontMatter): string {
  const type = record.type === "prd" ? "prd" : "todo";
  const slug = (record.title || "task")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
  return `feat/${type}-${slug || record.id}`;
}

function initRepo(repo: string): void {
  run("git", ["init"], repo);
  run("git", ["add", "-A"], repo);
  run("git", ["commit", "--allow-empty", "-m", "chore(repo): initial commit"], repo);
}

export async function ensureWorktree(record: TodoFrontMatter, ctx: ExtensionCommandContext) {
  const root = record.links?.root_abs ?? ctx.cwd;
  const rootRepo = findEnclosingRepo(root);
  const repos = rootRepo ? [rootRepo] : findRepos(root);
  const targetBranch = record.worktree?.branch || normalizeBranch(record);

  if (!ctx.hasUI) {
    if (!repos.length) return { ok: true as const, skipped: true };
    return ensureRepoWorktree(record, repos[0].path);
  }

  const items = [
    { value: "none", label: "Work in current branch", description: "no git actions" },
    {
      value: "new",
      label: `Create/Switch to: ${targetBranch}`,
      description: "dedicated worktree",
    },
  ];

  for (const repo of repos) {
    try {
      const list = parseWorktrees(run("git", ["worktree", "list", "--porcelain"], repo.path));
      for (const w of list) {
        if (!w.branch) continue;
        if (w.branch === targetBranch) continue;
        items.push({
          value: buildSwitchValue({ repo: repo.path, branch: w.branch, worktree: w.path }),
          label: `Switch to: ${w.branch}`,
          description: `in ${path.basename(repo.path)}`,
        });
      }
    } catch {}
  }

  const pickerCtx = {
    hasUI: ctx.hasUI,
    ui: {
      custom: ctx.ui.custom as unknown as <T>(
        factory: (
          tui: { requestRender: () => void },
          theme: { fg: (color: string, text: string) => string },
          keys: unknown,
          done: (result: T) => void,
        ) => {
          render: (width: number) => string[];
          invalidate: () => void;
          handleInput: (data: string) => void;
        },
      ) => Promise<T>,
    },
  };

  const selection = await runPicker(pickerCtx, {
    title: "Worktree Orchestration",
    items: items.map((item) => ({
      label: `${item.label}${item.description ? ` (${item.description})` : ""}`,
      value: item.value,
      searchableText: `${item.label} ${item.description || ""}`,
    })),
    search: true,
    page: 7,
    shortcuts: "/ search • j/k move • enter confirm • esc back",
  });

  if (!selection || selection === "none") return { ok: true as const, skipped: true };

  if (selection === "new") {
    if (!repos.length) {
      const init = await ctx.ui.confirm(
        "Initialize repository",
        "No repository found. Initialize git repository here?",
      );
      if (init) {
        initRepo(root);
        return ensureRepoWorktree(record, root);
      }
      return { ok: true as const, skipped: true };
    }
    const repo = repos.length === 1 ? repos[0] : await pickRepo(repos, ctx);
    if ("error" in repo) return { ok: true as const, skipped: true };
    return ensureRepoWorktree(record, repo.path);
  }

  if (selection.startsWith("switch:")) {
    const value = parseSwitchValue(selection);
    if (!value) throw new Error("Invalid worktree switch selection value");
    return { ok: true as const, path: value.worktree, branch: value.branch, created: false };
  }

  return { ok: true as const, skipped: true };
}

async function pickRepo(
  repos: Repo[],
  ctx: ExtensionCommandContext,
): Promise<Repo | { error: string }> {
  if (repos.length === 1) return repos[0];
  for (const repo of repos) {
    const ok = await ctx.ui.confirm("Select repository", `Use repository: ${repo.path}`);
    if (ok) return repo;
  }
  return { error: "No repo selected" };
}

function ensureRepoWorktree(record: TodoFrontMatter, repo: string) {
  const branch = record.worktree?.branch || normalizeBranch(record);
  const repoPath = path.resolve(repo);
  const list = parseWorktrees(run("git", ["worktree", "list", "--porcelain"], repoPath));

  const current = list.find((w) => w.path === process.cwd() || w.path === repoPath);
  if (current?.branch === branch) {
    return { ok: true as const, path: current.path, branch, created: false };
  }

  const existing = list.find((item) => item.branch === branch);
  if (existing) return { ok: true as const, path: existing.path, branch, created: false };

  const dir = path.join(repoPath, ".pi", "worktrees", branch.replace(/\//g, "-"));
  fs.mkdirSync(path.dirname(dir), { recursive: true });
  const known = run("git", ["branch", "--list", branch], repoPath);
  if (known) run("git", ["worktree", "add", dir, branch], repoPath);
  if (!known) run("git", ["worktree", "add", "-b", branch, dir], repoPath);
  return { ok: true as const, path: dir, branch, created: true };
}
