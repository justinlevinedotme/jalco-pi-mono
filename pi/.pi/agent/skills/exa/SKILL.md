---
name: exa
description: Web search, content crawling, code context lookup, company research, and deep AI research via Exa. Use when the user needs to search the web, fetch page content from a URL, find code examples or documentation, research a company, or run a deep research report on a complex topic.
---

# Exa

CLI generated from the Exa MCP server via [MCPorter](https://github.com/steipete/mcporter).

## Setup

Requires `EXA_API_KEY` environment variable to be set.

## Tools

### Web Search

Search the web for any topic. Returns clean text content from top results.

```bash
./exa web-search-exa --query "your search query"
./exa web-search-exa --query "latest news on AI" --num-results 5
./exa web-search-exa --query "breaking news" --livecrawl preferred
./exa web-search-exa --query "quick answer" --type fast
```

| Parameter | Required | Description |
|-----------|----------|-------------|
| `--query` | yes | Search query |
| `--num-results` | no | Number of results (default: 8) |
| `--livecrawl` | no | `fallback` (default) or `preferred` |
| `--type` | no | `auto` (default) or `fast` |
| `--context-max-characters` | no | Max characters for context (default: 10000) |

### Crawl Page

Get the full content of a specific webpage by URL.

```bash
./exa crawling-exa --url "https://example.com"
./exa crawling-exa --url "https://example.com/docs" --max-characters 10000
```

| Parameter | Required | Description |
|-----------|----------|-------------|
| `--url` | yes | URL to crawl |
| `--max-characters` | no | Max characters to extract (default: 3000) |

### Code Context

Find code examples, documentation, and programming solutions. Searches GitHub, Stack Overflow, and official docs.

```bash
./exa get-code-context-exa --query "React useState hook examples"
./exa get-code-context-exa --query "Express.js middleware" --tokens-num 10000
```

| Parameter | Required | Description |
|-----------|----------|-------------|
| `--query` | yes | Programming search query |
| `--tokens-num` | no | Tokens to return, 1000–50000 (default: 5000) |

### Company Research

Research a company for business information, news, and insights.

```bash
./exa company-research-exa --company-name "Anthropic"
./exa company-research-exa --company-name "Vercel" --num-results 5
```

| Parameter | Required | Description |
|-----------|----------|-------------|
| `--company-name` | yes | Company name |
| `--num-results` | no | Number of results (default: 3) |

### Deep Research

Start an AI research agent for complex topics. Takes 15 seconds to 3 minutes depending on model.

```bash
# Start research
./exa deep-researcher-start --instructions "Analyze the competitive landscape of AI coding assistants"

# Check results (use the research ID from the start command)
./exa deep-researcher-check --research-id "research_abc123"
```

**Start parameters:**

| Parameter | Required | Description |
|-----------|----------|-------------|
| `--instructions` | yes | Detailed research question |
| `--model` | no | `exa-research-fast` (default, ~15s), `exa-research` (15–45s), `exa-research-pro` (45s–3min) |

**Check parameters:**

| Parameter | Required | Description |
|-----------|----------|-------------|
| `--research-id` | yes | Research ID from `deep-researcher-start` |

Keep calling `deep-researcher-check` until status is `completed`.
