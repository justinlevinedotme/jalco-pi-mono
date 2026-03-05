import { execFileSync } from "node:child_process";
import path from "node:path";

interface Rec {
  target: string;
  type: "prd" | "spec" | "todo";
  name: string;
  reason: string;
}

interface Issue {
  type: "prd" | "spec" | "todo";
  name: string;
  issue: string;
  file: string;
}

interface Result {
  issues: Issue[];
  recommendations: Rec[];
}

export function runValidateCli(cli: string, cwd: string, filePath: string): Result {
  const target = path.resolve(filePath);
  const out = execFileSync("bun", [cli, "--validate", "--filepath", target], {
    cwd,
    env: { ...process.env, PI_TODOS_CWD: cwd },
    encoding: "utf8",
  });
  const parsed = JSON.parse(out) as Result;
  if (!Array.isArray(parsed.issues) || !Array.isArray(parsed.recommendations)) {
    throw new Error("Invalid validate CLI output.");
  }
  return parsed;
}
