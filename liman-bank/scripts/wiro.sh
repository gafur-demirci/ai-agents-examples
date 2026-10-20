#!/bin/zsh
# Calls a Wiro MCP tool and prints the SSE data payload lines (one JSON per line).
# Usage: wiro.sh <tool_name> <arguments_json>
set -a; source "$(dirname "$0")/../.env"; set +a
NAME="$1"; ARGS="$2"
BODY=$(printf '{"jsonrpc":"2.0","id":10,"method":"tools/call","params":{"name":"%s","arguments":%s}}' "$NAME" "$ARGS")
curl -sS -m 120 https://mcp.wiro.ai/v1 \
  -H "Authorization: Bearer $WIRO_API_KEY:$WIRO_API_SECRET" \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  --data "$BODY" | grep '^data: ' | sed 's/^data: //'
