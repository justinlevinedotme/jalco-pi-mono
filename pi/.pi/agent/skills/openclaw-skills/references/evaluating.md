# Evaluating Skill Output Quality

Structured eval workflow for testing whether a skill produces good outputs.

## Test Cases

Store in `evals/evals.json` inside the skill directory:

```json
{
  "skill_name": "my-skill",
  "evals": [
    {
      "id": 1,
      "prompt": "Realistic user message",
      "expected_output": "Description of what success looks like",
      "files": ["evals/files/input.csv"],
      "assertions": [
        "The output includes X",
        "Y is formatted correctly",
        "Z contains at least 3 items"
      ]
    }
  ]
}
```

Start with 2-3 test cases. Vary phrasing, detail, and complexity. Include edge cases.

## Running Evals

Run each test case twice: **with skill** and **without skill** (baseline).

### Workspace structure

```
my-skill-workspace/
└── iteration-1/
    ├── eval-case-name/
    │   ├── with_skill/
    │   │   ├── outputs/
    │   │   ├── timing.json
    │   │   └── grading.json
    │   └── without_skill/
    │       ├── outputs/
    │       ├── timing.json
    │       └── grading.json
    └── benchmark.json
```

Each run should start with clean context — no leftover state.

Record timing per run:
```json
{ "total_tokens": 84852, "duration_ms": 23332 }
```

## Assertions

Add after first outputs. Good assertions are verifiable:
- "The output file is valid JSON" — programmatic
- "The bar chart has labeled axes" — observable
- "The report includes at least 3 recommendations" — countable

Bad: "The output is good" (vague), "Uses exactly the phrase..." (brittle)

## Grading

Evaluate each assertion: **PASS** or **FAIL** with evidence.

```json
{
  "assertion_results": [
    { "text": "Output is valid JSON", "passed": true, "evidence": "Parsed without errors" },
    { "text": "Contains summary", "passed": false, "evidence": "No summary section found" }
  ],
  "summary": { "passed": 1, "failed": 1, "total": 2, "pass_rate": 0.5 }
}
```

## Aggregating Results

Save `benchmark.json` with mean pass rates, tokens, and time for with/without skill:

```json
{
  "run_summary": {
    "with_skill": { "pass_rate": { "mean": 0.83 }, "tokens": { "mean": 3800 } },
    "without_skill": { "pass_rate": { "mean": 0.33 }, "tokens": { "mean": 2100 } },
    "delta": { "pass_rate": 0.50, "tokens": 1700 }
  }
}
```

## Pattern Analysis

- Remove assertions that always pass in both configs (not measuring skill value)
- Investigate assertions that always fail in both (broken assertion or too hard)
- Study assertions that pass with skill but fail without (where skill adds value)
- Check time/token outliers — read execution transcripts for bottlenecks

## Iteration Loop

1. Give eval signals + current SKILL.md to an LLM → propose improvements
2. Review and apply changes
3. Rerun in new `iteration-<N+1>/` directory
4. Grade, aggregate, human review
5. Repeat until feedback is consistently empty

Guidelines for improvement:
- Generalize from feedback — don't patch for specific test cases
- Keep the skill lean — fewer, better instructions often outperform exhaustive rules
- Explain the why — "Do X because Y causes Z" > "ALWAYS do X"
- Bundle repeated work into `scripts/`
