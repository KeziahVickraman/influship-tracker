import { z } from "zod";
import { callInfluship } from "../lib/influship.js";

const MatchSchema = z
  .object({
    creator_ids: z.array(z.string().uuid()).max(100).optional(),
    profiles: z
      .array(
        z.object({
          platform: z.enum(["instagram"]),
          username: z.string().min(1).max(50),
        })
      )
      .max(100)
      .optional(),
    intent_query: z.string().min(1, "intent_query is required").max(500),
    intent_context: z.string().max(2000).optional(),
  })
  .refine(
    (data) =>
      (data.creator_ids && data.creator_ids.length > 0) ||
      (data.profiles && data.profiles.length > 0),
    {
      message: "At least one candidate creator_id or profile must be provided.",
    }
  );

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed. Only POST is accepted." });
  }

  const parseResult = MatchSchema.safeParse(req.body);
  if (!parseResult.success) {
    const issues = parseResult.error.issues || [];
    const errorMsg = issues.length
      ? issues.map((e) => (e.path.length ? `${e.path.join(".")}: ${e.message}` : e.message)).join(", ")
      : parseResult.error.message || "Invalid input";
    return res.status(400).json({ error: errorMsg });
  }

  try {
    const data = await callInfluship("match_creators", parseResult.data);
    return res.status(200).json({
      data,
      source: "influship-mcp",
      fetched_at: new Date().toISOString(),
    });
  } catch (err) {
    return res.status(502).json({
      error: err.message || "Failed to match creators with campaign brief.",
    });
  }
}
