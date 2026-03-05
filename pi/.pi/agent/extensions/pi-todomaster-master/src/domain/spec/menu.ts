import type { SelectItem } from "@mariozechner/pi-tui";
import type { RalphLoopMode } from "../../core/types.js";

export function specItems(
  closed: boolean,
  assigned: boolean,
  jump: boolean,
  showView: boolean,
  ralphMode: RalphLoopMode,
): SelectItem[] {
  const onLoop = ralphMode === "ralph-loop";
  const onLinked = ralphMode === "ralph-loop-linked";
  return [
    { value: "work", label: "work", description: "Work on spec" },
    { value: "review-item", label: "review-item", description: "Review selected spec" },
    {
      value: "toggle-ralph-loop",
      label: onLoop ? "[x] ralph-loop" : "[ ] ralph-loop",
      description: onLoop ? "Disable Ralph loop mode" : "Enable Ralph loop mode",
    },
    {
      value: "toggle-ralph-loop-linked",
      label: onLinked ? "[x] ralph-linked" : "[ ] ralph-linked",
      description: onLinked ? "Disable linked Ralph loop mode" : "Enable linked Ralph loop mode",
    },
    ...(ralphMode === "off"
      ? []
      : [
          {
            value: "run-ralph-loop",
            label: "run-ralph-loop",
            description:
              ralphMode === "ralph-loop-linked"
                ? "Stage linked Ralph loop command"
                : "Stage Ralph loop command",
          },
        ]),
    ...(closed
      ? [
          { value: "reopen", label: "reopen", description: "Reopen spec" },
          { value: "delete", label: "delete", description: "Delete spec" },
        ]
      : [
          { value: "refine", label: "refine", description: "Refine spec scope" },
          { value: "complete", label: "complete", description: "Mark spec as completed" },
          { value: "abandon", label: "abandon", description: "Mark spec as abandoned" },
        ]),
    ...(closed
      ? []
      : [{ value: "attach-links", label: "attach-links", description: "Attach existing items" }]),
    ...(closed
      ? []
      : [{ value: "validate-links", label: "validate-links", description: "Validate link graph" }]),
    ...(closed ? [] : [{ value: "audit", label: "audit", description: "Audit coherence with AI" }]),
    ...(assigned
      ? []
      : [{ value: "assign", label: "assign", description: "Assign to this session" }]),
    ...(assigned
      ? [{ value: "release", label: "release", description: "Release assignment" }]
      : []),
    ...(jump
      ? [{ value: "go-to-session", label: "go-to-session", description: "Go to assigned session" }]
      : []),
    ...(showView ? [{ value: "view", label: "view", description: "View spec details" }] : []),
  ];
}
