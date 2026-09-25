import { z } from "zod";
import { callInfluship } from "../lib/influship.js";

const PostsSchema = z.object({
  platform: z.enum(["instagram"]).default("instagram"),
  username: z.string().min(1).max(50),
  creator_id: z.string().uuid().optional(),
  limit: z.number().int().min(1).max(50).optional(),
  sort: z.enum(["recent", "top_engagement", "most_likes", "most_views", "most_comments"]).optional(),
  cursor: z.string().optional(),
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed. Only POST is accepted." });
  }

  const parseResult = PostsSchema.safeParse(req.body);
  if (!parseResult.success) {
    const issues = parseResult.error.issues || [];
    const errorMsg = issues.length
      ? issues.map((e) => (e.path.length ? `${e.path.join(".")}: ${e.message}` : e.message)).join(", ")
      : parseResult.error.message || "Invalid input";
    return res.status(400).json({ error: errorMsg });
  }

  try {
    const data = await callInfluship("get_posts", parseResult.data);
    return res.status(200).json({
      data,
      source: "influship-mcp",
      fetched_at: new Date().toISOString(),
    });
  } catch (err) {
    return res.status(502).json({
      error: err.message || "Failed to fetch creator posts.",
    });
  }
}
