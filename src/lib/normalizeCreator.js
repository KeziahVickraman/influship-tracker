/**
 * Helper to clean a string value; returns null if empty or non-string.
 * Never returns a placeholder.
 */
function cleanString(val) {
  if (typeof val === "string") {
    const trimmed = val.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  return null;
}

/**
 * Helper to clean a number value; returns null if not a valid number.
 */
function cleanNumber(val) {
  if (typeof val === "number" && !isNaN(val)) {
    return val;
  }
  if (typeof val === "string" && val.trim() !== "") {
    const parsed = Number(val);
    if (!isNaN(parsed)) return parsed;
  }
  return null;
}

/**
 * Helper to clean a boolean value; returns null if not boolean.
 */
function cleanBoolean(val) {
  if (typeof val === "boolean") {
    return val;
  }
  return null;
}

/**
 * Normalizes one raw Influship search result item.
 * Reads from:
 *   - creator { id, name, bio, avatar_url }
 *   - relevant_profile { platform, username, url, followers, engagement_rate, is_verified, data_updated_at }
 *   - match { score, reasons[] }
 * Falls back to primary_profile when relevant_profile is null.
 * Any missing field becomes null, never a placeholder.
 *
 * @param {any} item
 * @returns {{
 *   id: string | null,
 *   name: string | null,
 *   bio: string | null,
 *   avatarUrl: string | null,
 *   platform: string | null,
 *   username: string | null,
 *   profileUrl: string | null,
 *   followers: number | null,
 *   engagementRate: number | null,
 *   isVerified: boolean | null,
 *   updatedAt: string | null,
 *   matchScore: number | null,
 *   matchReason: string | null
 * }}
 */
export function normalizeResult(item) {
  if (!item || typeof item !== "object") {
    return {
      id: null,
      name: null,
      bio: null,
      avatarUrl: null,
      platform: null,
      username: null,
      profileUrl: null,
      followers: null,
      engagementRate: null,
      isVerified: null,
      updatedAt: null,
      matchScore: null,
      matchReason: null,
    };
  }

  // 1. Creator entity { id, name, bio, avatar_url }
  const creator = item.creator ?? (item.id || item.name || item.avatar_url || item.avatarUrl ? item : null);

  // 2. Profile entity: relevant_profile with fallback to primary_profile
  const profile = item.relevant_profile ?? item.primary_profile ?? (item.username || item.platform ? item : null);

  // 3. Match entity { score, reasons[] }
  const match = item.match ?? null;

  // id: from creator.id
  const id = cleanString(creator?.id) ?? cleanString(item.id);

  // name: from creator.name
  const name = cleanString(creator?.name) ?? cleanString(item.name);

  // bio: from creator.bio
  const bio = cleanString(creator?.bio) ?? cleanString(item.bio);

  // avatarUrl: from creator.avatar_url
  const avatarUrl =
    cleanString(creator?.avatar_url) ??
    cleanString(creator?.avatarUrl) ??
    cleanString(creator?.avatar) ??
    cleanString(creator?.profile_pic_url) ??
    cleanString(item.avatar_url) ??
    cleanString(item.avatarUrl);

  // platform: from profile.platform
  const platform = cleanString(profile?.platform) ?? cleanString(item.platform);

  // username: from profile.username
  let rawUsername = cleanString(profile?.username) ?? cleanString(item.username);
  const username = rawUsername ? rawUsername.replace(/^@/, "") : null;

  // profileUrl: from profile.url
  const profileUrl =
    cleanString(profile?.url) ??
    cleanString(profile?.profileUrl) ??
    cleanString(profile?.profile_url) ??
    cleanString(item.profileUrl) ??
    cleanString(item.url);

  // followers: from profile.followers
  const followers =
    cleanNumber(profile?.followers) ??
    cleanNumber(profile?.follower_count) ??
    cleanNumber(item.followers);

  // engagementRate: from profile.engagement_rate
  const engagementRate =
    cleanNumber(profile?.engagement_rate) ??
    cleanNumber(profile?.engagementRate) ??
    cleanNumber(profile?.engagement) ??
    cleanNumber(item.engagementRate) ??
    cleanNumber(item.engagement_rate);

  // isVerified: from profile.is_verified
  const isVerified =
    cleanBoolean(profile?.is_verified) ??
    cleanBoolean(profile?.isVerified) ??
    cleanBoolean(creator?.is_verified) ??
    cleanBoolean(creator?.verified) ??
    cleanBoolean(item.is_verified) ??
    cleanBoolean(item.isVerified);

  // updatedAt: from profile.data_updated_at
  const updatedAt =
    cleanString(profile?.data_updated_at) ??
    cleanString(profile?.updated_at) ??
    cleanString(profile?.updatedAt) ??
    cleanString(item.data_updated_at) ??
    cleanString(item.updatedAt);

  // matchScore: from match.score
  const matchScore =
    cleanNumber(match?.score) ??
    cleanNumber(item.matchScore) ??
    cleanNumber(item.score);

  // matchReason: first reason from match.reasons[]
  let matchReason = null;
  if (Array.isArray(match?.reasons) && match.reasons.length > 0) {
    const firstReason = match.reasons[0];
    if (typeof firstReason === "string" && firstReason.trim().length > 0) {
      matchReason = firstReason.trim();
    }
  } else if (typeof match?.reason === "string" && match.reason.trim().length > 0) {
    matchReason = match.reason.trim();
  } else if (typeof item.matchReason === "string" && item.matchReason.trim().length > 0) {
    matchReason = item.matchReason.trim();
  }

  return {
    id,
    name,
    bio,
    avatarUrl,
    platform,
    username,
    profileUrl,
    followers,
    engagementRate,
    isVerified,
    updatedAt,
    matchScore,
    matchReason,
  };
}

/**
 * Format engagement rate to raw value with two decimals, no % sign and no conversion.
 * Influship's units are unconfirmed.
 *
 * @param {number | null | undefined} value
 * @returns {string | null}
 */
export function formatEngagement(value) {
  if (value === null || value === undefined) return null;
  const num = Number(value);
  if (isNaN(num)) return null;
  return num.toFixed(2);
}

/**
 * Format followers compactly (e.g. 553609 → 553.6K).
 *
 * @param {number | null | undefined} value
 * @returns {string | null}
 */
export function formatFollowers(value) {
  if (value === null || value === undefined) return null;
  const num = Number(value);
  if (isNaN(num)) return null;
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

/**
 * Format match score as whole percentage (e.g. 0.92 → 92%).
 *
 * @param {number | null | undefined} value
 * @returns {string | null}
 */
export function formatMatchScore(value) {
  if (value === null || value === undefined) return null;
  const num = Number(value);
  if (isNaN(num)) return null;
  if (num <= 1 && num >= 0) {
    return `${Math.round(num * 100)}%`;
  }
  return `${Math.round(num)}%`;
}

/**
 * Format "updated X ago" from updatedAt date string.
 *
 * @param {string | null | undefined} dateStr
 * @returns {string | null}
 */
export function formatTimeAgo(dateStr) {
  if (!dateStr || typeof dateStr !== "string") return null;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return null;

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  if (diffMs < 0) return "updated recently";

  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffDay / 365);

  if (diffYear >= 1) {
    return `updated ${diffYear}y ago`;
  }
  if (diffMonth >= 1) {
    return `updated ${diffMonth}mo ago`;
  }
  if (diffDay >= 1) {
    return `updated ${diffDay}d ago`;
  }
  if (diffHour >= 1) {
    return `updated ${diffHour}h ago`;
  }
  if (diffMin >= 1) {
    return `updated ${diffMin}m ago`;
  }
  return "updated just now";
}

/**
 * Returns 1-2 character initials for avatar fallback.
 *
 * @param {string | null} name
 * @param {string | null} username
 * @returns {string}
 */
export function getInitials(name, username) {
  if (name && typeof name === "string") {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    if (parts.length === 1 && parts[0].length >= 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
  }
  if (username && typeof username === "string") {
    const clean = username.replace(/^@/, "").trim();
    if (clean.length >= 2) {
      return clean.slice(0, 2).toUpperCase();
    }
    if (clean.length === 1) {
      return clean.toUpperCase();
    }
  }
  return "?";
}
