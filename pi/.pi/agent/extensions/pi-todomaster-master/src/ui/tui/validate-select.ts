import { Container, Spacer, Text, TUI } from "@mariozechner/pi-tui";
import type { Theme } from "@mariozechner/pi-coding-agent";
import { DynamicBorder } from "@mariozechner/pi-coding-agent";
import {
  down as keyDown,
  enter as keyEnter,
  esc as keyEsc,
  up as keyUp,
} from "@howaboua/pi-howaboua-extensions-primitives-sdk";

interface Row {
  key: string;
  label: string;
  type: "prd" | "spec" | "todo";
  reason: string;
}

interface State {
  prds: Set<string>;
  specs: Set<string>;
  todos: Set<string>;
}

function section(rows: Row[], type: "prd" | "spec" | "todo"): Row[] {
  return rows.filter((item) => item.type === type);
}

export class ValidateSelectComponent extends Container {
  private tui: TUI;
  private theme: Theme;
  private rows: Row[];
  private active = 0;
  private selected = new Set<string>();
  private onSubmit: (state: State) => void;
  private onCancel: () => void;
  private view: Container;

  constructor(
    tui: TUI,
    theme: Theme,
    rows: Row[],
    onSubmit: (state: State) => void,
    onCancel: () => void,
  ) {
    super();
    this.tui = tui;
    this.theme = theme;
    this.rows = rows;
    this.onSubmit = onSubmit;
    this.onCancel = onCancel;
    this.view = new Container();
    this.addChild(new DynamicBorder((s: string) => theme.fg("accent", s)));
    this.addChild(new Spacer(1));
    this.addChild(new Text(theme.fg("accent", theme.bold("Recommended attachments")), 1, 0));
    this.addChild(new Spacer(1));
    this.addChild(this.view);
    this.addChild(new Spacer(1));
    this.addChild(
      new Text(
        theme.fg(
          "dim",
          "Order: PRDs -> Specs -> Todos • ↑↓ or j/k move • Space toggle • Enter apply • Esc back",
        ),
        1,
        0,
      ),
    );
    this.addChild(new Spacer(1));
    this.addChild(new DynamicBorder((s: string) => theme.fg("accent", s)));
    this.renderState();
  }

  private list(): Row[] {
    const prds = section(this.rows, "prd");
    const specs = section(this.rows, "spec");
    const todos = section(this.rows, "todo");
    return [...prds, ...specs, ...todos];
  }

  private renderState(): void {
    this.view.clear();
    const rows = this.list();
    const prds = section(rows, "prd");
    const specs = section(rows, "spec");
    const todos = section(rows, "todo");
    this.drawGroup("PRDs", prds, rows);
    this.drawGroup("Specs", specs, rows);
    this.drawGroup("Todos", todos, rows);
    this.tui.requestRender();
  }

  private drawGroup(name: string, rows: Row[], all: Row[]): void {
    this.view.addChild(new Text(this.theme.fg("muted", name), 0, 0));
    if (!rows.length) {
      this.view.addChild(new Text(this.theme.fg("dim", "  (none)"), 0, 0));
      this.view.addChild(new Spacer(1));
      return;
    }
    for (const row of rows) {
      const index = all.findIndex((item) => item.key === row.key);
      const mark = this.selected.has(row.key) ? "[x]" : "[ ]";
      const pointer = this.active === index ? this.theme.fg("accent", "→ ") : "  ";
      this.view.addChild(new Text(`${pointer}${mark} ${row.label}`, 0, 0));
      this.view.addChild(new Text(this.theme.fg("dim", `    ${row.reason}`), 0, 0));
    }
    this.view.addChild(new Spacer(1));
  }

  handleInput(data: string): void {
    const rows = this.list();
    if (!rows.length) {
      if (keyEsc(data) || data === "\u0003") this.onCancel();
      return;
    }
    if (keyEsc(data) || data === "\u0003") {
      this.onCancel();
      return;
    }
    if (keyUp(data)) {
      this.active = this.active === 0 ? rows.length - 1 : this.active - 1;
      this.renderState();
      return;
    }
    if (keyDown(data)) {
      this.active = this.active === rows.length - 1 ? 0 : this.active + 1;
      this.renderState();
      return;
    }
    if (data === " ") {
      const row = rows[this.active];
      if (!row) return;
      if (this.selected.has(row.key)) this.selected.delete(row.key);
      else this.selected.add(row.key);
      this.renderState();
      return;
    }
    if (keyEnter(data)) {
      const state: State = {
        prds: new Set<string>(),
        specs: new Set<string>(),
        todos: new Set<string>(),
      };
      for (const row of rows) {
        if (!this.selected.has(row.key)) continue;
        if (row.type === "prd") state.prds.add(row.key);
        if (row.type === "spec") state.specs.add(row.key);
        if (row.type === "todo") state.todos.add(row.key);
      }
      this.onSubmit(state);
    }
  }
}
