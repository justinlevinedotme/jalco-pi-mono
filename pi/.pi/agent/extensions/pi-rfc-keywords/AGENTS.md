# AGENTS.md

## Repository Overview

Pi extension that enforces RFC 2119 / RFC 8174 uppercase keywords in user prompt text.

## Build & Verification

- Typecheck: `npx tsc --noEmit`
- Build: `npm run build`

## Rules

 - Custom replacement configuration MUST NOT be added.
 - The replacement list MUST be fixed to RFC keywords.
 - Replacements MUST remain case-insensitive and word-boundary-safe.
