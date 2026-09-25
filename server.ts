import express from "express";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import creatorsSearchHandler from "./api/creators-search.js";
import creatorHandler from "./api/creator.js";
import creatorPostsHandler from "./api/creator-posts.js";
import lookalikesHandler from "./api/lookalikes.js";
import matchHandler from "./api/match.js";
import mcpHandler from "./api/mcp.js";

dotenv.config();

async function startServer() {
  const app = express();
  // Dev server must run on port 3000 as required by the AI Studio environment
  const port = 3000;

  app.use(express.json());

  // MCP Server endpoint supporting Streamable HTTP / SSE / JSON-RPC
  app.all("/api/mcp", mcpHandler);

  // Register API routes directly using imported handlers from api/
  app.post("/api/creators-search", creatorsSearchHandler);
  app.post("/api/creator", creatorHandler);
  app.post("/api/creator-posts", creatorPostsHandler);
  app.post("/api/lookalikes", lookalikesHandler);
  app.post("/api/match", matchHandler);

  // Reject any other HTTP method on /api routes with 405
  app.all("/api/*", (req, res) => {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed. Only POST is accepted." });
  });

  // In development, mount Vite middleware
  if (process.env.NODE_ENV === "production") {
    app.use(express.static("dist"));
    app.get("*", (req, res) => {
      res.sendFile("dist/index.html", { root: "." });
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(port, "0.0.0.0", () => {
    console.log(`Server listening on http://0.0.0.0:${port}`);
  });
}

startServer();
