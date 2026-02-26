// server-local.ts
import { createServer, type IncomingMessage } from "http";
import { GET, POST } from "./api/mcp.js";

const PORT = Number(process.env.PORT) || 3000;
const BASE_URL = `http://localhost:${PORT}`;

function headersToRecord(headers: IncomingMessage["headers"]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    if (value !== undefined) {
      out[key] = Array.isArray(value) ? value.join(", ") : value;
    }
  }
  return out;
}

/**
 * Read request body. Returns a Buffer (not .buffer) to avoid passing a shared
 * ArrayBuffer from Node's buffer pool, which can contain garbage bytes that
 * cause "Unexpected token 'i', \"import { _\"... is not valid JSON" when the
 * MCP adapter parses the body.
 */
function readBody(req: IncomingMessage): Promise<Buffer | undefined> {
  if (req.method === "GET" || req.method === "HEAD")
    return Promise.resolve(undefined);
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(Buffer.from(chunk)));
    req.on("end", () =>
      resolve(chunks.length ? Buffer.concat(chunks) : undefined)
    );
    req.on("error", reject);
  });
}

createServer(async (req, res) => {
  const path = req.url?.split("?")[0] ?? "/";

  // Health check endpoint - returns 200 for connection testing
  if (path === "/health" || path === "/") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        status: "ok",
        message: "Meta MCP server is running",
        endpoints: { mcp: "/api/mcp", health: "/health" },
      })
    );
    return;
  }

  // Only forward MCP-related paths to the handler; reject others with 404
  const mcpPaths = ["/api/mcp", "/api/sse", "/api/message"];
  if (!mcpPaths.some((p) => path.startsWith(p))) {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found", path }));
    return;
  }

  try {
    const body = await readBody(req);
    const url = `${BASE_URL}${req.url}`;
    const handler = req.method === "POST" ? POST : GET;
    const response = await handler(
      new Request(url, {
        method: req.method ?? "GET",
        headers: headersToRecord(req.headers),
        body,
      })
    );
    res.writeHead(response.status, Object.fromEntries(response.headers.entries()));
    let responseBody: string;
    try {
      responseBody = await response.text();
    } catch {
      const buf = await response.arrayBuffer();
      responseBody = Buffer.from(buf).toString("utf8");
    }
    // Workaround: adapter sometimes returns comma-separated byte codes instead of UTF-8
    if (responseBody.match(/^\d+(,\d+)*$/) && responseBody.length > 10) {
      responseBody = String.fromCharCode(...responseBody.split(",").map(Number));
    }
    res.end(responseBody);
  } catch (err) {
    console.error("Request error:", err);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        error: "Internal Server Error",
        message: err instanceof Error ? err.message : String(err),
      })
    );
  }
})
  .on("error", (err) => {
    console.error("Server error:", err);
    process.exit(1);
  })
  .listen(PORT, () => {
    console.log(`MCP server at http://localhost:${PORT}`);
    console.log(`  Health: http://localhost:${PORT}/health`);
    console.log(`  MCP:    http://localhost:${PORT}/api/mcp`);
  });