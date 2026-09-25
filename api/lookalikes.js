import { z } from "zod";
import { callInfluship } from "../lib/influship.js";

const LookalikeSchema = z
  .object({
    seed_creator_ids: z
      .array(
        z.object({
          creator_id: z.string().uuid(),
          weight: z.number().min(0).max(1).optional(),
        })
      )
      .max(10)
      .optional(),
    seed_profiles: z
      .array(
        z.object({
          platform: z.enum(["instagram"]),
          username: z.string().min(1).max(50),
          weight: z.number().min(0).max(1).optional(),
        })
      )
      .max(10)
      .optional(),
    limit: z.number().int().min(1).max(100).optional(),
    cursor: z.string().optional(),
    min_followers: z.number().int().min(0).optional(),
    max_followers: z.number().int().min(0).optional(),
    min_engagement_rate: z.number().min(0).max(100).optional(),
    max_engagement_rate: z.number().min(0).max(100).optional(),
    verified: z.boolean().optional(),
  })
  .refine(
    (data) =>
      (data.seed_creator_ids && data.seed_creator_ids.length > 0) ||
      (data.seed_profiles && data.seed_profiles.length > 0),
    {
      message: "At least one seed creator ID or seed profile must be provided.",
    }
  );

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed. Only POST is accepted." });
  }

  const parseResult = LookalikeSchema.safeParse(req.body);
  if (!parseResult.success) {
    const issues = parseResult.error.issues || [];
    const errorMsg = issues.length
      ? issues.map((e) => (e.path.length ? `${e.path.join(".")}: ${e.message}` : e.message)).join(", ")
      : parseResult.error.message || "Invalid input";
    return res.status(400).json({ error: errorMsg });
  }

  try {
    const data = await callInfluship("find_lookalike_creators", parseResult.data);
    return res.status(200).json({
      data,
      source: "influship-mcp",
      fetched_at: new Date().toISOString(),
    });
  } catch (err) {
    return res.status(502).json({
      error: err.message || "Failed to find lookalike creators.",
    });
  }
}
