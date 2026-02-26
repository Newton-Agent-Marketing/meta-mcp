#!/usr/bin/env node
/**
 * Test local MCP server connection - expects server to be running on port 3000
 * Run: npm run dev:local (in one terminal), then npm run test:local (in another)
 * Or: npm run dev:local & sleep 3 && npm run test:local
 */

const PORT = process.env.PORT || 3000;
const BASE = `http://localhost:${PORT}`;

async function test() {
  console.log("🧪 Testing local MCP server connection...\n");

  try {
    // 1. Health check
    const res = await fetch(`${BASE}/health`);
    const data = await res.json();

    if (res.status !== 200) {
      console.error("❌ Health check failed:", res.status);
      return 1;
    }
    console.log("✅ Health OK (200)");
    console.log("   ", data.message);
    console.log("   Endpoints:", data.endpoints);

    // 2. MCP JSON-RPC initialize (same as Cursor sends)
    const mcpRes = await fetch(`${BASE}/api/mcp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2024-11-05",
          capabilities: {},
          clientInfo: { name: "test", version: "1.0" },
        },
      }),
    });
    const contentType = mcpRes.headers.get("content-type") || "";
    const text = await mcpRes.text();

    let mcpData;
    if (contentType.includes("application/json")) {
      try {
        mcpData = JSON.parse(text);
      } catch (e) {
        console.error("❌ MCP response body is not valid JSON");
        console.error("   Body preview:", text.slice(0, 200));
        return 1;
      }
    } else if (contentType.includes("text/event-stream")) {
      // Parse SSE format: extract JSON from "data: {...}" lines
      const dataMatch = text.match(/data:\s*(\{.*\})/s);
      if (!dataMatch) {
        console.error("❌ Could not extract JSON from SSE response");
        return 1;
      }
      try {
        mcpData = JSON.parse(dataMatch[1]);
      } catch (e) {
        console.error("❌ MCP SSE data is not valid JSON");
        return 1;
      }
    } else {
      console.error("❌ MCP response not JSON or SSE. Content-Type:", contentType);
      return 1;
    }
    if (mcpData.error) {
      console.error("❌ MCP error:", mcpData.error);
      return 1;
    }
    console.log("✅ MCP initialize OK - valid JSON response");
    return 0;
  } catch (err) {
    console.error("❌ Connection failed:", err.message);
    console.error("   Make sure the server is running: npm run dev:local");
    return 1;
  }
}

test().then((code) => process.exit(code));
