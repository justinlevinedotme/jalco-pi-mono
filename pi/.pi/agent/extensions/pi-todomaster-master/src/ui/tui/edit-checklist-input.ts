import { Container, Input, Spacer, Text, TUI } from "@mariozechner/pi-tui";
import type { Theme } from "@mariozechner/pi-coding-agent";
import { DynamicBorder } from "@mariozechner/pi-coding-agent";
import { esc as keyEsc } from "@howaboua/pi-howaboua-extensions-primitives-sdk";
import type { TodoRecord } from "../../core/types.js";
import { renderChecklist } from "../../format/index.js";

export class TodoEditChecklistInputComponent extends Container {
  private input: Input;
  private onSubmitCallback: (prompt: string) => void;
  private onCancelCallback: () => void;

  constructor(
    tui: TUI,
    theme: Theme,
    todo: TodoRecord,
    onSubmit: (prompt: string) => void,
    onCancel: () => void,
  ) {
    super();
    this.onSubmitCallback = onSubmit;
    this.onCancelCallback = onCancel;

    this.addChild(new DynamicBorder((s: string) => theme.fg("accent", s)));
    this.addChild(new Spacer(1));

    const title = todo.title || "(untitled)";
    this.addChild(new Text(theme.fg("accent", theme.bold("Edit Checklist")), 1, 0));
    this.addChild(new Text(theme.fg("muted", title), 1, 0));
    this.addChild(new Spacer(1));

    if (todo.checklist?.length) {
      const checklistLines = renderChecklist(theme, todo.checklist);
      for (const line of checklistLines) {
        this.addChild(new Text(line, 1, 0));
      }
      this.addChild(new Spacer(1));
    }

    this.addChild(
      new Text(theme.fg("muted", "What would you like to do with the checklist?"), 1, 0),
    );
    this.addChild(new Spacer(1));

    this.input = new Input();
    this.input.onSubmit = () => {
      const value = this.input.getValue().trim();
      if (value) {
        this.onSubmitCallback(value);
      }
    };
    this.addChild(this.input);

    this.addChild(new Spacer(1));
    this.addChild(new Text(theme.fg("dim", "Enter to submit • Esc back")));
    this.addChild(new Spacer(1));
    this.addChild(new DynamicBorder((s: string) => theme.fg("accent", s)));
  }

  handleInput(keyData: string): void {
    if (keyEsc(keyData) || keyData === "\u0003") {
      this.onCancelCallback();
      return;
    }
    this.input.handleInput(keyData);
  }

  override invalidate(): void {
    super.invalidate();
  }
}
