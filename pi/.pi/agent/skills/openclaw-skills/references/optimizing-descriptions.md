# Optimizing Skill Descriptions

Systematic approach to testing and improving a skill's `description` for triggering accuracy.

## How Triggering Works

Agents load only `name` + `description` at startup. When a task matches, the full SKILL.md loads. The description carries the **entire burden of triggering**.

Agents typically only consult skills for tasks requiring knowledge beyond what they handle alone. Simple tasks may not trigger even with a matching description.

## Designing Trigger Eval Queries

Create ~20 queries: 8-10 should-trigger, 8-10 should-not-trigger.

```json
[
  { "query": "I've got a spreadsheet with revenue data — add a profit margin column", "should_trigger": true },
  { "query": "Convert this JSON to YAML", "should_trigger": false }
]
```

### Should-trigger queries

Vary along: phrasing (formal/casual/typos), explicitness (names domain vs describes need), detail (terse vs context-heavy), complexity (single-step vs multi-step).

Most valuable: queries where the skill helps but the connection isn't obvious.

### Should-not-trigger queries

Use **near-misses** that share keywords but need something different:
- Bad negative: "Write a fibonacci function" (obviously irrelevant)
- Good negative: "Write a Python script to upload CSV rows to Postgres" (shares CSV keyword, but task is ETL, not analysis)

## Testing

Run each query through the agent with skill installed. Check if the agent loaded the SKILL.md.

Run each query 3+ times (model is nondeterministic). Compute trigger rate.
- Should-trigger passes if trigger rate > 0.5
- Should-not-trigger passes if trigger rate < 0.5

## Train/Validation Split

Split queries 60/40 to avoid overfitting:
- **Train set (60%)**: Use to identify failures and guide changes
- **Validation set (40%)**: Only check whether improvements generalize

Keep proportional mix of positive/negative in both sets.

## Optimization Loop

1. Evaluate on both sets
2. Identify train-set failures only
3. Revise description:
   - Should-trigger failing → broaden scope or add context
   - Should-not-trigger false-firing → add specificity or boundary
   - Don't add specific keywords from failed queries (overfitting)
   - Try structural rewrites if stuck after several iterations
   - Stay under 1024 chars
4. Repeat until train set passes or improvement plateaus
5. Select iteration with best validation pass rate (may not be the last)

Five iterations is usually enough.

## Before/After Example

```yaml
# Before
description: Process CSV files.

# After
description: >
  Analyze CSV and tabular data files — compute summary statistics,
  add derived columns, generate charts, and clean messy data. Use when
  the user has a CSV, TSV, or Excel file and wants to explore,
  transform, or visualize the data, even if they don't explicitly
  mention "CSV" or "analysis."
```
