import path from "node:path";
import type { RalphLoopMode } from "./types.js";

interface RalphLoopPrepared {
  mode: RalphLoopMode;
  inputPaths: string[];
  command: string;
}

function commandPath(cwd: string, value: string): string {
  const rel = path.relative(cwd, value).replaceAll("\\", "/");
  if (!rel || rel.startsWith("..")) return value;
  if (rel.startsWith(".")) return rel;
  return `./${rel}`;
}

function shellQuote(value: string): string {
  return `'${value.replaceAll("'", `'"'"'`)}'`;
}

function unique(values: string[]): string[] {
  const seen = new Set<string>();
  const list: string[] = [];
  for (const value of values) {
    const key = value.replaceAll("\\", "/");
    if (seen.has(key)) continue;
    seen.add(key);
    list.push(value);
  }
  return list;
}

export function prepareRalphLoop(
  cwd: string,
  mode: RalphLoopMode,
  planPath: string,
  linkedPaths: string[],
): RalphLoopPrepared {
  const paths = unique([planPath, ...(mode === "ralph-loop-linked" ? linkedPaths : [])]);
  const targets = paths.map((item) => commandPath(cwd, item));
  const catArgs = targets.map((item) => shellQuote(item)).join(" ");
  const shell =
    "AGENT_CMD='pi -p --no-session'; " +
    `while :; do cat ${catArgs} | bash -lc \"$AGENT_CMD\"; done`;
  const command = `!!${shell}`;
  return { mode, inputPaths: paths, command };
}
