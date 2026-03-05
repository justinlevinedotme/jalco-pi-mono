import type { ChecklistItem, TodoRecord } from "../core/types.js";
import { getTodoTitle } from "./base.js";

export function formatTickResult(
  todo: TodoRecord,
  tickedItem: ChecklistItem | undefined,
  remaining: ChecklistItem[],
  allComplete: boolean,
): string {
  const title = getTodoTitle(todo);
  const lines: string[] = [];
  if (tickedItem) lines.push(`Ticked item ${tickedItem.id} "${tickedItem.title}".`);
  if (allComplete) {
    lines.push("");
    lines.push(`"${title}" is now done.`);
    return lines.join("\n");
  }
  if (remaining.length > 0) {
    lines.push("");
    lines.push(`Remaining in "${title}":`);
    for (const item of remaining) lines.push(`  [ ] ${item.title}`);
    lines.push("");
    lines.push("Continue working through the remaining items.");
  }
  return lines.join("\n");
}
