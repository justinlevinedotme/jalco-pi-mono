import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

// State persists across re-initializations (module-level)
const disabledSkills = new Set<string>();

/** Strip the "skill:" prefix that getCommands() adds to skill names. */
function bareSkillName(name: string): string {
  return name.replace(/^skill:/, "");
}

export default function (pi: ExtensionAPI) {
  // 1. Filter disabled skills out of the system prompt before each LLM call
  pi.on("before_agent_start", async (event, ctx) => {
    if (disabledSkills.size === 0) return undefined;

    let { systemPrompt } = event;
    if (!systemPrompt) return undefined;

    const startTag = "<available_skills>";
    const endTag = "</available_skills>";
    const startIndex = systemPrompt.indexOf(startTag);
    const endIndex = systemPrompt.indexOf(endTag);

    if (startIndex === -1 || endIndex === -1) return undefined;

    let skillsBlock = systemPrompt.substring(startIndex + startTag.length, endIndex);

    // Remove each <skill>…</skill> whose <name> is in the disabled set
    skillsBlock = skillsBlock.replace(/(\s*<skill>[\s\S]*?<\/skill>)/gi, (match) => {
      const nameMatch = match.match(/<name>(.*?)<\/name>/i);
      if (nameMatch?.[1]) {
        const name = nameMatch[1].trim();
        if (disabledSkills.has(name)) {
          return ""; // strip this block
        }
      }
      return match;
    });

    // Reconstruct prompt — only the <available_skills> region is touched
    systemPrompt =
      systemPrompt.substring(0, startIndex + startTag.length) +
      skillsBlock +
      systemPrompt.substring(endIndex);

    // Notification: show remaining skill names (scoped to <available_skills> only)
    const remaining = [...skillsBlock.matchAll(/<name>(.*?)<\/name>/gi)].map((m) => m[1]);
    if (remaining.length > 0) {
      ctx.ui.notify(`Active skills: ${remaining.join(", ")}`, "info");
    } else {
      ctx.ui.notify("All skills disabled — none in prompt", "warning");
    }

    return { systemPrompt };
  });

  // 2. Block /skill:<name> invocation for disabled skills
  pi.on("input", async (event, ctx) => {
    if (!event.text.startsWith("/skill:")) return { action: "continue" };

    // "/skill:commit some args" → "commit"
    const skillName = event.text.slice(7).split(/\s/)[0];

    if (disabledSkills.has(skillName)) {
      ctx.ui.notify(`Skill '${skillName}' is currently disabled.`, "warning");
      return { action: "handled" };
    }
    return { action: "continue" };
  });

  // 3. /skills command — interactive toggle UI
  pi.registerCommand("skills", {
    description: "Manage enabled skills for the current session",
    handler: async (_args, ctx) => {
      const piAny = pi as any;
      if (typeof piAny.getCommands !== "function") {
        ctx.ui.notify("pi.getCommands() not available — update Pi.", "error");
        return;
      }

      // getCommands() returns names like "skill:commit"; strip the prefix so
      // the set entries match the <name> tags in the system prompt XML.
      const allSkills = (piAny.getCommands() as any[])
        .filter((c: any) => c.source === "skill")
        .map((c: any) => ({
          name: bareSkillName(c.name),
          description: c.description || "No description",
        }))
        .sort((a: any, b: any) => a.name.localeCompare(b.name));

      if (allSkills.length === 0) {
        ctx.ui.notify("No skills discovered.", "info");
        return;
      }

      const updateStatus = () => {
        const activeCount = allSkills.filter((s: any) => !disabledSkills.has(s.name)).length;
        if (activeCount < allSkills.length) {
          ctx.ui.setStatus("skills-perms", `Skills: ${activeCount}/${allSkills.length} active`);
        } else {
          ctx.ui.setStatus("skills-perms", undefined);
        }
      };

      while (true) {
        const activeCount = allSkills.filter((s: any) => !disabledSkills.has(s.name)).length;

        const options = [
          ...allSkills.map((s: any) => {
            const enabled = !disabledSkills.has(s.name);
            return `${enabled ? "✅" : "❌"} ${s.name}`;
          }),
          "---",
          "Enable All",
          "Disable All",
          "Done",
        ];

        const choice = await ctx.ui.select(`Manage Skills (${activeCount} enabled)`, options);

        if (!choice || choice === "Done") break;

        if (choice === "Enable All") {
          disabledSkills.clear();
          ctx.ui.notify("All skills enabled", "info");
        } else if (choice === "Disable All") {
          for (const s of allSkills) disabledSkills.add(s.name);
          ctx.ui.notify("All skills disabled", "warning");
        } else if (choice !== "---") {
          const skillName = choice.replace(/^[✅❌]\s*/, "").trim();
          if (disabledSkills.has(skillName)) {
            disabledSkills.delete(skillName);
            ctx.ui.notify(`Enabled: ${skillName}`, "info");
          } else {
            disabledSkills.add(skillName);
            ctx.ui.notify(`Disabled: ${skillName}`, "warning");
          }
        }
        updateStatus();
      }
    },
  });

  pi.on("session_start", (_event, ctx) => {
    if (ctx.hasUI) {
      ctx.ui.notify("Skills Permissions loaded. Use /skills to manage.", "info");
    }
  });
}
