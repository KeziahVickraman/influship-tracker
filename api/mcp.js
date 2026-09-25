// api/mcp.js
// Exposes the Influship MCP server over Streamable HTTP at /api/mcp

const INFLUSHIP_MCP_URL = "https://mcp.influship.com/mcp";

/**
 * MCP Server HTTP handler.
 * Compatible with Vercel serverless functions and Express in server.ts.
 */
export default async function handler(req, res) {
  // CORS support for web and desktop MCP clients
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS, HEAD");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-API-Key, Accept, Mcp-Session-Id, Last-Event-ID"
  );
  res.setHeader("Access-Control-Expose-Headers", "Mcp-Session-Id, Content-Type");

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  // Health check / info response for plain GET requests (e.g. browser inspection)
  const acceptHeader = req.headers?.accept || "";
  if (req.method === "GET" && !acceptHeader.includes("text/event-stream")) {
    res.setHeader("Content-Type", "application/json");
    res.statusCode = 200;
    res.end(
      JSON.stringify({
        status: "ok",
        name: "influship-mcp-server",
        version: "0.1.0",
        transport: "streamable-http",
        endpoint: "/api/mcp",
        target: INFLUSHIP_MCP_URL,
      })
    );
    return;
  }

  try {
    const upstreamHeaders = {};

    // Forward relevant client headers
    for (const [key, value] of Object.entries(req.headers || {})) {
      const lower = key.toLowerCase();
      if (
        lower === "accept" ||
        lower === "content-type" ||
        lower === "mcp-session-id" ||
        lower === "authorization" ||
        lower === "x-api-key" ||
        lower === "last-event-id"
      ) {
        upstreamHeaders[key] = value;
      }
    }

    // Default accept header for MCP Streamable HTTP if missing
    if (!upstreamHeaders["accept"]) {
      upstreamHeaders["accept"] = "application/json, text/event-stream";
    }

    // Inject Influship API key if available in environment and not already provided
    const apiKey = process.env.INFLUSHIP_API_KEY;
    if (apiKey && !upstreamHeaders["x-api-key"] && !upstreamHeaders["X-API-Key"]) {
      upstreamHeaders["X-API-Key"] = apiKey;
    }

    const fetchOptions = {
      method: req.method,
      headers: upstreamHeaders,
    };

    // Forward request payload for POST / PUT / PATCH
    if (req.method !== "GET" && req.method !== "HEAD") {
      if (req.body !== undefined && req.body !== null) {
        if (typeof req.body === "string" || Buffer.isBuffer(req.body)) {
          fetchOptions.body = req.body;
        } else if (typeof req.body === "object") {
          fetchOptions.body = JSON.stringify(req.body);
          if (!upstreamHeaders["content-type"]) {
            upstreamHeaders["content-type"] = "application/json";
          }
        }
      }
    }

    // Proxy request to hosted Influship MCP endpoint
    const upstreamRes = await fetch(INFLUSHIP_MCP_URL, fetchOptions);

    // Forward upstream headers (excluding node-managed compression headers)
    for (const [key, value] of upstreamRes.headers.entries()) {
      const lower = key.toLowerCase();
      if (
        lower !== "content-encoding" &&
        lower !== "content-length" &&
        lower !== "transfer-encoding" &&
        lower !== "connection"
      ) {
        res.setHeader(key, value);
      }
    }

    res.statusCode = upstreamRes.status;

    // Stream response body back to client
    if (upstreamRes.body) {
      const reader = upstreamRes.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
    }
    res.end();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown proxy error";
    // Never expose secrets or internal details in responses
    if (!res.headersSent) {
      res.setHeader("Content-Type", "application/json");
      res.statusCode = 502;
    }
    res.end(
      JSON.stringify({
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message: `Failed to connect to Influship MCP server: ${message}`,
        },
        id: null,
      })
    );
  }
}
