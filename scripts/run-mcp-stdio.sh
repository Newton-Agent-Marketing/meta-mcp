#!/usr/bin/env bash
# Run Meta Ads MCP over stdio (for use with newton-agents-sdk or any MCP client).
# Usage: run-mcp-stdio.sh
# The parent (e.g. SDK) should set META_ACCESS_TOKEN in the environment.
set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR"
if [[ ! -f build/index.js ]]; then
  echo "run-mcp-stdio.sh: build/index.js not found. Run 'npm run build' in meta-mcp." >&2
  exit 1
fi
exec node build/index.js
