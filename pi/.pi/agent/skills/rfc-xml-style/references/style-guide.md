# RFC 2119 + XML Style Guide

## RFC 2119 Requirement Keywords

### Keyword Definitions

| Keyword | Synonyms | Meaning |
|---------|----------|---------|
| **MUST** | REQUIRED, SHALL | Absolute requirement. No exceptions. |
| **MUST NOT** | SHALL NOT | Absolute prohibition. No exceptions. |
| **SHOULD** | RECOMMENDED | Strong preference, but valid reasons MAY exist to deviate. |
| **SHOULD NOT** | NOT RECOMMENDED | Strong preference against, but behavior MAY be acceptable in particular circumstances. |
| **MAY** | OPTIONAL | Truly optional. |

### Strength Hierarchy

```
MUST > SHOULD > MAY
  │       │       │
  │       │       └── "You can if you want"
  │       └────────── "You should, unless you have good reason not to"
  └────────────────── "You have to, no exceptions"
```

### Conversion Rules

| Casual Language | RFC Keyword |
|----------------|-------------|
| must, have to, need to | MUST |
| must not, cannot (if prohibited) | MUST NOT |
| should, ought to | SHOULD |
| should not | SHOULD NOT |
| can, may, might (if optional) | MAY |

### Non-Normative Alternatives

Use lowercase when NOT making a normative statement:

| Normative (RFC 2119) | Non-Normative Alternative |
|---------------------|---------------------------|
| MUST | need to, have to, will |
| SHOULD | ought to, is expected to, is preferable |
| MAY | can, might, is allowed to |

### Usage Guidelines

- Keywords MUST only be used where actually required for interoperation or to limit harmful behavior
- Keywords MUST NOT be used to impose a particular method when it's not required
- Use sparingly — overuse dilutes their meaning
- CAPITALIZE keywords to signal RFC 2119 meaning

---

## XML Tags for LLM Prompts

### Core Syntax Rules

| Rule | Description | Example |
|------|-------------|---------|
| Case Sensitive | Tags MUST match case exactly | `<Tag>` ≠ `<tag>` |
| Must Close | All elements MUST have closing tags | `<tag>content</tag>` |
| Proper Nesting | Tags MUST close in LIFO order | `<a><b></b></a>` ✓ |
| Attributes | Use quotes for attribute values | `<tag attr="value">` |

### Tag Catalog

#### Structural Tags

| Tag | Purpose | When to Use |
|-----|---------|-------------|
| `<instructions>` | Core behavioral rules | Always — primary directive section |
| `<context>` | Background information | When agent needs domain knowledge |
| `<constraints>` | Limitations and boundaries | For safety/scope restrictions |
| `<workflow>` | Step-by-step process | For multi-step procedures |
| `<overview>` | Brief description of capability | Top of skill/prompt files |

#### Content Tags

| Tag | Purpose | When to Use |
|-----|---------|-------------|
| `<examples>` | Container for demonstrations | For few-shot learning |
| `<example>` | Single demonstration | Inside `<examples>` |
| `<input>` | Example input | Inside `<example>` |
| `<output>` | Expected output | Inside `<example>` |

#### Reasoning Tags

| Tag | Purpose | When to Use |
|-----|---------|-------------|
| `<thinking>` | Chain-of-thought reasoning | For complex analysis tasks |
| `<analysis>` | Structured examination | For breaking down problems |
| `<findings>` | Discovered issues/insights | For review/audit tasks |
| `<recommendations>` | Actionable suggestions | For advisory outputs |

#### Control Tags

| Tag | Purpose | When to Use |
|-----|---------|-------------|
| `<format>` | Output format specification | For structured outputs |
| `<guidelines>` | Soft rules and preferences | For style guidance |
| `<rules>` | Hard rules and requirements | For strict constraints |
| `<quality-checklist>` | Verification checklist | End of workflow docs |

### Best Practices

#### Naming Conventions
- Use lowercase with hyphens: `<my-tag>` or underscores: `<my_tag>`
- Make names self-descriptive
- Avoid abbreviations unless universally understood
- Use the same tag names consistently throughout

#### Nesting
- Use nested tags for hierarchical content
- Keep nesting depth reasonable (3-4 levels max)

```xml
<examples>
  <example>
    <input>User request</input>
    <output>Expected response</output>
  </example>
</examples>
```

#### Combining with RFC Keywords
- Pair XML with RFC keywords: `<instructions>The agent MUST...</instructions>`
- Use with multishot prompting: wrap examples in `<examples>`
- Reference tags in instructions: "Using the data in `<context>` tags..."

---

## Before/After Example

### Without XML Tags (Problematic)

```
You're a code reviewer. Analyze this code for bugs.
Focus on security issues. Here's an example of good
feedback: "The null check is missing on line 5."
Use this data: [code here]. Be concise.
```

Problems: Boundaries unclear, example mixed with instructions, data ambiguous.

### With XML Tags (Clear)

```xml
<instructions>
1. Analyze the code in <code> tags for security vulnerabilities
2. The agent MUST report all critical issues
3. The agent SHOULD suggest fixes for each issue found
</instructions>

<code>
[code here]
</code>

<examples>
  <example>
    <input>Unchecked user input</input>
    <output>SQL injection vulnerability at line 5</output>
  </example>
</examples>

<format>Be concise. Use bullet points.</format>
```
