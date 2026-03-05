import { Container, Editor, Spacer, Text, TUI } from "@mariozechner/pi-tui";
import type { Theme } from "@mariozechner/pi-coding-agent";
import { DynamicBorder } from "@mariozechner/pi-coding-agent";
import { esc as keyEsc } from "@howaboua/pi-howaboua-extensions-primitives-sdk";

export class TodoCreateInputComponent extends Container {
  private editor: Editor;
  private onSubmitCallback: (prompt: string) => void;
  private onCancelCallback: () => void;

  constructor(
    tui: TUI,
    theme: Theme,
    onSubmit: (prompt: string) => void,
    onCancel: () => void,
    options?: { title?: string; description?: string },
  ) {
    super();
    this.onSubmitCallback = onSubmit;
    this.onCancelCallback = onCancel;

    this.addChild(new DynamicBorder((s: string) => theme.fg("accent", s)));
    this.addChild(new Spacer(1));

    this.addChild(
      new Text(theme.fg("accent", theme.bold(options?.title || "Create New Todo")), 1, 0),
    );
    this.addChild(new Spacer(1));

    this.addChild(
      new Text(
        theme.fg(
          "muted",
          options?.description ||
            "Describe the task. The AI will read files and ask questions before creating.",
        ),
        1,
        0,
      ),
    );
    this.addChild(new Spacer(1));

    this.editor = new Editor(tui, {
      borderColor: (text) => theme.fg("accent", text),
      selectList: {
        selectedPrefix: (text) => theme.fg("accent", text),
        selectedText: (text) => theme.fg("accent", text),
        description: (text) => theme.fg("muted", text),
        scrollInfo: (text) => theme.fg("dim", text),
        noMatch: (text) => theme.fg("warning", text),
      },
    });
    this.editor.onSubmit = (value) => {
      const prompt = value.trim();
      if (prompt) this.onSubmitCallback(prompt);
    };
    this.addChild(this.editor);

    this.addChild(new Spacer(1));
    this.addChild(
      new Text(theme.fg("dim", "Enter submit • Shift/Ctrl/Alt+Enter new line • Esc back")),
    );
    this.addChild(new Spacer(1));
    this.addChild(new DynamicBorder((s: string) => theme.fg("accent", s)));
  }

  handleInput(keyData: string): void {
    if (keyEsc(keyData) || keyData === "\u0003") {
      this.onCancelCallback();
      return;
    }
    this.editor.handleInput(keyData);
  }

  override invalidate(): void {
    super.invalidate();
  }
}
