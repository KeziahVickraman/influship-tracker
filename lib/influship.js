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

    if (result && result.structuredContent !== undefined) {
      return result.structuredContent;
    }

    if (result && Array.isArray(result.content)) {
      const textItem = result.content.find((c) => c && c.type === "text");
      if (textItem && typeof textItem.text === "string") {
        return JSON.parse(textItem.text);
      }
    }

    return result;
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
