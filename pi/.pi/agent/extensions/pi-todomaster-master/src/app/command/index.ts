import type { ExtensionAPI, ExtensionCommandContext } from "@mariozechner/pi-coding-agent";
import { getTodoCompletions } from "./completions.js";
import { blockedResponse } from "./internal.js";
import { runTodoUi } from "./ui.js";

export function registerTodoCommand(pi: ExtensionAPI) {
  pi.registerCommand("todo", {
    description: "List plan items from .pi/plans",
    getArgumentCompletions: (argumentPrefix: string) => getTodoCompletions(argumentPrefix),
    handler: async (args: string, ctx: ExtensionCommandContext) => {
      const trimmed = (args || "").trim();
      if (trimmed.startsWith("--internal")) {
        process.stdout.write(
          `${JSON.stringify({ ok: false, error: "internal mode is temporarily disabled" })}\n`,
        );
        return;
      }

      /*
      if (trimmed.startsWith("--internal")) {
        try {
          const payload = parseInternalArgs(trimmed);
          if (!payload) {
            process.stdout.write(`${blockedResponse()}\n`);
            return;
          }
          process.stdout.write(`${await runInternal(payload, ctx)}\n`);
          return;
        } catch (error) {
          const message = error instanceof Error ? error.message : "invalid internal payload";
          process.stdout.write(`${JSON.stringify({ ok: false, error: message })}\n`);
          return;
        }
      }
      */
      if (!ctx.hasUI) {
        process.stdout.write(`${blockedResponse()}\n`);
        return;
      }
      const nextPrompt = await runTodoUi(args, ctx);
      if (nextPrompt) pi.sendUserMessage(nextPrompt);
    },
  });
}
