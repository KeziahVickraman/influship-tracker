import React from "react";
import { Star, ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";
import { Creator } from "../types";
import {
  getCreatorAvatar,
  getCreatorName,
  getCreatorHandle,
  getCreatorFollowers,
  getCreatorEngagement,
  getCreatorPlatform,
  formatNumber,
  formatPercent,
} from "../utils/formatters";

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
  const avatar = getCreatorAvatar(creator);
  const name = getCreatorName(creator);
  const handle = getCreatorHandle(creator);
  const followers = getCreatorFollowers(creator);
  const engagement = getCreatorEngagement(creator);
  const platform = getCreatorPlatform(creator);
  const isVerified = creator.verified || creator.is_verified;

  return (
    <div className="group relative flex flex-col justify-between rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 shadow-sm transition-all hover:border-zinc-700 hover:bg-zinc-900 hover:shadow-md">
      <div>
        {/* Top bar: Platform badge & Star button */}
        <div className="flex items-center justify-between gap-2 mb-4">
          {platform ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-zinc-800/80 px-2 py-0.5 text-xs font-medium text-zinc-300 capitalize border border-zinc-700/50">
              {platform}
            </span>
          ) : (
            <div />
          )}

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

        {/* Creator Info */}
        <div className="flex items-start gap-3.5 mb-4">
          {avatar ? (
            <img
              src={avatar}
              alt={name || handle || "Creator avatar"}
              className="h-12 w-12 rounded-full object-cover border border-zinc-700/60 bg-zinc-800 shrink-0"
              onError={(e) => {
                // Hide avatar if image fails to load
                (e.target as HTMLElement).style.display = "none";
              }}
            />
          ) : null}

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              {name ? (
                <h3 className="truncate font-semibold text-zinc-100 text-sm sm:text-base leading-snug">
                  {name}
                </h3>
              ) : null}
              {isVerified && (
                <CheckCircle2 className="h-4 w-4 shrink-0 fill-sky-500 text-zinc-950" />
              )}
            </div>

            {handle ? (
              <p className="truncate text-xs font-medium text-zinc-400">
                @{handle}
              </p>
            ) : null}
          </div>
        </div>

        {/* Metrics Grid (only renders returned fields) */}
        {(followers !== undefined || engagement !== undefined) && (
          <div className="grid grid-cols-2 gap-2 mb-4 rounded-lg bg-zinc-950/40 p-2.5 border border-zinc-800/60">
            {followers !== undefined && (
              <div>
                <span className="block text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
                  Followers
                </span>
                <span className="text-sm font-semibold text-zinc-200">
                  {formatNumber(followers)}
                </span>
              </div>
            )}
            {engagement !== undefined && (
              <div>
                <span className="block text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
                  Engagement
                </span>
                <span className="text-sm font-semibold text-emerald-400">
                  {formatPercent(engagement)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Category or Location if present */}
        {(creator.category || creator.location) && (
          <div className="flex flex-wrap gap-1.5 mb-4 text-xs text-zinc-400">
            {creator.category && (
              <span className="rounded bg-zinc-800/60 px-1.5 py-0.5 text-zinc-400">
                {creator.category}
              </span>
            )}
            {creator.location && (
              <span className="rounded bg-zinc-800/60 px-1.5 py-0.5 text-zinc-400">
                📍 {creator.location}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 pt-2 border-t border-zinc-800/60">
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
