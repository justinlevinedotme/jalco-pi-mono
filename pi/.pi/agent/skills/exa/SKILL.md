---
name: exa
description: Web search, content crawling, code context lookup, company research, and deep AI research via Exa. Use when the user needs to search the web, fetch page content from a URL, find code examples or documentation, research a company, or run a deep research report on a complex topic.
---

# Exa

Web search, crawling, code context, and deep research via the Exa MCP server (`exa-mcp-server`).

## Setup

- **MCP server:** `exa-mcp-server` (npm, stdio transport)
- **Config:** `~/.pi/agent/mcp.json` → `mcpServers.exa`
- **Auth:** `EXA_API_KEY` in `~/.zshrc.local`, interpolated via `${EXA_API_KEY}`
- **Mode:** Proxy (accessed through the `mcp` gateway tool)

## When to Use

- Search the web for any topic
- Fetch full content from a known URL
- Find code examples, docs, and programming solutions
- Research a company
- Run deep AI research reports on complex topics

## Available Tools

Access all tools through the `mcp` gateway:

```
mcp({ server: "exa" })           # List available tools
mcp({ search: "exa" })           # Search for exa tools
mcp({ describe: "tool_name" })   # Show tool details
```

### web_search_exa (default, enabled)

Search the web for any topic. Returns clean text content from top results.

```
mcp({ tool: "web_search_exa", args: '{"query": "latest AI agent frameworks", "numResults": 5}' })
```

| Parameter | Required | Description |
|-----------|----------|-------------|
| `query` | yes | Search query |
| `numResults` | no | Number of results (default: 8) |
| `livecrawl` | no | `fallback` (default) or `preferred` |
| `type` | no | `auto` (default) or `fast` |
| `contextMaxCharacters` | no | Max characters for context (default: 10000) |

### get_code_context_exa (default, enabled)

Find code examples, documentation, and programming solutions from GitHub, Stack Overflow, and docs.

```
mcp({ tool: "get_code_context_exa", args: '{"query": "React useState hook examples", "tokensNum": 10000}' })
```

| Parameter | Required | Description |
|-----------|----------|-------------|
| `query` | yes | Programming search query |
| `tokensNum` | no | Tokens to return, 1000–50000 (default: 5000) |

### crawling_exa (default, enabled)

Get the full content of a specific webpage from a known URL.

```
mcp({ tool: "crawling_exa", args: '{"url": "https://example.com/docs"}' })
```

| Parameter | Required | Description |
|-----------|----------|-------------|
| `url` | yes | URL to crawl |
| `maxCharacters` | no | Max characters to extract (default: 3000) |

### company_research_exa (optional)

Research a company for business information, news, and insights.

| Parameter | Required | Description |
|-----------|----------|-------------|
| `companyName` | yes | Company name |
| `numResults` | no | Number of results (default: 3) |

### deep_researcher_start / deep_researcher_check (optional)

Start an AI research agent for complex topics (15s–3min depending on model).

**Start:**

| Parameter | Required | Description |
|-----------|----------|-------------|
| `instructions` | yes | Detailed research question |
| `model` | no | `exa-research-fast` (~15s), `exa-research` (15–45s), `exa-research-pro` (45s–3min) |

**Check:**

| Parameter | Required | Description |
|-----------|----------|-------------|
| `researchId` | yes | Research ID from start |

Keep calling check until status is `completed`.

## Env Vars

| Variable | Location | Description |
|----------|----------|-------------|
| `EXA_API_KEY` | `~/.zshrc.local` | Exa API key from [dashboard.exa.ai](https://dashboard.exa.ai/api-keys) |

## Troubleshooting

### Server not connecting
- Verify `EXA_API_KEY` is set: `echo $EXA_API_KEY`
- Run `source ~/.zshrc.local`
- Restart Pi
- Check: `mcp({ server: "exa" })`

### Rate limit errors (429)
- Free plan has rate limits. Ensure you're using your own API key.
- Get a key at [dashboard.exa.ai/api-keys](https://dashboard.exa.ai/api-keys)

### Tools not appearing
- Restart Pi after config changes
- Verify `~/.pi/agent/mcp.json` is valid JSON
- Try `mcp({ connect: "exa" })` to force reconnect
