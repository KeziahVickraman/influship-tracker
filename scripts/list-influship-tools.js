import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  const apiKey = process.env.INFLUSHIP_API_KEY || "";
  console.log("Connecting to https://mcp.influship.com/mcp with API key present:", !!apiKey);
  
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
    console.log("Connected successfully. Listing tools...");
    const toolsResult = await client.listTools();
    console.log("Found tools:", toolsResult.tools?.length || 0);
    for (const tool of toolsResult.tools || []) {
      console.log("-----------------------------------------");
      console.log("TOOL NAME:", tool.name);
      console.log("DESCRIPTION:", tool.description);
      console.log("INPUT SCHEMA:", JSON.stringify(tool.inputSchema, null, 2));
    }
  } catch (err) {
    console.error("Error listing tools:", err.message);
  } finally {
    try {
      await client.close();
    } catch {}
  }
}

main();
