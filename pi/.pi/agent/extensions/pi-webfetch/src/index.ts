import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { keyHint } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";
import { StringEnum } from "@mariozechner/pi-ai";
import { Text } from "@mariozechner/pi-tui";
import TurndownService from "turndown";
import {
  truncateHead,
  DEFAULT_MAX_BYTES,
  DEFAULT_MAX_LINES,
  formatSize,
} from "@mariozechner/pi-coding-agent";

const MAX_RESPONSE_SIZE = 5 * 1024 * 1024; // 5MB
const DEFAULT_TIMEOUT = 30 * 1000; // 30 seconds
const MAX_TIMEOUT = 120 * 1000; // 2 minutes

const DESCRIPTION = `- Fetches content from a specified URL
- Takes a URL and optional format as input
- Fetches the URL content, converts to requested format (markdown by default)
- Returns the content in the specified format
- Use this tool when you need to retrieve and analyze web content

Usage notes:
  - IMPORTANT: if another tool is present that offers better web fetching capabilities, is more targeted to the task, or has fewer restrictions, prefer using that tool instead of this one.
  - The URL must be a fully-formed valid URL
  - HTTP URLs will be automatically upgraded to HTTPS
  - Format options: "markdown" (default), "text", or "html"
  - This tool is read-only and does not modify any files
  - Results may be summarized if the content is very large`;

function stripDataImageUris(input: string): string {
  const marker = "(data:image";
  const lower = input.toLowerCase();
  let out = "";
  let index = 0;

  while (index < input.length) {
    const start = lower.indexOf(marker, index);
    if (start === -1) {
      out += input.slice(index);
      break;
    }

    out += input.slice(index, start);
    const close = input.indexOf(")", start + marker.length);
    if (close === -1) {
      out += "(data:image omitted)";
      break;
    }

    out += "(data:image omitted)";
    index = close + 1;
  }

  return out;
}

export default function (pi: ExtensionAPI) {
  pi.registerTool({
    name: "webfetch",
    label: "Web Fetch",
    description: DESCRIPTION,
    parameters: Type.Object({
      url: Type.String({ description: "The URL to fetch content from" }),
      format: Type.Optional(
        StringEnum(["text", "markdown", "html"] as const, {
          description:
            "The format to return the content in (text, markdown, or html). Defaults to markdown.",
          default: "markdown",
        }),
      ),
      timeout: Type.Optional(Type.Number({ description: "Optional timeout in seconds (max 120)" })),
    }),
    renderResult(result, options, theme) {
      const textBlock = result.content.find((item) => item.type === "text");
      if (!textBlock || textBlock.type !== "text") {
        return new Text("", 0, 0);
      }

      const lines = textBlock.text.split("\n");
      const details = result.details as { url?: string } | undefined;
      if (!options.expanded) {
        const summary = details?.url
          ? `${theme.fg("toolTitle", theme.bold("webfetch"))} ${theme.fg("accent", details.url)}`
          : theme.fg("toolTitle", theme.bold("webfetch"));
        const status = theme.fg("muted", `(${lines.length} lines, ${keyHint("expandTools", "to expand output")})`);
        return new Text(`${summary}\n${status}`, 0, 0);
      }

      return new Text(lines.map((line) => theme.fg("toolOutput", line)).join("\n"), 0, 0);
    },
    async execute(toolCallId, params, signal, onUpdate, ctx) {
      const url = params.url.startsWith("http://")
        ? params.url.replace("http://", "https://")
        : params.url;
      const format = params.format ?? "markdown";

      // Validate URL
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        throw new Error("URL must start with http:// or https://");
      }

      const timeoutValue = Math.min((params.timeout ?? DEFAULT_TIMEOUT / 1000) * 1000, MAX_TIMEOUT);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutValue);

      // Build Accept header based on requested format
      let acceptHeader = "*/*";
      switch (format) {
        case "markdown":
          acceptHeader =
            "text/markdown;q=1.0, text/x-markdown;q=0.9, text/plain;q=0.8, text/html;q=0.7, */*;q=0.1";
          break;
        case "text":
          acceptHeader = "text/plain;q=1.0, text/markdown;q=0.9, text/html;q=0.8, */*;q=0.1";
          break;
        case "html":
          acceptHeader =
            "text/html;q=1.0, application/xhtml+xml;q=0.9, text/plain;q=0.8, text/markdown;q=0.7, */*;q=0.1";
          break;
      }

      const fetchSignal = signal ? AbortSignal.any([controller.signal, signal]) : controller.signal;
      const headers = {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36",
        Accept: acceptHeader,
        "Accept-Language": "en-US,en;q=0.9",
      };

      try {
        let response = await fetch(url, { signal: fetchSignal, headers });

        // Retry with honest UA if blocked by Cloudflare bot detection
        if (response.status === 403 && response.headers.get("cf-mitigated") === "challenge") {
          response = await fetch(url, {
            signal: fetchSignal,
            headers: { ...headers, "User-Agent": "pi-extension" },
          });
        }

        if (!response.ok) {
          throw new Error(`Request failed with status code: ${response.status}`);
        }

        // Check content length
        const contentLength = response.headers.get("content-length");
        if (contentLength && parseInt(contentLength) > MAX_RESPONSE_SIZE) {
          throw new Error("Response too large (exceeds 5MB limit)");
        }
        const arrayBuffer = await response.arrayBuffer();
        clearTimeout(timeoutId);
        if (arrayBuffer.byteLength > MAX_RESPONSE_SIZE) {
          throw new Error("Response too large (exceeds 5MB limit)");
        }

        const content = new TextDecoder().decode(arrayBuffer);
        const contentType = response.headers.get("content-type") || "";

        let output = content;

        // Handle content based on requested format and actual content type
        if (format === "markdown" && contentType.includes("text/html")) {
          output = convertHTMLToMarkdown(content);
        }
        if (format === "text" && contentType.includes("text/html")) {
          output = await extractTextFromHTML(content);
        }

        const cleaned = stripDataImageUris(output);
        const truncation = truncateHead(cleaned, {
          maxLines: DEFAULT_MAX_LINES,
          maxBytes: DEFAULT_MAX_BYTES,
        });

        let resultText = truncation.content;
        if (truncation.truncated) {
          resultText += `\n\n[Output truncated: ${truncation.outputLines} of ${truncation.totalLines} lines`;
          resultText += ` (${formatSize(truncation.outputBytes)} of ${formatSize(truncation.totalBytes)}).`;
          resultText += ` Use a more specific tool or request a different format if needed.]`;
        }

        return {
          content: [{ type: "text", text: resultText }],
          details: {
            url,
            contentType,
            format,
            truncated: truncation.truncated,
            totalBytes: truncation.totalBytes,
          },
        };
      } catch (error: any) {
        clearTimeout(timeoutId);
        if (error.name === "AbortError") {
          throw new Error("Request timed out or was cancelled");
        }
        throw error;
      }
    },
  });
}

async function extractTextFromHTML(html: string) {
  let text = "";
  let depth = 0;
  const tags = ["script", "style", "noscript", "iframe", "object", "embed"];
  // @ts-expect-error - HTMLRewriter is available in Bun
  const rewriter = new HTMLRewriter()
    .on("*", {
      element(element) {
        if (tags.includes(element.tagName)) {
          depth++;
          element.onEndTag(() => {
            depth--;
          });
        }
      },
      text(input) {
        if (depth === 0) {
          text += input.text;
        }
      },
    })
    .transform(new Response(html));
  return text.trim();
}

function convertHTMLToMarkdown(html: string): string {
  const turndown = new TurndownService({
    headingStyle: "atx",
    hr: "---",
    bulletListMarker: "-",
    codeBlockStyle: "fenced",
    emDelimiter: "*",
  });
  turndown.remove(["script", "style", "meta", "link"]);
  return turndown.turndown(html);
}
