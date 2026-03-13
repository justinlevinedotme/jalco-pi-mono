/**
 * Git Push Gate Extension
 *
 * Requires explicit user permission every time the AI attempts to push to git.
 * Intercepts bash commands containing `git push` and prompts for confirmation.
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

export default function (pi: ExtensionAPI) {
	const gitPushPatterns = [
		/\bgit\s+push\b/i,
		/\bgh\s+pr\s+push\b/i,
	];

	pi.on("tool_call", async (event, ctx) => {
		if (event.toolName !== "bash") return undefined;

		const command = event.input.command as string;
		const isPush = gitPushPatterns.some((p) => p.test(command));

		if (!isPush) return undefined;

		if (!ctx.hasUI) {
			return { block: true, reason: "Git push blocked (no UI for confirmation)" };
		}

		const choice = await ctx.ui.select(
			`🚀 Git push detected:\n\n  ${command}\n\nAllow this push?`,
			["Yes, push", "No, block it"],
		);

		if (choice !== "Yes, push") {
			return { block: true, reason: "Git push blocked by user" };
		}

		return undefined;
	});
}
