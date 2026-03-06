# Output Patterns for Skills

Proven patterns for specifying output formats and quality standards in skills.

## Template Patterns

For generating consistent output with variable content.

### Pattern: Inline Template

Embed the template directly in the skill:

```markdown
## Output Format

Generate a function following this template:

```typescript
/**
 * {{DESCRIPTION}}
 * 
 * @param {{PARAM_NAME}} - {{PARAM_DESCRIPTION}}
 * @returns {{RETURN_DESCRIPTION}}
 */
export function {{FUNCTION_NAME}}({{PARAMETERS}}): {{RETURN_TYPE}} {
  // Implementation
  {{IMPLEMENTATION}}
}
```

**Example**:
```typescript
/**
 * Calculates the sum of two numbers
 * 
 * @param a - First number
 * @param b - Second number
 * @returns The sum of a and b
 */
export function add(a: number, b: number): number {
  return a + b;
}
```
```

### Pattern: Template in Assets

For complex templates, store in `assets/`:

```markdown
## Output Format

Use the template in `assets/api-template.ts` as the starting point.

The template includes:
- Type definitions
- Error handling patterns
- Logging setup
- Test structure

Copy and customize:
```bash
cp ~/.pi/agent/skills/my-skill/assets/api-template.ts src/api.ts
```

Then modify the placeholders:
- `{{SERVICE_NAME}}` → Your service name
- `{{ENDPOINT}}` → API endpoint path
- `{{METHOD}}` → HTTP method
```

### Pattern: Multi-File Template

For complete project structures:

```markdown
## Output Structure

Generate a project following this structure:

```
my-app/
├── src/
│   ├── index.ts        # Entry point (see assets/templates/index.ts)
│   ├── config.ts       # Configuration (see assets/templates/config.ts)
│   └── utils.ts        # Utilities (see assets/templates/utils.ts)
├── tests/
│   └── index.test.ts   # Tests (see assets/templates/test.ts)
├── package.json        # Dependencies (see assets/templates/package.json)
└── README.md           # Documentation (see assets/templates/README.md)
```

Copy all templates:
```bash
cp -r ~/.pi/agent/skills/my-skill/assets/templates/* ./my-app/
```
```

## Example Patterns

For showing expected output through concrete examples.

### Pattern: Before/After

Show input and output side-by-side:

```markdown
## Transformation

Convert verbose code to concise form.

**Before**:
```typescript
function getUserName(user) {
  if (user && user.profile && user.profile.name) {
    return user.profile.name;
  }
  return 'Anonymous';
}
```

**After**:
```typescript
const getUserName = (user) => user?.profile?.name ?? 'Anonymous';
```
```

### Pattern: Graduated Examples

Show simple to complex examples:

```markdown
## Usage Examples

### Basic Example

Simple query:
```sql
SELECT name, email FROM users WHERE active = true;
```

### Intermediate Example

With joins:
```sql
SELECT u.name, u.email, o.order_date
FROM users u
JOIN orders o ON u.id = o.user_id
WHERE u.active = true
  AND o.order_date > '2024-01-01';
```

### Advanced Example

With subqueries and aggregation:
```sql
SELECT 
  u.name,
  u.email,
  COUNT(o.id) as order_count,
  (SELECT AVG(total) FROM orders WHERE user_id = u.id) as avg_order_value
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE u.active = true
GROUP BY u.id, u.name, u.email
HAVING COUNT(o.id) > 5
ORDER BY order_count DESC;
```
```

### Pattern: Complete Real-World Example

Show a full, working example:

```markdown
## Complete Example

A real-world API client implementation:

```typescript
// File: src/api/github-client.ts

import axios from 'axios';

interface Repository {
  id: number;
  name: string;
  full_name: string;
  description: string;
  stargazers_count: number;
}

export class GitHubClient {
  private baseURL = 'https://api.github.com';
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  async getRepository(owner: string, repo: string): Promise<Repository> {
    try {
      const response = await axios.get(
        `${this.baseURL}/repos/${owner}/${repo}`,
        {
          headers: {
            Authorization: `Bearer ${this.token}`,
            Accept: 'application/vnd.github.v3+json',
          },
        }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`GitHub API error: ${error.response?.status} - ${error.message}`);
      }
      throw error;
    }
  }

  async searchRepositories(query: string, limit: number = 10): Promise<Repository[]> {
    const response = await axios.get(
      `${this.baseURL}/search/repositories`,
      {
        params: { q: query, per_page: limit },
        headers: {
          Authorization: `Bearer ${this.token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );
    return response.data.items;
  }
}

// Usage:
const client = new GitHubClient(process.env.GITHUB_TOKEN!);
const repo = await client.getRepository('facebook', 'react');
console.log(`${repo.name}: ${repo.stargazers_count} stars`);
```

This example demonstrates:
- TypeScript interfaces
- Error handling
- Environment variables
- Async/await patterns
- API authentication
```

## Quality Standard Patterns

For specifying quality criteria and validation.

### Pattern: Checklist

Explicit quality requirements:

```markdown
## Quality Standards

Generated code MUST meet these criteria:

- [ ] **TypeScript**: Fully typed, no `any`
- [ ] **Tests**: 80%+ coverage
- [ ] **Linting**: Zero ESLint errors
- [ ] **Documentation**: JSDoc for all public APIs
- [ ] **Error handling**: Try-catch for async operations
- [ ] **Logging**: Structured logging with context
- [ ] **Security**: No hardcoded credentials

Verify with:
```bash
npm run type-check  # TypeScript validation
npm test -- --coverage  # Test coverage
npm run lint  # Linting
```
```

### Pattern: Good vs Bad Examples

Show what to avoid:

```markdown
## Code Quality

### ✅ Good: Explicit Error Handling

```typescript
async function fetchUser(id: string): Promise<User> {
  try {
    const response = await fetch(`/api/users/${id}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch user:', error);
    throw new UserFetchError(`Could not fetch user ${id}`, { cause: error });
  }
}
```

### ❌ Bad: Swallowed Errors

```typescript
async function fetchUser(id: string): Promise<User | null> {
  try {
    const response = await fetch(`/api/users/${id}`);
    return await response.json();
  } catch (error) {
    return null;  // Error lost, caller can't know what went wrong
  }
}
```
```

### Pattern: Anti-Patterns

Document what NOT to do:

```markdown
## Anti-Patterns

Avoid these common mistakes:

### 1. Mutating Props

**Problem**: Directly modifying props causes unexpected behavior.

```typescript
// ❌ BAD
function updateUser(user: User) {
  user.lastSeen = new Date();  // Mutates input
  return user;
}
```

**Solution**: Create a new object.

```typescript
// ✅ GOOD
function updateUser(user: User): User {
  return {
    ...user,
    lastSeen: new Date(),
  };
}
```

### 2. Missing Null Checks

**Problem**: Accessing nested properties without validation.

```typescript
// ❌ BAD
const userName = user.profile.name;
```

**Solution**: Use optional chaining.

```typescript
// ✅ GOOD
const userName = user?.profile?.name ?? 'Anonymous';
```
```

## Format Specification Patterns

For precise output format requirements.

### Pattern: Schema Definition

Use JSON Schema or similar:

```markdown
## Output Format

Generate JSON matching this schema:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["name", "version", "dependencies"],
  "properties": {
    "name": {
      "type": "string",
      "pattern": "^[a-z0-9-]+$"
    },
    "version": {
      "type": "string",
      "pattern": "^\\d+\\.\\d+\\.\\d+$"
    },
    "dependencies": {
      "type": "object",
      "additionalProperties": {
        "type": "string"
      }
    }
  }
}
```

**Example**:
```json
{
  "name": "my-package",
  "version": "1.0.0",
  "dependencies": {
    "react": "^18.0.0",
    "typescript": "^5.0.0"
  }
}
```
```

### Pattern: Format Specification Table

Use tables for structured formats:

```markdown
## CSV Output Format

| Column | Type | Required | Description | Example |
|--------|------|----------|-------------|---------|
| id | integer | Yes | Unique identifier | 12345 |
| name | string | Yes | User full name | "John Doe" |
| email | string | Yes | Email address | "john@example.com" |
| role | enum | Yes | One of: admin, user, guest | "user" |
| created_at | ISO 8601 | Yes | Creation timestamp | "2024-03-05T12:00:00Z" |
| last_login | ISO 8601 | No | Last login timestamp | "2024-03-05T14:30:00Z" |

**Example**:
```csv
id,name,email,role,created_at,last_login
12345,"John Doe","john@example.com","user","2024-03-05T12:00:00Z","2024-03-05T14:30:00Z"
67890,"Jane Smith","jane@example.com","admin","2024-03-01T08:00:00Z","2024-03-05T09:15:00Z"
```
```

### Pattern: Markdown Structure

For documentation output:

```markdown
## Documentation Format

Generate docs following this structure:

```markdown
# [Component Name]

Brief one-line description.

## Overview

2-3 paragraph explanation of what it does and why it exists.

## Installation

```bash
npm install [package-name]
```

## Usage

### Basic Example

[Simple example with explanation]

### Advanced Example

[Complex example with explanation]

## API Reference

### [FunctionName]

**Signature**: `function(param: Type): ReturnType`

**Parameters**:
- `param` (Type): Description

**Returns**: Description of return value

**Example**:
```typescript
[code example]
```

## Common Issues

### [Issue Name]

**Problem**: Description of the problem

**Solution**: Step-by-step fix
```
```

## Validation Patterns

For verifying output meets requirements.

### Pattern: Automated Validation Script

Reference a validation script:

```markdown
## Output Validation

After generating output, validate with:

```bash
bash ~/.pi/agent/skills/my-skill/scripts/validate.sh output.json
```

The script checks:
- JSON syntax validity
- Required fields present
- Field types correct
- Value constraints satisfied

Exit code 0 = valid, non-zero = invalid with error details.
```

### Pattern: Manual Verification Steps

When automation isn't possible:

```markdown
## Verification

After generation, manually verify:

1. **Completeness**: All sections present
   - Introduction
   - Implementation
   - Tests
   - Documentation

2. **Correctness**: Logic is sound
   - Run the code
   - Check edge cases
   - Verify error handling

3. **Style**: Follows conventions
   - Naming matches project style
   - Formatting consistent
   - Comments appropriate

4. **Integration**: Works with existing code
   - No breaking changes
   - APIs compatible
   - Tests still pass
```

## Best Practices

### Be Specific

Don't say "generate good code", show what "good" means:
- ✅ "Include JSDoc with @param and @returns for all functions"
- ❌ "Document the code well"

### Use Concrete Examples

Abstract descriptions are hard to follow:
- ✅ Show a complete, working example
- ❌ "The function should handle errors appropriately"

### Provide Context

Explain why a pattern matters:
```markdown
## Error Handling

Always wrap async operations in try-catch:

```typescript
try {
  const result = await riskyOperation();
  return result;
} catch (error) {
  console.error('Operation failed:', error);
  throw new OperationError('Description', { cause: error });
}
```

**Why**: Uncaught promise rejections can crash the process. Structured errors help debugging.
```

### Make It Testable

Include ways to verify the output:
```markdown
## Testing Generated Code

After generation:

1. Run type checker: `npm run type-check`
2. Run tests: `npm test`
3. Check coverage: `npm run coverage`
4. Lint: `npm run lint`

Expected results:
- No type errors
- All tests pass
- Coverage > 80%
- No lint errors
```
