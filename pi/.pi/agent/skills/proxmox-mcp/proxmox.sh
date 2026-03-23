#!/bin/bash
# Thin wrapper to call proxmox-mcp tools via MCP stdio protocol
# Usage: ./proxmox.sh <tool_name> '<json_args>'
# Example: ./proxmox.sh proxmox_node '{"action":"list"}'

export PROXMOX_HOST="${PROXMOX_HOST:-pve1}"
export PROXMOX_PORT="${PROXMOX_PORT:-8006}"
export PROXMOX_USER="${PROXMOX_USER:-root@pam}"
export PROXMOX_TOKEN_NAME="${PROXMOX_TOKEN_NAME:-skill}"
export PROXMOX_TOKEN_VALUE="${PROXMOX_TOKEN_VALUE:-replace-me}"
export PROXMOX_SSL_MODE="${PROXMOX_SSL_MODE:-insecure}"
export PROXMOX_ALLOW_ELEVATED="${PROXMOX_ALLOW_ELEVATED:-true}"

TOOL="$1"
ARGS="${2:-{}}"

if [ -z "$TOOL" ]; then
  echo "Usage: proxmox.sh <tool_name> '<json_args>'"
  echo "Example: proxmox.sh proxmox_node '{\"action\":\"list\"}'"
  exit 1
fi

# Build JSON-RPC request for MCP stdio
INIT='{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"cli","version":"1.0.0"}}}'
NOTIFY='{"jsonrpc":"2.0","method":"notifications/initialized"}'
CALL="{\"jsonrpc\":\"2.0\",\"id\":2,\"method\":\"tools/call\",\"params\":{\"name\":\"$TOOL\",\"arguments\":$ARGS}}"

# Send init + notification + call via stdin, parse response
echo -e "$INIT\n$NOTIFY\n$CALL" | npx -y @bldg-7/proxmox-mcp 2>/dev/null | while IFS= read -r line; do
  # Find the response with id:2 (our tool call result)
  if echo "$line" | grep -q '"id":2'; then
    echo "$line" | node -e "
      process.stdin.on('data', d => {
        try {
          const r = JSON.parse(d);
          if (r.result?.content) {
            for (const c of r.result.content) {
              if (c.text) console.log(c.text);
            }
          } else if (r.error) {
            console.error('Error:', r.error.message);
          }
        } catch(e) { console.log(d.toString()); }
      });
    "
    break
  fi
done
