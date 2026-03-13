---
description: Refactor all markdown files in a folder into RFC 2119 + XML tag structure
---
Load the `rfc-xml-style` skill by reading its SKILL.md, then read the style guide reference it points to. You MUST have both loaded before proceeding.

Refactor all markdown files in the specified folder into RFC 2119 + XML compliant format.

<folder_path>$1</folder_path>

<workflow>
1. List all `.md` files in the folder (non-recursive unless folder is small).

2. For each file, analyze and refactor:
   - Read the file content
   - Identify sections that map to XML tags (instructions, workflows, examples, etc.)
   - Identify requirement-level language that SHOULD use RFC keywords
   - Note the file type (agent, skill, command, or general documentation)
   - Apply the transformation rules below
   - Write the refactored file back to the same path

3. Report summary of changes made to each file.
</workflow>

<transformation_rules>

## Apply XML Tags
- Wrap logical sections in appropriate tags from the style guide
- Use consistent tag naming throughout
- Nest tags for hierarchical content (max 3-4 levels)
- You MUST NOT break existing YAML frontmatter

## Apply RFC 2119 Keywords
- Convert "must/have to/need to" → MUST (if truly required)
- Convert "should/ought to" → SHOULD (if strongly recommended)
- Convert "can/may/might" → MAY (if truly optional)
- Convert "must not/cannot" → MUST NOT (if prohibited)
- Convert "should not" → SHOULD NOT (if discouraged)
- Use lowercase for non-normative casual language

## Preserve
- YAML frontmatter exactly as-is
- Code blocks and their content
- Existing links and references
- The file's original intent and meaning

</transformation_rules>
