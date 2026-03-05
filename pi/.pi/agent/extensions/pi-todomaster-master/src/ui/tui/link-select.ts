import { Container, Spacer, Text, TUI } from "@mariozechner/pi-tui";
import type { Theme } from "@mariozechner/pi-coding-agent";
import { DynamicBorder } from "@mariozechner/pi-coding-agent";
import {
  backtab as keyBacktab,
  down as keyDown,
  enter as keyEnter,
  esc as keyEsc,
  tab as keyTab,
  up as keyUp,
} from "@howaboua/pi-howaboua-extensions-primitives-sdk";
import type { TodoFrontMatter } from "../../core/types.js";

const ROWS = 9;

interface LinkState {
  prds: Set<string>;
  specs: Set<string>;
  todos: Set<string>;
}

export class LinkSelectComponent extends Container {
  private tui: TUI;
  private theme: Theme;
  private onSubmit: (state: LinkState) => void;
  private onCancel: () => void;
  private prds: TodoFrontMatter[];
  private specs: TodoFrontMatter[];
  private todos: TodoFrontMatter[];
  private tab: "prds" | "specs" | "todos" = "prds";
  private selected = 0;
  private prdSet = new Set<string>();
  private specSet = new Set<string>();
  private todoSet = new Set<string>();
  private list: Container;

  constructor(
    tui: TUI,
    theme: Theme,
    prds: TodoFrontMatter[],
    specs: TodoFrontMatter[],
    todos: TodoFrontMatter[],
    onSubmit: (state: LinkState) => void,
    onCancel: () => void,
  ) {
    super();
    this.tui = tui;
    this.theme = theme;
    this.prds = prds;
    this.specs = specs;
    this.todos = todos;
    this.onSubmit = onSubmit;
    this.onCancel = onCancel;
    this.list = new Container();
    this.addChild(new DynamicBorder((s: string) => theme.fg("accent", s)));
    this.addChild(new Spacer(1));
    this.addChild(new Text(theme.fg("accent", theme.bold("Attach existing items")), 1, 0));
    this.addChild(new Spacer(1));
    this.addChild(
      new Text(theme.fg("muted", "Tab switches lists. Space toggles. Enter confirms."), 1, 0),
    );
    this.addChild(new Spacer(1));
    this.addChild(this.list);
    this.addChild(new Spacer(1));
    this.addChild(
      new Text(
        theme.fg(
          "dim",
          "Tab switch lists • ↑↓ or j/k move • Space toggle • Enter confirm • Esc back",
        ),
        1,
        0,
      ),
    );
    this.addChild(new Spacer(1));
    this.addChild(new DynamicBorder((s: string) => theme.fg("accent", s)));
    this.renderState();
  }

  private rows(): TodoFrontMatter[] {
    if (this.tab === "prds") return this.prds;
    if (this.tab === "specs") return this.specs;
    return this.todos;
  }

  private active(): Set<string> {
    if (this.tab === "prds") return this.prdSet;
    if (this.tab === "specs") return this.specSet;
    return this.todoSet;
  }

  private renderState(): void {
    this.list.clear();
    const tabs =
      this.theme.fg(this.tab === "prds" ? "accent" : "muted", "PRDs") +
      this.theme.fg("muted", " | ") +
      this.theme.fg(this.tab === "specs" ? "accent" : "muted", "Specs") +
      this.theme.fg("muted", " | ") +
      this.theme.fg(this.tab === "todos" ? "accent" : "muted", "Todos");
    this.list.addChild(new Text(tabs, 0, 0));
    this.list.addChild(new Spacer(1));
    const rows = this.rows();
    const active = this.active();
    const start = Math.max(
      0,
      Math.min(this.selected - Math.floor(ROWS / 2), Math.max(0, rows.length - ROWS)),
    );
    const end = Math.min(start + ROWS, rows.length);
    for (let index = start; index < end; index += 1) {
      const row = rows[index];
      const mark = active.has(row.id) ? "[x]" : "[ ]";
      const pointer = index === this.selected ? this.theme.fg("accent", "→ ") : "  ";
      const title = row.title || "(untitled)";
      this.list.addChild(new Text(`${pointer}${mark} ${title}`, 0, 0));
    }
    for (let index = end - start; index < ROWS; index += 1) {
      this.list.addChild(new Text("⠀", 0, 0));
    }
    const pointer = rows.length ? this.selected + 1 : 0;
    this.list.addChild(new Text(this.theme.fg("dim", `  (${pointer}/${rows.length})`), 0, 0));
    this.tui.requestRender();
  }

  handleInput(data: string): void {
    if (keyEsc(data) || data === "\u0003") {
      this.onCancel();
      return;
    }
    if (keyTab(data)) {
      this.tab = this.tab === "prds" ? "specs" : this.tab === "specs" ? "todos" : "prds";
      this.selected = 0;
      this.renderState();
      return;
    }
    if (keyBacktab(data)) {
      this.tab = this.tab === "prds" ? "todos" : this.tab === "specs" ? "prds" : "specs";
      this.selected = 0;
      this.renderState();
      return;
    }
    if (keyEnter(data)) {
      this.onSubmit({ prds: this.prdSet, specs: this.specSet, todos: this.todoSet });
      return;
    }
    if (keyUp(data)) {
      const rows = this.rows();
      this.selected = this.selected === 0 ? Math.max(0, rows.length - 1) : this.selected - 1;
      this.renderState();
      return;
    }
    if (keyDown(data)) {
      const rows = this.rows();
      this.selected = this.selected === Math.max(0, rows.length - 1) ? 0 : this.selected + 1;
      this.renderState();
      return;
    }
    if (data !== " ") return;
    const row = this.rows()[this.selected];
    if (!row) return;
    const active = this.active();
    if (active.has(row.id)) active.delete(row.id);
    else active.add(row.id);
    this.renderState();
  }
}
