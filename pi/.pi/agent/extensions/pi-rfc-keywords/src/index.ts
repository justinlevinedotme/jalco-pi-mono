import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

const RFC_KEYWORDS: Record<string, string> = {
  "must not": "MUST NOT",
  "shall not": "SHALL NOT",
  "should not": "SHOULD NOT",
  "not recommended": "NOT RECOMMENDED",
  must: "MUST",
  required: "REQUIRED",
  shall: "SHALL",
  should: "SHOULD",
  recommended: "RECOMMENDED",
  may: "MAY",
  optional: "OPTIONAL",
};

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function applyRfcKeywordReplacements(text: string): string {
  let result = text;
  const keys = Object.keys(RFC_KEYWORDS).sort((a, b) => b.length - a.length);

  for (const key of keys) {
    const replacement = RFC_KEYWORDS[key];
     const pattern = new RegExp(`(?<!\\p{L})${escapeRegex(key)}(?!\\p{L})`, "giu");
    result = result.replace(pattern, replacement);
  }

  return result;
}

export default function rfcKeywordsExtension(pi: ExtensionAPI): void {
  pi.on("input", (event) => {
    if (!event.text) return { action: "continue" as const };

     let textToProcess = event.text;
     let prefix = "";

     if (textToProcess.startsWith("/")) {
       const spaceIndex = textToProcess.indexOf(" ");
       if (spaceIndex === -1) return { action: "continue" as const };

       prefix = textToProcess.slice(0, spaceIndex + 1);
       textToProcess = textToProcess.slice(spaceIndex + 1);
     }

     const transformedText = applyRfcKeywordReplacements(textToProcess);

     if (transformedText === textToProcess) {
       return { action: "continue" as const };
     }

     return { action: "transform" as const, text: `${prefix}${transformedText}` };
  });
}
