import {
	type AssistantMessage,
	type AssistantMessageEvent,
	type AssistantMessageEventStream,
	createAssistantMessageEventStream,
	type Context,
	type Model,
	type SimpleStreamOptions,
	streamSimpleOpenAICompletions,
} from "@mariozechner/pi-ai";
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

type Api = "openai-completions";
type OutputBlock = AssistantMessage["content"][number];

const PROVIDER = "nvidia-nim";
const BASE_URL = "https://integrate.api.nvidia.com/v1";
const MODEL_ID = "minimaxai/minimax-m2.7";
const OPEN_TAG = "<think>";
const CLOSE_TAG = "</think>";

function normalizeLeadingJunk(text: string): string {
	return text.replace(/^\s*1\s*(?=<think>)/i, "");
}

class ThinkTagRealtimeTransformer {
	private output: AssistantMessage | null = null;
	private currentBlockIndex = -1;
	private currentMode: "text" | "thinking" = "text";
	private pending = "";
	private sawAnyVisibleOutput = false;

	constructor(private readonly stream: AssistantMessageEventStream) {}

	handle(event: AssistantMessageEvent): void {
		switch (event.type) {
			case "start":
				this.output = { ...event.partial, content: [] };
				this.stream.push({ type: "start", partial: this.output });
				return;

			case "text_start":
			case "text_end":
				return;

			case "text_delta":
				this.pending += event.delta;
				this.processPending(false);
				return;

			case "thinking_start":
			case "thinking_delta":
			case "thinking_end":
				this.forwardStructuredThinking(event);
				return;

			case "toolcall_start":
			case "toolcall_delta":
			case "toolcall_end":
				this.processPending(true);
				this.closeCurrentBlock();
				this.forwardToolCall(event);
				return;

			case "done":
				this.processPending(true);
				this.closeCurrentBlock();
				this.stream.push({
					type: "done",
					reason: event.reason,
					message: {
						...event.message,
						content: this.ensureOutput().content,
					},
				});
				this.stream.end();
				return;

			case "error":
				this.processPending(true);
				this.closeCurrentBlock();
				this.stream.push({
					type: "error",
					reason: event.reason,
					error: {
						...event.error,
						content: this.output?.content ?? event.error.content,
					},
				});
				this.stream.end();
				return;
		}
	}

	private ensureOutput(): AssistantMessage {
		if (!this.output) throw new Error("Received stream event before start");
		return this.output;
	}

	private beginBlock(type: "text" | "thinking"): void {
		const output = this.ensureOutput();
		const block: OutputBlock =
			type === "text"
				? { type: "text", text: "" }
				: { type: "thinking", thinking: "", thinkingSignature: "nvidia-nim-think-tag" };

		output.content.push(block);
		this.currentBlockIndex = output.content.length - 1;
		this.currentMode = type;

		if (type === "text") {
			this.stream.push({ type: "text_start", contentIndex: this.currentBlockIndex, partial: output });
		} else {
			this.stream.push({ type: "thinking_start", contentIndex: this.currentBlockIndex, partial: output });
		}
	}

	private closeCurrentBlock(): void {
		if (this.currentBlockIndex < 0) return;
		const output = this.ensureOutput();
		const block = output.content[this.currentBlockIndex];
		if (!block) return;

		if (block.type === "text") {
			this.stream.push({
				type: "text_end",
				contentIndex: this.currentBlockIndex,
				content: block.text,
				partial: output,
			});
		} else if (block.type === "thinking") {
			this.stream.push({
				type: "thinking_end",
				contentIndex: this.currentBlockIndex,
				content: block.thinking,
				partial: output,
			});
		}

		this.currentBlockIndex = -1;
	}

	private ensureMode(type: "text" | "thinking"): void {
		if (this.currentBlockIndex >= 0) {
			const block = this.ensureOutput().content[this.currentBlockIndex];
			if ((type === "text" && block?.type === "text") || (type === "thinking" && block?.type === "thinking")) {
				return;
			}
		}

		this.closeCurrentBlock();
		this.beginBlock(type);
	}

	private emitText(delta: string): void {
		if (!delta) return;
		const output = this.ensureOutput();
		this.ensureMode("text");
		const block = output.content[this.currentBlockIndex];
		if (block?.type !== "text") return;
		block.text += delta;
		this.sawAnyVisibleOutput = this.sawAnyVisibleOutput || delta.trim().length > 0;
		this.stream.push({ type: "text_delta", contentIndex: this.currentBlockIndex, delta, partial: output });
	}

	private emitThinking(delta: string): void {
		if (!delta) return;
		const output = this.ensureOutput();
		this.ensureMode("thinking");
		const block = output.content[this.currentBlockIndex];
		if (block?.type !== "thinking") return;
		block.thinking += delta;
		this.stream.push({ type: "thinking_delta", contentIndex: this.currentBlockIndex, delta, partial: output });
	}

	private processPending(final: boolean): void {
		while (this.pending.length > 0) {
			if (this.currentMode === "thinking") {
				const closeIdx = this.pending.toLowerCase().indexOf(CLOSE_TAG);
				if (closeIdx === -1) {
					const safeLen = final ? this.pending.length : Math.max(0, this.pending.length - CLOSE_TAG.length + 1);
					if (safeLen === 0) return;
					this.emitThinking(this.pending.slice(0, safeLen));
					this.pending = this.pending.slice(safeLen);
					return;
				}

				this.emitThinking(this.pending.slice(0, closeIdx));
				this.pending = this.pending.slice(closeIdx + CLOSE_TAG.length);
				this.closeCurrentBlock();
				this.currentMode = "text";
				continue;
			}

			const openIdx = this.pending.toLowerCase().indexOf(OPEN_TAG);
			if (openIdx === -1) {
				const safeLen = final ? this.pending.length : Math.max(0, this.pending.length - OPEN_TAG.length + 1);
				if (safeLen === 0) return;
				let textChunk = this.pending.slice(0, safeLen);
				if (!this.sawAnyVisibleOutput) {
					textChunk = normalizeLeadingJunk(textChunk);
				}
				this.emitText(textChunk);
				this.pending = this.pending.slice(safeLen);
				return;
			}

			let textBefore = this.pending.slice(0, openIdx);
			if (!this.sawAnyVisibleOutput) {
				textBefore = normalizeLeadingJunk(textBefore);
			}
			this.emitText(textBefore);
			this.pending = this.pending.slice(openIdx + OPEN_TAG.length);
			this.closeCurrentBlock();
			this.currentMode = "thinking";
		}
	}

	private forwardStructuredThinking(event: Extract<AssistantMessageEvent, { type: "thinking_start" | "thinking_delta" | "thinking_end" }>): void {
		const output = this.ensureOutput();
		if (event.type === "thinking_start") {
			this.closeCurrentBlock();
			output.content.push({ type: "thinking", thinking: "", thinkingSignature: "provider-thinking" });
			this.currentBlockIndex = output.content.length - 1;
			this.currentMode = "thinking";
			this.stream.push({ type: "thinking_start", contentIndex: this.currentBlockIndex, partial: output });
			return;
		}

		const block = output.content[this.currentBlockIndex];
		if (event.type === "thinking_delta") {
			if (block?.type === "thinking") block.thinking += event.delta;
			this.stream.push({ type: "thinking_delta", contentIndex: this.currentBlockIndex, delta: event.delta, partial: output });
			return;
		}

		if (event.type === "thinking_end") {
			this.stream.push({ type: "thinking_end", contentIndex: this.currentBlockIndex, content: event.content, partial: output });
			this.currentBlockIndex = -1;
			this.currentMode = "text";
		}
	}

	private forwardToolCall(event: Extract<AssistantMessageEvent, { type: "toolcall_start" | "toolcall_delta" | "toolcall_end" }>): void {
		const output = this.ensureOutput();
		if (event.type === "toolcall_start") {
			output.content.push({ type: "toolCall", id: "", name: "", arguments: {} });
			this.currentBlockIndex = output.content.length - 1;
			this.stream.push({ type: "toolcall_start", contentIndex: this.currentBlockIndex, partial: output });
			return;
		}

		if (event.type === "toolcall_delta") {
			this.stream.push({ type: "toolcall_delta", contentIndex: this.currentBlockIndex, delta: event.delta, partial: output });
			return;
		}

		output.content[this.currentBlockIndex] = event.toolCall;
		this.stream.push({ type: "toolcall_end", contentIndex: this.currentBlockIndex, toolCall: event.toolCall, partial: output });
		this.currentBlockIndex = -1;
		this.currentMode = "text";
	}
}

function streamCleanNvidiaNim(
	model: Model<Api>,
	context: Context,
	options?: SimpleStreamOptions,
): AssistantMessageEventStream {
	const stream = createAssistantMessageEventStream();
	const upstream = streamSimpleOpenAICompletions(model, context, options);
	const transformer = new ThinkTagRealtimeTransformer(stream);

	(async () => {
		try {
			for await (const event of upstream) {
				transformer.handle(event);
			}
		} catch (error) {
			const message: AssistantMessage = {
				role: "assistant",
				content: [],
				api: model.api,
				provider: model.provider,
				model: model.id,
				usage: {
					input: 0,
					output: 0,
					cacheRead: 0,
					cacheWrite: 0,
					totalTokens: 0,
					cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
				},
				stopReason: options?.signal?.aborted ? "aborted" : "error",
				errorMessage: error instanceof Error ? error.message : String(error),
				timestamp: Date.now(),
			};
			stream.push({ type: "error", reason: message.stopReason, error: message });
			stream.end();
		}
	})();

	return stream;
}

export default function (pi: ExtensionAPI) {
	pi.registerProvider(PROVIDER, {
		baseUrl: BASE_URL,
		apiKey: "NVIDIA_API_KEY",
		api: "openai-completions",
		compat: {
			supportsDeveloperRole: false,
			supportsReasoningEffort: false,
		},
		models: [
			{
				id: MODEL_ID,
				name: "MiniMax M2.7 (NVIDIA NIM Clean)",
				reasoning: false,
				input: ["text"],
				contextWindow: 128000,
				maxTokens: 8192,
				cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
			},
		],
		streamSimple: streamCleanNvidiaNim,
	});
}
