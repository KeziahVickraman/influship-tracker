import { z } from "zod";
import { callInfluship } from "../lib/influship.js";

const SearchSchema = z.object({
  query: z.string().min(1, "query is required").max(500),
  platforms: z.array(z.enum(["instagram"])).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  creator_kinds: z.array(z.enum(["INFLUENCER", "THEME_PAGE"])).optional(),
  min_followers: z.number().int().min(0).optional(),
  max_followers: z.number().int().min(0).optional(),
  min_engagement_rate: z.number().min(0).max(100).optional(),
  max_engagement_rate: z.number().min(0).max(100).optional(),
  verified: z.boolean().optional(),
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed. Only POST is accepted." });
  }

  const parseResult = SearchSchema.safeParse(req.body);
  if (!parseResult.success) {
    const issues = parseResult.error.issues || [];
    const errorMsg = issues.length
      ? issues.map((e) => (e.path.length ? `${e.path.join(".")}: ${e.message}` : e.message)).join(", ")
      : parseResult.error.message || "Invalid input";
    return res.status(400).json({ error: errorMsg });
  }

  try {
    const data = await callInfluship("semantic_search_creators", parseResult.data);
    return res.status(200).json({
      data,
      source: "influship-mcp",
      fetched_at: new Date().toISOString(),
    });
  } catch (err) {
    return res.status(502).json({
      error: err.message || "Influship semantic search failed.",
    });
  }
}
