# @pi-extensions-dev/pi-rfc-keywords-extension

Pi extension that uppercases RFC 2119 / RFC 8174 requirement keywords in user prompts.

## Behavior

- Replaces keywords case-insensitively (`must`, `Must`, `MuSt` -> `MUST`)
- Uses word boundaries, so partial words are not modified
- Prioritizes multi-word phrases first (`must not` before `must`)
- Applies to normal prompt text
- For slash commands, keeps the command token unchanged and rewrites only the arguments

## Keywords

- MUST, MUST NOT
- REQUIRED
- SHALL, SHALL NOT
- SHOULD, SHOULD NOT
- RECOMMENDED, NOT RECOMMENDED
- MAY
- OPTIONAL

## Install

```bash
pi install npm:@pi-extensions-dev/pi-rfc-keywords-extension
```

For local development:

```bash
pi -e /absolute/path/to/pi-rfc-keywords-extension/src/index.ts
```
