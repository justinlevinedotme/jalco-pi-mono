export interface ChecklistItem {
  id: string;
  title: string;
  status: "unchecked" | "checked";
  done?: boolean;
}

export interface TodoLinks {
  root_abs?: string;
  prds?: string[];
  specs?: string[];
  todos?: string[];
  reads?: string[];
}

export interface TodoWorktree {
  enabled?: boolean;
  branch?: string;
}

export type RalphLoopMode = "off" | "ralph-loop" | "ralph-loop-linked";

export interface TodoFrontMatter {
  id: string;
  title: string;
  tags: string[];
  status: string;
  created_at: string;
  modified_at?: string;
  assigned_to_session?: string;
  assigned_to_session_file?: string;
  checklist?: ChecklistItem[];
  type?: string;
  template?: boolean;
  links?: TodoLinks;
  agent_rules?: string;
  worktree?: TodoWorktree;
  ralph_loop_mode?: RalphLoopMode;
}

export interface TodoRecord extends TodoFrontMatter {
  body: string;
}

export interface TodoSettings {
  gc: boolean;
  gcDays: number;
}

export type TodoAction =
  | "list"
  | "list-all"
  | "get"
  | "create"
  | "update"
  | "append"
  | "claim"
  | "release"
  | "tick";

export type TodoOverlayAction = "back" | "work" | "edit-checklist";

export type TodoMenuAction =
  | "work"
  | "review-item"
  | "review-all"
  | "refine"
  | "complete"
  | "abandon"
  | "reopen"
  | "delete"
  | "assign"
  | "release"
  | "go-to-session"
  | "attach-links"
  | "validate-links"
  | "audit"
  | "edit-checklist"
  | "toggle-ralph-loop"
  | "toggle-ralph-loop-linked"
  | "run-ralph-loop"
  | "copyPath"
  | "copyText"
  | "view";

export type TodoToolDetails =
  | {
      action: "list" | "list-all";
      todos: TodoFrontMatter[];
      currentSessionId?: string;
      error?: string;
    }
  | {
      action: "get" | "create" | "update" | "append" | "claim" | "release";
      todo: TodoRecord;
      error?: string;
    }
  | {
      action: "tick";
      todo: TodoRecord;
      tickedItem?: ChecklistItem;
      remaining: ChecklistItem[];
      allComplete: boolean;
      error?: string;
    };

export type TodoCreateCallback = (prompt: string) => void;

export type TodoQuickAction = "work" | "refine" | "create";
export type TodoListMode = "tasks" | "prds" | "specs" | "closed";
