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

const NONE = "__NONE__";
const ROWS = 9;

interface ParentState {
  tab: "prds" | "specs";
  prds: Set<string>;
  specs: Set<string>;
}

export class TodoParentSelectComponent extends Container {
  private tui: TUI;
  private theme: Theme;
  private onSubmit: (state: ParentState) => void;
  private onCancel: () => void;
  private prds: TodoFrontMatter[];
  private specs: TodoFrontMatter[];
  private tab: "prds" | "specs" = "prds";
  private selected = 0;
  private prdSet = new Set<string>();
  private specSet = new Set<string>();
  private list: Container;

  constructor(
    tui: TUI,
    theme: Theme,
    prds: TodoFrontMatter[],
    specs: TodoFrontMatter[],
    onSubmit: (state: ParentState) => void,
    onCancel: () => void,
  ) {
    super();
    this.tui = tui;
    this.theme = theme;
    this.prds = prds;
    this.specs = specs;
    this.onSubmit = onSubmit;
    this.onCancel = onCancel;
    this.list = new Container();
    this.addChild(new DynamicBorder((s: string) => theme.fg("accent", s)));
    this.addChild(new Spacer(1));
    this.addChild(new Text(theme.fg("accent", theme.bold("Attach PRDs/Specs to todo")), 1, 0));
    this.addChild(new Spacer(1));
    this.addChild(
      new Text(
        theme.fg(
          "muted",
          "Tab switches PRDs/Specs. Space toggles. Enter confirms. Top item creates standalone todo.",
        ),
        1,
        0,
      ),
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

  private rows(): Array<{ id: string; title: string }> {
    if (this.tab === "prds") {
      return [
        { id: NONE, title: "Create standalone todo" },
        ...this.prds.map((item) => ({ id: item.id, title: item.title || "(untitled PRD)" })),
      ];
    }
    return [
      { id: NONE, title: "Create standalone todo" },
      ...this.specs.map((item) => ({ id: item.id, title: item.title || "(untitled spec)" })),
    ];
  }

  private activeSet(): Set<string> {
    if (this.tab === "prds") return this.prdSet;
    return this.specSet;
  }

  private clearNone(): void {
    this.prdSet.delete(NONE);
    this.specSet.delete(NONE);
  }

  private renderState(): void {
    this.list.clear();
    const tabs =
      this.theme.fg(this.tab === "prds" ? "accent" : "muted", "PRDs") +
      this.theme.fg("muted", " | ") +
      this.theme.fg(this.tab === "specs" ? "accent" : "muted", "Specs");
    this.list.addChild(new Text(tabs, 0, 0));
    this.list.addChild(new Spacer(1));
    const rows = this.rows();
    const active = this.activeSet();
    const start = Math.max(
      0,
      Math.min(this.selected - Math.floor(ROWS / 2), Math.max(0, rows.length - ROWS)),
    );
    const end = Math.min(start + ROWS, rows.length);
    for (let index = start; index < end; index += 1) {
      const row = rows[index];
      const mark = active.has(row.id) ? "[x]" : "[ ]";
      const pointer = index === this.selected ? this.theme.fg("accent", "→ ") : "  ";
      const title = index === this.selected ? this.theme.fg("accent", row.title) : row.title;
      this.list.addChild(new Text(`${pointer}${mark} ${title}`, 0, 0));
    }
    for (let index = end - start; index < ROWS; index += 1) {
      this.list.addChild(new Text("⠀", 0, 0));
    }
    const pointer = rows.length ? this.selected + 1 : 0;
    this.list.addChild(new Text(this.theme.fg("dim", `  (${pointer}/${rows.length})`), 0, 0));
    this.tui.requestRender();
  }

  private confirm(): void {
    this.onSubmit({ tab: this.tab, prds: this.prdSet, specs: this.specSet });
  }

  handleInput(data: string): void {
    if (keyEsc(data) || data === "\u0003") {
      this.onCancel();
      return;
    }
    if (keyTab(data) || keyBacktab(data)) {
      this.tab = this.tab === "prds" ? "specs" : "prds";
      this.selected = 0;
      this.renderState();
      return;
    }
    if (keyEnter(data)) {
      this.confirm();
      return;
    }
    const rows = this.rows();
    if (keyUp(data)) {
      this.selected = this.selected === 0 ? rows.length - 1 : this.selected - 1;
      this.renderState();
      return;
    }
    if (keyDown(data)) {
      this.selected = this.selected === rows.length - 1 ? 0 : this.selected + 1;
      this.renderState();
      return;
    }
    if (data !== " ") return;
    const row = rows[this.selected];
    if (!row) return;
    if (row.id === NONE) {
      this.prdSet.clear();
      this.specSet.clear();
      this.prdSet.add(NONE);
      this.specSet.add(NONE);
      this.renderState();
      return;
    }
    this.clearNone();
    const active = this.activeSet();
    if (active.has(row.id)) active.delete(row.id);
    else active.add(row.id);
    this.renderState();
  }
}
