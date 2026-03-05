import path from "node:path";
import { fileURLToPath } from "node:url";

export function getCliPath(): string {
  const env = process.env.PI_TODOS_CLI_PATH;
  if (env && env.trim()) return env.trim();
  const file = fileURLToPath(import.meta.url);
  const dir = path.dirname(file);
  return path.resolve(dir, "../app/cli/index.ts");
}
