import fs from "node:fs";
import path from "node:path";
import type { ExtensionAPI, ExtensionContext, InputEvent } from "@earendil-works/pi-coding-agent";

const BRAILLE_FRAMES = ["⠸", "⠴", "⠼", "⠧", "⠦", "⠏", "⠋", "⠇", "⠙", "⠹"] as const;
const STATE_KEYS = [
  "status",
  "agent",
  "agentSessionId",
  "agentSessionPath",
  "firstUserMessageBase64",
  "frozenAt",
  "autoTitleFromFirstPrompt",
  "historyBase64",
  "lastActivityAt",
  "pendingFirstPromptAutoRenamePrompt",
  "title",
] as const;

function getStateFile(): string | undefined {
  return (
    process.env.VSMUX_SESSION_STATE_FILE ||
    process.env.ZMUX_SESSION_STATE_FILE ||
    process.env.zmux_SESSION_STATE_FILE
  );
}

function readState(filePath: string): Record<string, string> {
  const state: Record<string, string> = {};
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    for (const line of raw.split(/\r?\n/g)) {
      const separatorIndex = line.indexOf("=");
      if (separatorIndex <= 0) {
        continue;
      }
      const key = line.slice(0, separatorIndex);
      const value = line.slice(separatorIndex + 1);
      state[key] = key === "firstUserMessageBase64" || key === "agentSessionPath"
        ? value.trim()
        : value.trim().replace(/\s+/g, " ");
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }
  return state;
}

function writeState(filePath: string, state: Record<string, string>): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const tempPath = filePath + ".tmp";
  fs.writeFileSync(
    tempPath,
    STATE_KEYS.map((key) => key + "=" + (state[key] || "")).join("\n") + "\n",
    "utf8",
  );
  fs.renameSync(tempPath, filePath);
}

function baseTitle(pi: ExtensionAPI, ctx: ExtensionContext): string {
  const cwd = path.basename(ctx.cwd || process.cwd());
  const session = pi.getSessionName();
  return session ? "π - " + session + " - " + cwd : "π - " + cwd;
}

function syncSessionState(pi: ExtensionAPI, ctx: ExtensionContext, updates: Record<string, string> = {}): void {
  const filePath = getStateFile();
  if (!filePath) {
    return;
  }
  const state = readState(filePath);
  state.status = updates.status || state.status || "idle";
  state.agent = "pi";
  state.agentSessionId = ctx.sessionManager.getSessionId() || state.agentSessionId || "";
  state.agentSessionPath = ctx.sessionManager.getSessionFile() || state.agentSessionPath || "";
  state.title = pi.getSessionName() || state.title || "";
  for (const [key, value] of Object.entries(updates)) {
    state[key] = value;
  }
  writeState(filePath, state);
}

function captureInput(pi: ExtensionAPI, event: InputEvent, ctx: ExtensionContext): void {
  const prompt = event.text.trim();
  if (!prompt) {
    return;
  }
  const filePath = getStateFile();
  if (!filePath) {
    return;
  }
  const state = readState(filePath);
  state.status = state.status || "idle";
  state.agent = "pi";
  state.agentSessionId = ctx.sessionManager.getSessionId() || state.agentSessionId || "";
  state.agentSessionPath = ctx.sessionManager.getSessionFile() || state.agentSessionPath || "";
  state.title = pi.getSessionName() || state.title || "";
  state.firstUserMessageBase64 =
    state.firstUserMessageBase64 || Buffer.from(prompt, "utf8").toString("base64");
  state.lastActivityAt = new Date().toISOString();
  if (!state.pendingFirstPromptAutoRenamePrompt && !/^(1|true)$/iu.test(state.autoTitleFromFirstPrompt || "")) {
    state.pendingFirstPromptAutoRenamePrompt = prompt.replace(/\s+/g, " ");
  }
  writeState(filePath, state);
}

export default function (pi: ExtensionAPI) {
  let timer: ReturnType<typeof setInterval> | undefined;
  let frameIndex = 0;

  function stopAnimation(ctx: ExtensionContext): void {
    if (timer) {
      clearInterval(timer);
      timer = undefined;
    }
    frameIndex = 0;
    ctx.ui.setTitle(baseTitle(pi, ctx));
  }

  function startAnimation(ctx: ExtensionContext): void {
    stopAnimation(ctx);
    timer = setInterval(() => {
      const frame = BRAILLE_FRAMES[frameIndex % BRAILLE_FRAMES.length];
      ctx.ui.setTitle(frame + " " + baseTitle(pi, ctx));
      frameIndex += 1;
    }, 120);
  }

  pi.on("session_start", async (_event, ctx) => {
    syncSessionState(pi, ctx);
    ctx.ui.setTitle(baseTitle(pi, ctx));
  });

  pi.on("input", async (event, ctx) => {
    captureInput(pi, event, ctx);
    return { action: "continue" };
  });

  pi.on("agent_start", async (_event, ctx) => {
    syncSessionState(pi, ctx, { status: "working", lastActivityAt: new Date().toISOString() });
    startAnimation(ctx);
  });

  pi.on("agent_end", async (_event, ctx) => {
    syncSessionState(pi, ctx, { status: "idle", lastActivityAt: new Date().toISOString() });
    stopAnimation(ctx);
  });

  pi.on("session_shutdown", async (_event, ctx) => {
    syncSessionState(pi, ctx, { status: "idle" });
    stopAnimation(ctx);
  });
}

