# Workflow Patterns for Skills

Proven patterns for encoding multi-step processes and conditional logic in skills.

## Sequential Workflows

For processes with a clear order of steps.

### Pattern: Numbered Steps with Actions

```markdown
## Workflow

1. **Understand**: Gather requirements
   - Ask clarifying questions
   - Identify constraints
   - Review existing code

2. **Analyze**: Assess current state
   - Read relevant files
   - Identify patterns
   - Check for conflicts

3. **Implement**: Make changes
   - Create/modify files
   - Follow naming conventions
   - Preserve existing patterns

4. **Verify**: Confirm correctness
   - Run tests
   - Check for regressions
   - Validate output
```

### Pattern: Phase-Based with Substeps

```markdown
## Process

### Phase 1: Discovery

Before writing code:
- Review `references/schema.md` for data models
- Check existing implementations
- Identify dependencies

### Phase 2: Implementation

Execute in order:
1. Create test file first
2. Implement core logic
3. Add error handling
4. Update documentation

### Phase 3: Validation

Verify the implementation:
- Run: `npm test`
- Check coverage: `npm run coverage`
- Lint: `npm run lint`
```

## Conditional Workflows

For processes with branching logic or multiple paths.

### Pattern: Decision Tree

```markdown
## Which Approach?

Based on the use case:

Need real-time updates?
├─ Yes, user-initiated → WebSocket
├─ Yes, server-initiated → Server-Sent Events (SSE)
└─ No → HTTP polling or REST API

Once decided:
- WebSocket: See `references/websocket.md`
- SSE: See `references/sse.md`
- Polling: See `references/polling.md`
```

### Pattern: If/Then with Commands

```markdown
## Workflow

1. **Detect the file type**:
   - If `.pdf`: Use `scripts/extract_pdf.py`
   - If `.docx`: Use `scripts/extract_docx.py`
   - If `.txt`: Use `cat`

2. **Extract text**:
   ```bash
   # For PDF
   python scripts/extract_pdf.py input.pdf > output.txt
   
   # For DOCX
   python scripts/extract_docx.py input.docx > output.txt
   ```

3. **Process extracted text**: [continue workflow...]
```

### Pattern: Checklist with Conditions

```markdown
## Pre-Flight Checklist

Before proceeding, verify:
- [ ] API key is set (`echo $API_KEY`)
- [ ] Dependencies installed (`which curl jq`)
- [ ] Input file exists and is readable
- [ ] Output directory is writable

**If any check fails**:
- Missing API key → Prompt user for key
- Missing dependencies → Show installation command
- File issues → Report error and exit
```

## Iterative Workflows

For processes that loop or refine.

### Pattern: Implement-Test-Refine Loop

```markdown
## Iterative Development Process

Repeat until tests pass:

1. **Implement**: Write code for one feature
2. **Test**: Run test suite
   ```bash
   npm test -- --coverage
   ```
3. **Analyze**: Review failures
   - If failures → Fix and go to step 2
   - If pass → Continue to next feature

Once all tests pass:
4. **Refine**: Check code quality
5. **Document**: Update README if needed
```

### Pattern: Generate-Review-Improve

```markdown
## Documentation Generation

Iterative process:

1. **Generate draft**:
   ```bash
   scripts/generate_docs.py src/ > docs/api.md
   ```

2. **Review output**:
   - Check completeness
   - Verify examples
   - Test code snippets

3. **Improve** (if needed):
   - Add missing sections
   - Clarify confusing parts
   - Fix broken examples

4. **Validate final**:
   ```bash
   scripts/validate_docs.sh docs/api.md
   ```
```

## Validation Workflows

For verifying results and catching errors.

### Pattern: Multi-Stage Validation

```markdown
## Validation

After implementation, run all checks:

### Stage 1: Syntax
```bash
npm run lint
```
Exit if errors found.

### Stage 2: Tests
```bash
npm test
```
Exit if tests fail.

### Stage 3: Type Checking
```bash
npm run type-check
```
Exit if type errors.

### Stage 4: Manual Review
- Check console output
- Verify expected behavior
- Test edge cases
```

### Pattern: Validation with Rollback

```markdown
## Safe Deployment

1. **Create backup**:
   ```bash
   cp config.json config.json.backup
   ```

2. **Apply changes**:
   ```bash
   scripts/update_config.sh
   ```

3. **Validate**:
   ```bash
   scripts/validate_config.sh config.json
   ```

4. **On failure, rollback**:
   ```bash
   mv config.json.backup config.json
   ```

5. **On success, clean up**:
   ```bash
   rm config.json.backup
   ```
```

## Error Handling Workflows

For graceful failure and recovery.

### Pattern: Try-Catch with Fallback

```markdown
## Robust Execution

Attempt primary method, fall back if needed:

1. **Try**: Primary approach
   ```bash
   primary_command args
   ```

2. **Check result**: Examine exit code
   - Exit code 0 → Success, done
   - Exit code non-zero → Continue to fallback

3. **Fallback**: Alternative approach
   ```bash
   fallback_command args
   ```

4. **If both fail**: Report error with context
```

### Pattern: Progressive Degradation

```markdown
## Feature Detection

Adapt based on available tools:

1. **Check for optimal tool**:
   ```bash
   if command -v jq >/dev/null 2>&1; then
     # Use jq for JSON parsing
     jq '.results[]' response.json
   ```

2. **Fallback to basic tool**:
   ```bash
   else
     # Use grep/sed as fallback
     grep -o '"results":\[.*\]' response.json
   fi
   ```

Always succeed with available tools.
```

## Parallel Workflows

For concurrent operations.

### Pattern: Fork-Join

```markdown
## Parallel Processing

When order doesn't matter:

1. **Launch tasks in parallel**:
   ```bash
   process_file_a.sh input_a.txt > output_a.txt &
   process_file_b.sh input_b.txt > output_b.txt &
   process_file_c.sh input_c.txt > output_c.txt &
   ```

2. **Wait for all to complete**:
   ```bash
   wait
   ```

3. **Combine results**:
   ```bash
   cat output_*.txt > final.txt
   ```
```

## Best Practices

### Clear Entry Points

Start workflows with obvious entry points:
```markdown
## Quick Start

New to this skill? Start here:
1. Read `references/overview.md`
2. Run `scripts/setup.sh`
3. Follow the workflow below
```

### Explicit Exit Conditions

Make it clear when a workflow is complete:
```markdown
## Completion Criteria

The workflow is done when:
- [ ] All tests pass
- [ ] Documentation updated
- [ ] No lint errors
- [ ] Changes committed
```

### Link to References

Don't duplicate detailed info in workflows:
```markdown
## Step 2: Configure Database

Run the configuration script:
```bash
scripts/configure_db.sh
```

For configuration options, see `references/database.md`.
```

### Use Imperatives

Write action-oriented instructions:
- ✅ "Run the test suite"
- ✅ "Check for errors"
- ❌ "You should run the test suite"
- ❌ "The test suite can be run"

### Show Expected Output

Help verify success:
```markdown
## Step 3: Verify Installation

Run:
```bash
which my-tool
```

Expected output:
```
/usr/local/bin/my-tool
```

If not found, see Troubleshooting section.
```
