/**
 * Minimal Vercel-themed header with resource counts
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { VERSION } from "@mariozechner/pi-coding-agent";

export default function (pi: ExtensionAPI) {
  let counts = { skills: 0, tools: 0 };

  pi.on("session_start", async (_event, ctx) => {
    const commands = pi.getCommands();
    counts.skills = commands.filter((c) => c.source === "skill").length;
    counts.tools = pi.getAllTools().length;

    if (ctx.hasUI) {
      ctx.ui.setHeader((_tui, theme) => ({
        render(_width: number): string[] {
          const triangle = theme.fg("accent", "▲");
          const ver = theme.fg("dim", `v${VERSION}`);
          const sep = theme.fg("dim", "·");
          const stat = (n: number, label: string) =>
            theme.fg("dim", `${n} ${label}`);

          return [
            "",
            `  ${triangle} pi ${ver}  ${sep}  ${stat(counts.skills, "skills")}  ${sep}  ${stat(counts.tools, "tools")}`,
            "",
          ];
        },
        invalidate() {},
      }));
    }
  });
}
