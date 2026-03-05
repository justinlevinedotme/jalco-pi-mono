import type { ExtensionCommandContext } from "@mariozechner/pi-coding-agent";
import {
  back,
  backtab,
  create,
  createAction,
  createDetail,
  createList,
  detailScroll,
  detailToggle,
  down,
  enter,
  esc,
  leader,
  renderDetail,
  slash,
  tab,
  text,
  up,
  type Col,
  type Primitive,
} from "@howaboua/pi-howaboua-extensions-primitives-sdk";
import type {
  TodoFrontMatter,
  TodoListMode,
  TodoMenuAction,
  TodoRecord,
} from "../../core/types.js";
import {
  buildCreatePrdPrompt,
  buildCreateSpecPrompt,
  buildCreateTodoPrompt,
  buildEditChecklistPrompt,
  buildPrdReviewPrompt,
  buildSpecReviewPrompt,
  buildTodoReviewPrompt,
  buildValidateAuditPrompt,
  deriveTodoStatus,
  formatChecklistProgress,
  isTodoClosed,
  resolveLinkedPaths,
} from "../../format/index.js";
import {
  attachLinks,
  deleteTodo,
  ensureTodoExists,
  getTodoPath,
  getTodosDir,
  listTodos,
} from "../../io/index.js";
import {
  TodoCreateInputComponent,
  TodoEditChecklistInputComponent,
  SpecPrdSelectComponent,
  TodoParentSelectComponent,
  LinkSelectComponent,
  ValidateSelectComponent,
} from "../../ui/tui/index.js";
import type { TUI } from "@mariozechner/pi-tui";
import { applyTodoAction, handleQuickAction } from "./actions.js";
import { getCliPath } from "../../core/cli-path.js";
import { runValidateCli } from "./validate.js";
import { items } from "../../ui/gui/menu.js";
import { runRepairFrontmatter } from "./repair.js";

interface ActiveView {
  render: (width: number) => string[];
  invalidate: () => void;
  handleInput?: (data: string) => void;
  focused?: boolean;
}

interface TodoListRow {
  key: string;
  title: string;
  state: string;
  meta: string;
  search: string;
  todo: TodoFrontMatter | null;
}

interface TodoActionRow {
  name: TodoMenuAction;
  label: string;
  description: string;
}

function ensureTui(value: unknown): TUI {
  if (!value || typeof value !== "object") throw new Error("Invalid TUI instance");
  const withRender: unknown = Reflect.get(value, "requestRender");
  const withTerminal: unknown = Reflect.get(value, "terminal");
  if (typeof withRender !== "function") throw new Error("Invalid TUI: requestRender is missing");
  if (!withTerminal || typeof withTerminal !== "object")
    throw new Error("Invalid TUI: terminal is missing");
  return value as TUI;
}

function modeLabel(mode: TodoListMode): string {
  if (mode === "tasks") return "Tasks";
  if (mode === "prds") return "PRDs";
  if (mode === "specs") return "Specs";
  return "Closed";
}

function createLabel(mode: TodoListMode): string {
  if (mode === "tasks") return "create todo";
  if (mode === "prds") return "create PRD";
  if (mode === "specs") return "create spec";
  return "create";
}

function rowState(todo: TodoFrontMatter): string {
  const status = deriveTodoStatus(todo as TodoRecord).toLowerCase();
  const progress = formatChecklistProgress(todo);
  return `${status}${progress}`;
}

function rowMeta(todo: TodoFrontMatter, sessionId?: string): string {
  const type = (todo.type || "todo").toUpperCase();
  const tags = todo.tags.length ? `#${todo.tags.join(" #")}` : "no-tags";
  const assigned = todo.assigned_to_session
    ? `assigned:${todo.assigned_to_session === sessionId ? "you" : todo.assigned_to_session}`
    : "";
  const ralph =
    todo.ralph_loop_mode === "ralph-loop"
      ? "loop:rl"
      : todo.ralph_loop_mode === "ralph-loop-linked"
        ? "loop:rl+"
        : "";
  return [type, tags, assigned, ralph].filter(Boolean).join(" • ");
}

function detailPrimitive(record: TodoRecord): Primitive {
  const status = deriveTodoStatus(record).toLowerCase();
  const type = (record.type || "todo").toUpperCase();
  const tags = record.tags.length ? record.tags.join(", ") : "no tags";
  const checklist = record.checklist?.length
    ? [
        "Checklist",
        ...record.checklist.map((item, index) => {
          const done = item.done === true || item.status === "checked";
          return `${done ? "[x]" : "[ ]"} ${index + 1}. ${item.title}`;
        }),
      ]
    : [];
  const body = record.body?.trim() ? record.body.split(/\r?\n/) : ["_No details yet._"];
  const linkLines = record.links
    ? resolveLinkedPaths(record.links).map((line) => `- ${line.replaceAll("\\", "/")}`)
    : [];
  return createDetail({
    title: record.title || "(untitled)",
    meta: [
      `${type} • ${status}`,
      `tags: ${tags}`,
      `ralph-loop: ${record.ralph_loop_mode || "off"}`,
    ],
    block: linkLines.length ? [`Links (${linkLines.length})`, ...linkLines] : undefined,
    body: checklist.length ? [...checklist, "", ...body] : body,
  });
}

function normalizePath(value: string): string {
  return value.replaceAll("\\", "/");
}

export async function runTodoUi(
  args: string,
  ctx: ExtensionCommandContext,
): Promise<string | null> {
  const todosDir = getTodosDir(ctx.cwd);
  const todos = await listTodos(todosDir);
  const currentSessionId = ctx.sessionManager.getSessionId();
  const searchTerm = (args ?? "").trim().toLowerCase();
  let nextPrompt: string | null = null;

  await ctx.ui.custom<void>((tui, theme, _kb, done) => {
    const uiTui = ensureTui(tui);
    const skin = {
      fg: (color: string, value: string) => theme.fg(color as never, value),
    };

    let focused = false;
    let active: ActiveView | null = null;
    let all: TodoFrontMatter[] = todos;

    const modes: TodoListMode[] = ["tasks", "prds", "specs", "closed"];
    let modeIndex = 0;

    let searchActive = false;
    let searchQuery = "";
    let leaderActive = false;
    let leaderTimer: ReturnType<typeof setTimeout> | null = null;
    let busy = false;

    let screen: "list" | "actions" = "list";
    let actionList: ReturnType<typeof createAction<TodoActionRow>> | null = null;
    let selectedRecord: TodoRecord | null = null;
    let detail: Primitive | undefined;
    let showDetail = false;

    const cache = new Map<string, TodoRecord>();

    const setPrompt = (value: string) => {
      nextPrompt = value;
    };

    const status = (todo: TodoFrontMatter) => deriveTodoStatus(todo as TodoRecord).toLowerCase();
    const isDeprecated = (todo: TodoFrontMatter) => {
      const value = status(todo);
      return value === "abandoned" || value === "deprecated";
    };
    const isDone = (todo: TodoFrontMatter) => {
      const value = status(todo);
      return value === "done" || value === "closed";
    };
    const modified = (todo: TodoFrontMatter) =>
      Date.parse(todo.modified_at || todo.created_at || "") || 0;
    const listTasks = (items: TodoFrontMatter[]) =>
      items.filter(
        (todo) => (todo.type || "todo") === "todo" && !isDone(todo) && !isDeprecated(todo),
      );
    const listPrds = (items: TodoFrontMatter[]) =>
      items.filter((todo) => todo.type === "prd" && !isDone(todo) && !isDeprecated(todo));
    const listSpecs = (items: TodoFrontMatter[]) =>
      items.filter((todo) => todo.type === "spec" && !isDone(todo) && !isDeprecated(todo));
    const listClosed = (items: TodoFrontMatter[]) => {
      const prds = items
        .filter((todo) => todo.type === "prd" && (isDone(todo) || isDeprecated(todo)))
        .sort((a, b) => modified(b) - modified(a));
      const specs = items
        .filter((todo) => todo.type === "spec" && (isDone(todo) || isDeprecated(todo)))
        .sort((a, b) => modified(b) - modified(a));
      const tasks = items
        .filter((todo) => (todo.type || "todo") === "todo" && (isDone(todo) || isDeprecated(todo)))
        .sort((a, b) => modified(b) - modified(a));
      return [...prds, ...specs, ...tasks];
    };

    const rowsForMode = (mode: TodoListMode): TodoListRow[] => {
      const scoped =
        mode === "prds"
          ? listPrds(all)
          : mode === "specs"
            ? listSpecs(all)
            : mode === "closed"
              ? listClosed(all)
              : listTasks(all);
      const rows = scoped.map((todo) => ({
        key: todo.id,
        title: todo.title || "(untitled)",
        state: rowState(todo),
        meta: rowMeta(todo, currentSessionId),
        search:
          `${todo.title} ${todo.tags.join(" ")} ${status(todo)} ${todo.type || "todo"} ${todo.assigned_to_session || ""} ${todo.ralph_loop_mode || "off"}`.toLowerCase(),
        todo,
      }));
      if (mode === "closed") return rows;
      return [
        {
          key: "__create__",
          title: `+ ${createLabel(mode)}`,
          state: "",
          meta: "start new item",
          search: `create ${mode}`,
          todo: null,
        },
        ...rows,
      ];
    };

    const listCols = (): Col<TodoListRow>[] => [
      { show: true, width: 32, tone: "normal", align: "left", pick: (item) => item.title },
      { show: true, width: 14, tone: "accent", align: "left", pick: (item) => item.state },
      { show: true, width: 36, tone: "dim", align: "left", pick: (item) => item.meta },
    ];

    const createModeList = (mode: TodoListMode, rows: TodoListRow[]) =>
      createList<TodoListRow>({
        title: `${modeLabel(mode)} (${rows.filter((item) => item.todo).length})`,
        items: rows,
        shortcuts: "tab switch • / search • j/k select • v details • enter actions • ctrl+x more",
        tier: "top",
        tab: true,
        search: true,
        prompt: false,
        page: 7,
        find: (item, query) => item.search.includes(query),
        intent: (item) => {
          if (!item.todo) return { type: "action", name: "create" };
          return { type: "action", name: `open:${item.key}` };
        },
        view: (item) => {
          if (!item.todo) return undefined;
          return { type: "detail", key: item.key };
        },
        cols: listCols(),
      });

    let lists: Record<TodoListMode, ReturnType<typeof createList<TodoListRow>>> = {
      tasks: createModeList("tasks", rowsForMode("tasks")),
      prds: createModeList("prds", rowsForMode("prds")),
      specs: createModeList("specs", rowsForMode("specs")),
      closed: createModeList("closed", rowsForMode("closed")),
    };

    if (searchTerm) lists.tasks.set(searchTerm);

    const currentMode = (): TodoListMode => modes[modeIndex] || "tasks";
    const currentList = () => lists[currentMode()];

    const setActive = (component: ActiveView | null) => {
      if (active && "focused" in active) active.focused = false;
      active = component;
      if (active && "focused" in active) active.focused = focused;
      uiTui.requestRender();
    };

    const clearLeader = () => {
      if (leaderTimer) clearTimeout(leaderTimer);
      leaderTimer = null;
      leaderActive = false;
      uiTui.requestRender();
    };

    const startLeader = () => {
      if (leaderActive) {
        clearLeader();
        return;
      }
      leaderActive = true;
      if (leaderTimer) clearTimeout(leaderTimer);
      leaderTimer = setTimeout(() => clearLeader(), 2000);
      uiTui.requestRender();
    };

    const runAsync = (job: () => Promise<void>) => {
      if (busy) return;
      busy = true;
      void job()
        .catch((error) => {
          const message = error instanceof Error ? error.message : "UI action failed.";
          ctx.ui.notify(message, "error");
        })
        .finally(() => {
          busy = false;
          uiTui.requestRender();
        });
    };

    const refresh = async () => {
      const saved: Partial<Record<TodoListMode, string>> = {
        tasks: lists.tasks.query(),
        prds: lists.prds.query(),
        specs: lists.specs.query(),
        closed: lists.closed.query(),
      };
      all = await listTodos(todosDir);
      lists = {
        tasks: createModeList("tasks", rowsForMode("tasks")),
        prds: createModeList("prds", rowsForMode("prds")),
        specs: createModeList("specs", rowsForMode("specs")),
        closed: createModeList("closed", rowsForMode("closed")),
      };
      if (saved.tasks) lists.tasks.set(saved.tasks);
      if (saved.prds) lists.prds.set(saved.prds);
      if (saved.specs) lists.specs.set(saved.specs);
      if (saved.closed) lists.closed.set(saved.closed);
      cache.clear();
    };

    const sync = async (): Promise<TodoFrontMatter[]> => {
      await refresh();
      return all;
    };

    const resolve = async (todo: TodoFrontMatter): Promise<TodoRecord | null> => {
      const cached = cache.get(todo.id);
      if (cached) return cached;
      const record = await ensureTodoExists(getTodoPath(todosDir, todo.id, todo.type), todo.id);
      if (!record) {
        ctx.ui.notify("Todo not found", "error");
        return null;
      }
      cache.set(todo.id, record);
      return record;
    };

    const resolveById = async (id: string): Promise<TodoRecord | null> => {
      const todo = all.find((item) => item.id === id);
      if (!todo) return null;
      return resolve(todo);
    };

    const goList = () => {
      screen = "list";
      actionList = null;
      selectedRecord = null;
      showDetail = false;
      detail = undefined;
      searchActive = false;
      searchQuery = "";
    };

    const selectedTodoFromList = (): TodoFrontMatter | null => {
      const intent = currentList().enter();
      if (!intent || intent.type !== "action") return null;
      if (!intent.name.startsWith("open:")) return null;
      const id = intent.name.slice("open:".length);
      return all.find((item) => item.id === id) ?? null;
    };

    const ensureDetailForListSelection = async (): Promise<void> => {
      const todo = selectedTodoFromList();
      if (!todo) {
        showDetail = false;
        detail = undefined;
        return;
      }
      const record = await resolve(todo);
      if (!record) {
        showDetail = false;
        detail = undefined;
        return;
      }
      detail = detailPrimitive(record);
      showDetail = true;
    };

    const openActions = async (todo: TodoFrontMatter): Promise<void> => {
      const record = await resolve(todo);
      if (!record) return;
      const closed = isTodoClosed(record.status);
      const rows: TodoActionRow[] = items(record, closed, true).map((item) => ({
        name: item.value as TodoMenuAction,
        label: item.label,
        description: item.description || "",
      }));
      actionList = createAction<TodoActionRow>(
        {
          title: `Actions: ${record.title || "(untitled)"}`,
          items: rows,
          shortcuts:
            "j/k select • space toggle loops • v detail • J/K scroll detail • enter confirm",
          page: 7,
          find: (item, query) =>
            `${item.label} ${item.description}`.toLowerCase().includes(query.toLowerCase()),
          intent: (item) => ({ type: "action", name: item.name }),
          cols: [
            { show: true, width: 20, tone: "normal", align: "left", pick: (item) => item.label },
            {
              show: true,
              width: 52,
              tone: "dim",
              align: "left",
              pick: (item) => item.description,
            },
          ],
        },
        "nested",
      );
      selectedRecord = record;
      detail = detailPrimitive(record);
      showDetail = true;
      screen = "actions";
      searchActive = false;
      searchQuery = "";
    };

    const runListCommand = async (
      action: "sweep-abandoned" | "sweep-completed" | "review-all" | "repair-frontmatter",
    ) => {
      try {
        if (action === "repair-frontmatter") {
          const repaired = await runRepairFrontmatter(ctx);
          if ("error" in repaired) {
            ctx.ui.notify(repaired.error, "error");
            return;
          }
          await refresh();
          if (!repaired.broken) {
            ctx.ui.notify(
              `Frontmatter validation complete. ${repaired.scanned} file(s) scanned, no issues found.`,
              "info",
            );
            return;
          }
          ctx.ui.notify(
            `Frontmatter repair complete. ${repaired.repaired} repaired, ${repaired.failed} failed, ${repaired.broken} broken of ${repaired.scanned} scanned.`,
            repaired.failed ? "warning" : "info",
          );
          return;
        }
        if (action === "review-all") {
          const mode = currentMode();
          const updated = await listTodos(todosDir);
          const scoped =
            mode === "prds"
              ? listPrds(updated)
              : mode === "specs"
                ? listSpecs(updated)
                : mode === "closed"
                  ? listClosed(updated)
                  : listTasks(updated);
          if (!scoped.length) {
            ctx.ui.notify("No items available to review", "error");
            return;
          }
          const lines = scoped
            .map((todo) => {
              const filePath = getTodoPath(todosDir, todo.id, todo.type);
              const title = todo.title || "(untitled)";
              const type = todo.type || "todo";
              if (type === "prd") return `- ${buildPrdReviewPrompt(title, filePath, todo.links)}`;
              if (type === "spec") return `- ${buildSpecReviewPrompt(title, filePath, todo.links)}`;
              return `- ${buildTodoReviewPrompt(title, filePath, todo.links)}`;
            })
            .join("\n\n");
          setPrompt(`Review all items in ${mode} list:\n\n${lines}`);
          done();
          return;
        }
        const updated = await listTodos(todosDir);
        const ids = updated
          .filter((todo) => {
            const value = status(todo);
            if (action === "sweep-abandoned") return value === "abandoned";
            return value === "done" || value === "closed";
          })
          .map((todo) => todo.id);
        for (const id of ids) await deleteTodo(todosDir, id, ctx);
        await refresh();
        ctx.ui.notify(
          action === "sweep-abandoned"
            ? `Deleted ${ids.length} abandoned todos`
            : `Deleted ${ids.length} completed/closed todos`,
          "info",
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : "List command failed.";
        ctx.ui.notify(message, "error");
      }
    };

    const showAuditPrompt = async (record: TodoRecord) => {
      const latest = await sync();
      const current = getTodoPath(todosDir, record.id, record.type);
      const scope = latest.map((item) => getTodoPath(todosDir, item.id, item.type));
      setPrompt(buildValidateAuditPrompt(current, scope));
      done();
    };

    const showEditChecklistInput = (record: TodoRecord) => {
      const input = new TodoEditChecklistInputComponent(
        uiTui,
        theme,
        record,
        (userPrompt) => {
          const checklist = record.checklist || [];
          const filePath = getTodoPath(todosDir, record.id, record.type);
          setPrompt(
            buildEditChecklistPrompt(record.title || "(untitled)", filePath, checklist, userPrompt),
          );
          done();
        },
        () => setActive(appView),
      );
      setActive(input);
    };

    const showAttachInput = async (record: TodoRecord) => {
      const current = await sync();
      const prds = current.filter((item) => item.id !== record.id && item.type === "prd");
      const specs = current.filter((item) => item.id !== record.id && item.type === "spec");
      const todosForLinks = current.filter(
        (item) => item.id !== record.id && (item.type || "todo") === "todo",
      );
      const picker = new LinkSelectComponent(
        uiTui,
        theme,
        prds,
        specs,
        todosForLinks,
        async (selected) => {
          const latest = await sync();
          const targets = latest.filter(
            (item) =>
              selected.prds.has(item.id) ||
              selected.specs.has(item.id) ||
              selected.todos.has(item.id),
          );
          const result = await attachLinks(todosDir, record, targets, ctx);
          if ("error" in result) {
            ctx.ui.notify(result.error, "error");
            setActive(picker);
            return;
          }
          await refresh();
          const updated = await resolveById(record.id);
          if (updated) {
            selectedRecord = updated;
            detail = detailPrimitive(updated);
          }
          setActive(appView);
          ctx.ui.notify(`Attached links across ${result.updated} items`, "info");
        },
        () => setActive(appView),
      );
      setActive(picker);
    };

    const showValidateInput = async (record: TodoRecord) => {
      const cli = getCliPath();
      const file = getTodoPath(todosDir, record.id, record.type);
      let result: {
        issues: Array<{
          type: "prd" | "spec" | "todo";
          name: string;
          issue: string;
          file: string;
        }>;
        recommendations: Array<{
          target: string;
          type: "prd" | "spec" | "todo";
          name: string;
          reason: string;
        }>;
      };
      try {
        result = runValidateCli(cli, ctx.cwd, file);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Validate command failed.";
        ctx.ui.notify(message, "error");
        return;
      }
      if (!result.recommendations.length) {
        const issueCount = result.issues.length;
        ctx.ui.notify(
          issueCount
            ? `No attach recommendations. Found ${issueCount} issue(s).`
            : "No issues found.",
          "info",
        );
        return;
      }
      const picker = new ValidateSelectComponent(
        uiTui,
        theme,
        result.recommendations.map((item) => ({
          key: item.target,
          label: item.name,
          type: item.type,
          reason: item.reason,
        })),
        async (selected) => {
          const latest = await sync();
          const targets = latest.filter((item) => {
            const target = normalizePath(getTodoPath(todosDir, item.id, item.type));
            return (
              selected.prds.has(target) || selected.specs.has(target) || selected.todos.has(target)
            );
          });
          const applied = await attachLinks(todosDir, record, targets, ctx);
          if ("error" in applied) {
            ctx.ui.notify(applied.error, "error");
            setActive(picker);
            return;
          }
          await refresh();
          const updated = await resolveById(record.id);
          if (updated) {
            selectedRecord = updated;
            detail = detailPrimitive(updated);
          }
          setActive(appView);
          ctx.ui.notify(`Applied ${targets.length} recommended attachment(s)`, "info");
        },
        () => setActive(appView),
      );
      setActive(picker);
    };

    const showCreateInput = async (mode: TodoListMode) => {
      const current = await sync();
      if (mode === "tasks") {
        const picker = new TodoParentSelectComponent(
          uiTui,
          theme,
          listPrds(current),
          listSpecs(current),
          (selected) => {
            const createInput = new TodoCreateInputComponent(
              uiTui,
              theme,
              (userPrompt) => {
                void (async () => {
                  const cli = getCliPath();
                  const latest = await sync();
                  const prdPaths = listPrds(latest)
                    .filter((item) => selected.prds.has(item.id))
                    .map((item) => getTodoPath(todosDir, item.id, "prd"));
                  const specPaths = listSpecs(latest)
                    .filter((item) => selected.specs.has(item.id))
                    .map((item) => getTodoPath(todosDir, item.id, "spec"));
                  const standalone =
                    selected.prds.has("__NONE__") || selected.specs.has("__NONE__");
                  setPrompt(
                    buildCreateTodoPrompt(
                      userPrompt,
                      cli,
                      ctx.cwd,
                      standalone ? [] : prdPaths,
                      standalone ? [] : specPaths,
                    ),
                  );
                  done();
                })();
              },
              () => setActive(appView),
              {
                title: "Create New Todo",
                description:
                  "Describe the task implementation plan. Selected PRDs/specs will be attached.",
              },
            );
            setActive(createInput);
          },
          () => setActive(appView),
        );
        setActive(picker);
        return;
      }
      if (mode === "specs") {
        const picker = new SpecPrdSelectComponent(
          uiTui,
          theme,
          listPrds(current),
          (selectedPrds) => {
            const createInput = new TodoCreateInputComponent(
              uiTui,
              theme,
              (userPrompt) => {
                const cli = getCliPath();
                const prdPaths = selectedPrds.map((item) => getTodoPath(todosDir, item.id, "prd"));
                setPrompt(buildCreateSpecPrompt(userPrompt, cli, ctx.cwd, prdPaths));
                done();
              },
              () => setActive(appView),
              {
                title: "Create New Spec",
                description:
                  "Describe the technical specification. Selected PRDs will be attached.",
              },
            );
            setActive(createInput);
          },
          () => setActive(appView),
        );
        setActive(picker);
        return;
      }
      const createInput = new TodoCreateInputComponent(
        uiTui,
        theme,
        (userPrompt) => {
          const cli = getCliPath();
          const prompt =
            mode === "prds"
              ? buildCreatePrdPrompt(userPrompt, cli, ctx.cwd)
              : buildCreateTodoPrompt(userPrompt, cli, ctx.cwd, [], []);
          setPrompt(prompt);
          done();
        },
        () => setActive(appView),
        {
          title: mode === "prds" ? "Create New PRD" : "Create New Todo",
          description:
            mode === "prds"
              ? "Describe the product requirement. The AI SHOULD read linked files and ask clarifying questions first."
              : "Describe the task. The AI will read files and ask questions before creating.",
        },
      );
      setActive(createInput);
    };

    const keepActionsOpen = (action: TodoMenuAction): boolean =>
      action === "toggle-ralph-loop" ||
      action === "toggle-ralph-loop-linked" ||
      action === "run-ralph-loop";

    const handleAction = async (action: TodoMenuAction): Promise<void> => {
      const record = selectedRecord;
      if (!record) return;
      if (action === "view") {
        showDetail = !showDetail;
        if (showDetail) detail = detailPrimitive(record);
        return;
      }
      if (action === "edit-checklist") {
        showEditChecklistInput(record);
        return;
      }
      if (action === "attach-links") {
        await showAttachInput(record);
        return;
      }
      if (action === "validate-links") {
        await showValidateInput(record);
        return;
      }
      if (action === "audit") {
        await showAuditPrompt(record);
        return;
      }
      const result = await applyTodoAction(todosDir, ctx, refresh, done, record, action, setPrompt);
      if (result !== "stay") return;
      if (!keepActionsOpen(action)) {
        goList();
        return;
      }
      const updated = await resolveById(record.id);
      if (!updated) return;
      await openActions(updated);
    };

    const runLeader = async (keyData: string): Promise<boolean> => {
      const selected = selectedTodoFromList();
      if ((keyData === "w" || keyData === "W") && selected) {
        clearLeader();
        await handleQuickAction(
          todosDir,
          selected,
          "work",
          () => {
            void showCreateInput(currentMode());
          },
          done,
          setPrompt,
          ctx,
          resolve,
        );
        return true;
      }
      if (keyData === "c" || keyData === "C") {
        clearLeader();
        await showCreateInput(currentMode());
        return true;
      }
      if (keyData === "y" || keyData === "Y") {
        clearLeader();
        await runListCommand("review-all");
        return true;
      }
      if (keyData === "r" || keyData === "R") {
        clearLeader();
        await runListCommand("repair-frontmatter");
        return true;
      }
      if ((keyData === "a" || keyData === "A") && currentMode() === "closed") {
        clearLeader();
        await runListCommand("sweep-abandoned");
        return true;
      }
      if ((keyData === "d" || keyData === "D") && currentMode() === "closed") {
        clearLeader();
        await runListCommand("sweep-completed");
        return true;
      }
      clearLeader();
      return false;
    };

    const appView: ActiveView = {
      render(width: number): string[] {
        const panel = screen === "actions" ? actionList : currentList();
        if (!panel) return [];
        const base = create(panel.slot(), skin).render(width);
        if (!showDetail || !detail) return base;
        const top = renderDetail(detail.slot(), width, base.length, skin);
        return [...top, "", ...base];
      },
      invalidate() {},
      handleInput(data: string): void {
        if (searchActive) {
          if (esc(data)) {
            searchActive = false;
            searchQuery = "";
            currentList().set("");
            uiTui.requestRender();
            return;
          }
          if (enter(data)) {
            searchActive = false;
            uiTui.requestRender();
            return;
          }
          if (back(data)) {
            searchQuery = searchQuery.slice(0, -1);
            currentList().set(searchQuery);
            uiTui.requestRender();
            return;
          }
          if (text(data)) {
            searchQuery += data.toLowerCase();
            currentList().set(searchQuery);
            uiTui.requestRender();
          }
          return;
        }

        const step = detailScroll(data);
        if (showDetail && detail && step !== 0) {
          if (step > 0) detail.down();
          if (step < 0) detail.up();
          uiTui.requestRender();
          return;
        }

        if (screen === "actions") {
          if (esc(data)) {
            goList();
            uiTui.requestRender();
            return;
          }
          if (detailToggle(data)) {
            showDetail = !showDetail;
            if (showDetail && selectedRecord) detail = detailPrimitive(selectedRecord);
            uiTui.requestRender();
            return;
          }
          if (down(data)) {
            actionList?.down();
            uiTui.requestRender();
            return;
          }
          if (up(data)) {
            actionList?.up();
            uiTui.requestRender();
            return;
          }
          if (data === " ") {
            const intent = actionList?.enter();
            if (!intent || intent.type !== "action") return;
            if (intent.name !== "toggle-ralph-loop" && intent.name !== "toggle-ralph-loop-linked")
              return;
            runAsync(async () => {
              await handleAction(intent.name as TodoMenuAction);
            });
            return;
          }
          if (enter(data)) {
            const intent = actionList?.enter();
            if (!intent || intent.type !== "action") return;
            runAsync(async () => {
              await handleAction(intent.name as TodoMenuAction);
            });
          }
          return;
        }

        if (leaderActive) {
          runAsync(async () => {
            await runLeader(data);
          });
          return;
        }

        if (leader(data)) {
          startLeader();
          return;
        }

        if (esc(data)) {
          if (showDetail) {
            showDetail = false;
            detail = undefined;
            uiTui.requestRender();
            return;
          }
          done();
          return;
        }

        if (tab(data)) {
          modeIndex = (modeIndex + 1) % modes.length;
          showDetail = false;
          detail = undefined;
          uiTui.requestRender();
          return;
        }

        if (backtab(data)) {
          modeIndex = (modeIndex - 1 + modes.length) % modes.length;
          showDetail = false;
          detail = undefined;
          uiTui.requestRender();
          return;
        }

        if (slash(data)) {
          searchActive = true;
          searchQuery = currentList().query();
          uiTui.requestRender();
          return;
        }

        if (down(data)) {
          currentList().down();
          if (showDetail) runAsync(ensureDetailForListSelection);
          uiTui.requestRender();
          return;
        }

        if (up(data)) {
          currentList().up();
          if (showDetail) runAsync(ensureDetailForListSelection);
          uiTui.requestRender();
          return;
        }

        if (detailToggle(data)) {
          if (showDetail) {
            showDetail = false;
            detail = undefined;
            uiTui.requestRender();
            return;
          }
          runAsync(ensureDetailForListSelection);
          return;
        }

        if (enter(data)) {
          const intent = currentList().enter();
          if (!intent || intent.type !== "action") return;
          if (intent.name === "create") {
            runAsync(async () => {
              await showCreateInput(currentMode());
            });
            return;
          }
          if (!intent.name.startsWith("open:")) return;
          const id = intent.name.slice("open:".length);
          const todo = all.find((item) => item.id === id);
          if (!todo) {
            ctx.ui.notify("Todo not found", "error");
            return;
          }
          runAsync(async () => {
            await openActions(todo);
          });
        }
      },
      focused,
    };

    setActive(appView);

    return {
      get focused() {
        return focused;
      },
      set focused(value: boolean) {
        focused = value;
        if (active && "focused" in active) active.focused = value;
      },
      render(width: number) {
        if (!active) return [];
        return active.render(width);
      },
      invalidate() {
        active?.invalidate();
      },
      handleInput(data: string) {
        active?.handleInput?.(data);
      },
    };
  });

  return nextPrompt;
}
