import * as fs from "node:fs";

/**
 * Development logging utility for pi-agent-manager.
 * To enable, uncomment the import in src/index.ts.
 */
export function log(message: string) {
  const timestamp = new Date().toISOString();
  fs.appendFileSync("/tmp/pi-subagent-debug.log", `[${timestamp}] ${message}\n`);
}
