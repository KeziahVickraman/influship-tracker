import React, { useState } from "react";
import { Star, ArrowRight, Sparkles, CheckCircle2, ExternalLink, Info } from "lucide-react";
import { Creator } from "../types";
import {
  normalizeResult,
  formatFollowers,
  formatEngagement,
  formatMatchScore,
  formatTimeAgo,
  getInitials,
} from "../lib/normalizeCreator";

interface CreatorCardProps {
  creator: Creator;
  isStarred: boolean;
  onToggleStar: (creator: Creator) => void;
  onViewDetail: (creator: Creator) => void;
  onFindSimilar?: (creator: Creator) => void;
}

export const CreatorCard: React.FC<CreatorCardProps> = ({
  creator,
  isStarred,
  onToggleStar,
  onViewDetail,
  onFindSimilar,
}) => {
  const [imageFailed, setImageFailed] = useState(false);

  // Normalize the creator using the required mapping
  const normalized = normalizeResult(creator);

  const {
    name,
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
  } = normalized;

  const followersFormatted = formatFollowers(followers);
  const engagementFormatted = formatEngagement(engagementRate);
  const matchScoreFormatted = formatMatchScore(matchScore);
  const timeAgoFormatted = formatTimeAgo(updatedAt);

  return (
    <div className="group relative flex flex-col justify-between rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 shadow-sm transition-all hover:border-zinc-700 hover:bg-zinc-900 hover:shadow-md">
      <div>
        {/* Top bar: Platform badge & Match score & Star button */}
        <div className="flex items-center justify-between gap-2 mb-3.5">
          <div className="flex items-center gap-1.5">
            {platform !== null && (
              <span className="inline-flex items-center gap-1 rounded-md bg-zinc-800/90 px-2 py-0.5 text-xs font-medium text-zinc-300 capitalize border border-zinc-700/60">
                {platform}
              </span>
            )}

            {matchScoreFormatted !== null && (
              <span className="inline-flex items-center rounded-md bg-indigo-950/80 px-2 py-0.5 text-xs font-semibold text-indigo-300 border border-indigo-800/60">
                {matchScoreFormatted}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleStar(creator);
            }}
            title={isStarred ? "Remove from shortlist" : "Add to shortlist"}
            aria-label={isStarred ? "Remove from shortlist" : "Add to shortlist"}
            className={`rounded-lg p-1.5 transition-colors ${
              isStarred
                ? "bg-amber-400/10 text-amber-400 hover:bg-amber-400/20"
                : "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
            }`}
          >
            <Star className={`h-4 w-4 ${isStarred ? "fill-amber-400" : ""}`} />
          </button>
        </div>

        {/* Creator Identity: Avatar, Name, @username, Verified */}
        <div className="flex items-start gap-3.5 mb-3.5">
          {avatarUrl !== null && (
            <div className="shrink-0">
              {!imageFailed ? (
                <img
                  src={avatarUrl}
                  alt={name || username || "Creator"}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  onError={() => setImageFailed(true)}
                  className="h-12 w-12 rounded-full object-cover border border-zinc-700/60 bg-zinc-800"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-zinc-700/60 bg-zinc-800 text-xs font-bold text-zinc-300 tracking-wider select-none">
                  {getInitials(name, username)}
                </div>
              )}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              {name !== null && (
                <h3 className="truncate font-semibold text-zinc-100 text-sm sm:text-base leading-snug">
                  {name}
                </h3>
              )}
              {isVerified === true && (
                <span title="Verified creator">
                  <CheckCircle2 className="h-4 w-4 shrink-0 fill-sky-500 text-zinc-950" />
                </span>
              )}
            </div>

            {username !== null && (
              <div className="mt-0.5">
                {profileUrl !== null ? (
                  <a
                    href={profileUrl}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="truncate text-xs font-medium text-zinc-400 hover:text-indigo-400 hover:underline inline-flex items-center gap-1 max-w-full"
                    title={`Open @${username} on ${platform || "web"}`}
                  >
                    <span className="truncate">@{username}</span>
                    <ExternalLink className="h-3 w-3 shrink-0 opacity-70" />
                  </a>
                ) : (
                  <span className="truncate text-xs font-medium text-zinc-400 block">
                    @{username}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Metrics Row: Followers & Raw Engagement (only if not null) */}
        {(followersFormatted !== null || engagementFormatted !== null) && (
          <div className="grid grid-cols-2 gap-2 mb-3.5 rounded-lg bg-zinc-950/40 p-2.5 border border-zinc-800/60">
            {followersFormatted !== null && (
              <div>
                <span className="block text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
                  Followers
                </span>
                <span className="text-sm font-semibold text-zinc-200">
                  {followersFormatted}
                </span>
              </div>
            )}

            {engagementFormatted !== null && (
              <div>
                <div className="flex items-center gap-1">
                  <span className="block text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
                    Engagement
                  </span>
                  <span
                    className="inline-flex cursor-help text-zinc-500 hover:text-zinc-300"
                    title="As reported by Influship"
                    aria-label="As reported by Influship"
                  >
                    <Info className="h-3 w-3" />
                  </span>
                </div>
                <span className="text-sm font-semibold text-zinc-200">
                  {engagementFormatted}
                </span>
              </div>
            )}
          </div>
        )}

        {/* First match reason if returned */}
        {matchReason !== null && (
          <div className="mb-3.5 rounded-lg bg-zinc-950/50 p-2.5 border border-zinc-800/50">
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-indigo-400 mb-1">
              Match Reason
            </span>
            <p className="text-xs text-zinc-300 leading-relaxed italic line-clamp-2">
              "{matchReason}"
            </p>
          </div>
        )}

        {/* Updated time ago if present */}
        {timeAgoFormatted !== null && (
          <div className="mb-3">
            <span className="text-[11px] text-zinc-500 block">
              {timeAgoFormatted}
            </span>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 pt-2.5 border-t border-zinc-800/60">
        <button
          type="button"
          onClick={() => onViewDetail(creator)}
          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-700 hover:text-white transition-colors"
        >
          <span>View Profile</span>
          <ArrowRight className="h-3 w-3" />
        </button>

        {onFindSimilar && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onFindSimilar(creator);
            }}
            title="Find lookalikes"
            className="inline-flex items-center justify-center gap-1 rounded-lg border border-zinc-700/60 bg-transparent px-2.5 py-1.5 text-xs font-medium text-indigo-400 hover:bg-indigo-950/40 hover:border-indigo-600/50 transition-colors"
          >
            <Sparkles className="h-3 w-3" />
            <span className="hidden sm:inline">Similar</span>
          </button>
        )}
      </div>
    </div>
  );
};
