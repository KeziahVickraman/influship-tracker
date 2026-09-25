import { Creator } from "../types";

export function formatNumber(num?: number | null): string {
  if (num === undefined || num === null || isNaN(num)) return "";
  if (num >= 1_000_000_000) {
    return (num / 1_000_000_000).toFixed(1).replace(/\.0$/, "") + "B";
  }
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  }
  return num.toLocaleString();
}

export function formatPercent(num?: number | null): string {
  if (num === undefined || num === null || isNaN(num)) return "";
  // If the number is already on a 0-100 scale
  if (num > 1 || num === 1) {
    return `${num.toFixed(1).replace(/\.0$/, "")}%`;
  }
  // If given as ratio (e.g. 0.042)
  return `${(num * 100).toFixed(1).replace(/\.0$/, "")}%`;
}

export function getCreatorId(c?: Creator | null): string {
  if (!c) return "";
  return c.id || c.creator_id || "";
}

export function getCreatorName(c?: Creator | null): string {
  if (!c) return "";
  return c.name || c.full_name || c.display_name || "";
}

export function getCreatorHandle(c?: Creator | null): string {
  if (!c) return "";
  const h = c.handle || c.username || "";
  return h.replace(/^@/, "");
}

export function getCreatorAvatar(c?: Creator | null): string {
  if (!c) return "";
  return c.avatar_url || c.profile_pic_url || c.avatar || c.picture_url || c.image_url || "";
}

export function getCreatorPlatform(c?: Creator | null): string {
  if (!c) return "instagram";
  return (c.platform || "instagram").toLowerCase();
}

export function getCreatorFollowers(c?: Creator | null): number | undefined {
  if (!c) return undefined;
  const f = c.followers ?? c.follower_count ?? c.followers_count;
  return typeof f === "number" ? f : undefined;
}

export function getCreatorEngagement(c?: Creator | null): number | undefined {
  if (!c) return undefined;
  const e = c.engagement_rate ?? c.engagement ?? c.avg_engagement;
  return typeof e === "number" ? e : undefined;
}

export function getCreatorBio(c?: Creator | null): string {
  if (!c) return "";
  return c.bio || c.biography || c.description || "";
}
