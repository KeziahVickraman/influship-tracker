import { z } from "zod";
import { callInfluship } from "../lib/influship.js";

const CreatorSchema = z
  .object({
    id: z.string().uuid().optional(),
    creator_id: z.string().uuid().optional(),
    platform: z.enum(["instagram"]).optional(),
    username: z.string().min(1).optional(),
    include: z.array(z.enum(["profiles"])).optional(),
  })
  .refine((data) => data.id || data.creator_id || (data.platform && data.username), {
    message: "Either id (UUID) or both platform and username must be provided.",
  });

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed. Only POST is accepted." });
  }

  const parseResult = CreatorSchema.safeParse(req.body);
  if (!parseResult.success) {
    const issues = parseResult.error.issues || [];
    const errorMsg = issues.length
      ? issues.map((e) => (e.path.length ? `${e.path.join(".")}: ${e.message}` : e.message)).join(", ")
      : parseResult.error.message || "Invalid input";
    return res.status(400).json({ error: errorMsg });
  }

  const { id, creator_id, platform, username } = parseResult.data;
  const targetId = id || creator_id;

  try {
    let data;
    if (targetId) {
      data = await callInfluship("get_creator", {
        id: targetId,
        include: ["profiles"],
      });
    } else {
      data = await callInfluship("get_profile", {
        platform,
        username,
      });
    }

    return res.status(200).json({
      data,
      source: "influship-mcp",
      fetched_at: new Date().toISOString(),
    });
  } catch (err) {
    return res.status(502).json({
      error: err.message || "Failed to fetch creator data.",
    });
  }
}
