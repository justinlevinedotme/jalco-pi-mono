import { Container, Spacer, Text, TUI } from "@mariozechner/pi-tui";
import type { Theme } from "@mariozechner/pi-coding-agent";
import { DynamicBorder } from "@mariozechner/pi-coding-agent";
import {
  down as keyDown,
  enter as keyEnter,
  esc as keyEsc,
  up as keyUp,
} from "@howaboua/pi-howaboua-extensions-primitives-sdk";
import type { TodoFrontMatter } from "../../core/types.js";

const NONE = "__NONE__";
const ROWS = 9;

export class SpecPrdSelectComponent extends Container {
  private rows: Array<{ id: string; title: string }>;
  private selected = 0;
  private chosen = new Set<string>();
  private list: Container;
  private onSubmit: (items: TodoFrontMatter[]) => void;
  private onCancel: () => void;
  private prds: TodoFrontMatter[];
  private theme: Theme;
  private tui: TUI;

  constructor(
    tui: TUI,
    theme: Theme,
    prds: TodoFrontMatter[],
    onSubmit: (items: TodoFrontMatter[]) => void,
    onCancel: () => void,
  ) {
    super();
    this.tui = tui;
    this.prds = prds;
    this.onSubmit = onSubmit;
    this.onCancel = onCancel;
    this.theme = theme;
    this.rows = [
      { id: NONE, title: "Create standalone spec" },
      ...prds.map((item) => ({ id: item.id, title: item.title || "(untitled PRD)" })),
    ];
    this.list = new Container();
    this.addChild(new DynamicBorder((s: string) => theme.fg("accent", s)));
    this.addChild(new Spacer(1));
    this.addChild(new Text(theme.fg("accent", theme.bold("Attach PRDs to spec")), 1, 0));
    this.addChild(new Spacer(1));
    this.addChild(
      new Text(
        theme.fg(
          "muted",
          "Top item creates standalone spec. Select PRDs with Space. Enter confirms.",
        ),
        1,
        0,
      ),
    );
    this.addChild(new Spacer(1));
    this.addChild(this.list);
    this.addChild(new Spacer(1));
    this.addChild(
      new Text(theme.fg("dim", "↑↓ or j/k move • Space toggle • Enter confirm • Esc back"), 1, 0),
    );
    this.addChild(new Spacer(1));
    this.addChild(new DynamicBorder((s: string) => theme.fg("accent", s)));
    this.renderState();
  }

  private renderState(): void {
    this.list.clear();
    const start = Math.max(
      0,
      Math.min(this.selected - Math.floor(ROWS / 2), Math.max(0, this.rows.length - ROWS)),
    );
    const end = Math.min(start + ROWS, this.rows.length);
    for (let index = start; index < end; index += 1) {
      const row = this.rows[index];
      const mark = this.chosen.has(row.id) ? "[x]" : "[ ]";
      const pointer = index === this.selected ? this.theme.fg("accent", "→ ") : "  ";
      const title = index === this.selected ? this.theme.fg("accent", row.title) : row.title;
      this.list.addChild(new Text(`${pointer}${mark} ${title}`, 0, 0));
    }
    for (let index = end - start; index < ROWS; index += 1) {
      this.list.addChild(new Text("⠀", 0, 0));
    }
    const pointer = this.rows.length ? this.selected + 1 : 0;
    this.list.addChild(new Text(this.theme.fg("dim", `  (${pointer}/${this.rows.length})`), 0, 0));
    this.tui.requestRender();
  }

  private confirm(): void {
    if (this.chosen.has(NONE) || !this.chosen.size) return this.onSubmit([]);
    const ids = new Set(this.chosen);
    const items = this.prds.filter((item) => ids.has(item.id));
    this.onSubmit(items);
  }

  handleInput(data: string): void {
    if (keyEsc(data) || data === "\u0003") {
      this.onCancel();
      return;
    }
    if (keyEnter(data)) {
      this.confirm();
      return;
    }
    if (keyUp(data)) {
      this.selected = this.selected === 0 ? this.rows.length - 1 : this.selected - 1;
      this.renderState();
      return;
    }
    if (keyDown(data)) {
      this.selected = this.selected === this.rows.length - 1 ? 0 : this.selected + 1;
      this.renderState();
      return;
    }
    if (data !== " ") return;
    const row = this.rows[this.selected];
    if (!row) return;
    if (row.id === NONE) {
      this.chosen.clear();
      this.chosen.add(NONE);
      this.renderState();
      return;
    }
    this.chosen.delete(NONE);
    if (this.chosen.has(row.id)) this.chosen.delete(row.id);
    else this.chosen.add(row.id);
    this.renderState();
  }
}
