import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

/**
 * Call a tool on the hosted Influship MCP server.
 * Builds the client fresh on every call.
 * 
 * @param {string} toolName
 * @param {Record<string, any>} args
 * @returns {Promise<any>}
 */
export async function callInfluship(toolName, args) {
  const apiKey = process.env.INFLUSHIP_API_KEY;
  if (!apiKey) {
    throw new Error("INFLUSHIP_API_KEY is not set");
  }

  const transport = new StreamableHTTPClientTransport(
    new URL("https://mcp.influship.com/mcp"),
    {
      requestInit: {
        headers: {
          "X-API-Key": apiKey,
        },
      },
    }
  );

  const client = new Client(
    { name: "influencer-dashboard", version: "1.0.0" }
  );

  try {
    await client.connect(transport);
    const result = await client.callTool({
      name: toolName,
      arguments: args,
    });

    if (result && result.isError) {
      let detail = "tool returned an error";
      if (Array.isArray(result.content)) {
        const textItem = result.content.find((c) => c && c.type === "text");
        if (textItem && textItem.text) {
          detail = textItem.text;
        }
      }
      throw new Error(`Influship tool ${toolName} failed: ${detail}.`);
    }

    let raw = result;
    if (result && result.structuredContent !== undefined) {
      raw = result.structuredContent;
    } else if (result && Array.isArray(result.content)) {
      const textItem = result.content.find((c) => c && c.type === "text");
      if (textItem && typeof textItem.text === "string") {
        try {
          raw = JSON.parse(textItem.text);
        } catch {
          raw = textItem.text;
        }
      }
    }

    // Unwrap if nested in another structuredContent property
    if (raw && typeof raw === "object" && !Array.isArray(raw)) {
      if (raw.structuredContent && typeof raw.structuredContent === "object") {
        raw = raw.structuredContent;
      }
    }

    // Return the normalized { data, search_id, total, has_more, next_cursor, quality } object
    if (raw && typeof raw === "object" && !Array.isArray(raw)) {
      const items = Array.isArray(raw.data)
        ? raw.data
        : Array.isArray(raw.results)
        ? raw.results
        : Array.isArray(raw.creators)
        ? raw.creators
        : Array.isArray(raw.items)
        ? raw.items
        : raw.data !== undefined
        ? raw.data
        : null;

      return {
        data: items !== null ? items : (raw.data ?? []),
        search_id: raw.search_id ?? null,
        total: raw.total ?? raw.count ?? (Array.isArray(items) ? items.length : null),
        has_more: Boolean(raw.has_more),
        next_cursor: raw.next_cursor ?? raw.cursor ?? null,
        quality: raw.quality ?? null,
      };
    }

    if (Array.isArray(raw)) {
      return {
        data: raw,
        search_id: null,
        total: raw.length,
        has_more: false,
        next_cursor: null,
        quality: null,
      };
    }

    return raw;
  } catch (err) {
    // If it's already a one-sentence tool error naming the tool, rethrow
    if (err && typeof err.message === "string" && err.message.includes(`tool ${toolName}`)) {
      throw err;
    }
    const cleanMsg = err && err.message ? err.message : "unknown connection failure";
    throw new Error(`Influship tool ${toolName} failed due to ${cleanMsg}.`);
  } finally {
    try {
      await client.close();
    } catch {}
  }
}
