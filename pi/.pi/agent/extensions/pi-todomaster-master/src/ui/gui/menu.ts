import type { SelectItem } from "@mariozechner/pi-tui";
import type { TodoRecord } from "../../core/types.js";
import { prdItems } from "../../domain/prd/menu.js";
import { specItems } from "../../domain/spec/menu.js";
import { todoItems } from "../../domain/todo/menu.js";
import { todoType } from "../../core/entity.js";

export function items(todo: TodoRecord, closed: boolean, showView: boolean): SelectItem[] {
  const assigned = Boolean(todo.assigned_to_session);
  const jump = Boolean(todo.assigned_to_session_file);
  const type = todoType(todo);
  const ralphMode = todo.ralph_loop_mode || "off";
  const base =
    type === "prd"
      ? prdItems(closed, assigned, jump, showView, ralphMode)
      : type === "spec"
        ? specItems(closed, assigned, jump, showView, ralphMode)
        : todoItems(closed, assigned, jump, showView, ralphMode);
  if (!todo.checklist?.length) return base;
  const insert = base.findIndex((item) => item.value === "refine");
  const entry = {
    value: "edit-checklist",
    label: "edit-checklist",
    description: "Edit checklist with AI",
  };
  if (insert === -1) return [...base, entry];
  return [...base.slice(0, insert), entry, ...base.slice(insert)];
}
