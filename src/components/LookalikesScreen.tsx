import React, { useEffect, useState } from "react";
import { Sparkles, Users, Loader2, AlertCircle, ArrowLeft, Search } from "lucide-react";
import { CreatorCard } from "./CreatorCard";
import { Creator, ApiResponse, ApiError } from "../types";
import {
  getCreatorAvatar,
  getCreatorName,
  getCreatorHandle,
  getCreatorId,
  getCreatorPlatform,
} from "../utils/formatters";

interface LookalikesScreenProps {
  seedCreator: Creator | null;
  onClearSeed: () => void;
  isStarred: (creator: Creator) => boolean;
  onToggleStar: (creator: Creator) => void;
  onViewDetail: (creator: Creator) => void;
  onFindSimilar: (creator: Creator) => void;
  shortlist: Creator[];
}

export const LookalikesScreen: React.FC<LookalikesScreenProps> = ({
  seedCreator,
  onClearSeed,
  isStarred,
  onToggleStar,
  onViewDetail,
  onFindSimilar,
  shortlist,
}) => {
  const [customHandle, setCustomHandle] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lookalikes, setLookalikes] = useState<Creator[] | null>(null);
  const [activeSeed, setActiveSeed] = useState<Creator | null>(seedCreator);

  // Sync activeSeed when prop changes
  useEffect(() => {
    if (seedCreator) {
      setActiveSeed(seedCreator);
      fetchLookalikes(seedCreator);
    }
  }, [seedCreator]);

  const fetchLookalikes = async (creator: Creator) => {
    setLoading(true);
    setError(null);
    setLookalikes(null);

    try {
      const creatorId = getCreatorId(creator);
      const handle = getCreatorHandle(creator);
      const platform = getCreatorPlatform(creator);

      const payload: Record<string, any> = {};

      if (creatorId && /^[0-9a-fA-F-]{36}$/.test(creatorId)) {
        payload.seed_creator_ids = [{ creator_id: creatorId }];
      } else if (handle) {
        payload.seed_profiles = [
          {
            platform: platform === "instagram" ? "instagram" : "instagram",
            username: handle,
          },
        ];
      } else {
        throw new Error("Seed creator lacks both an ID and username handle.");
      }

      const res = await fetch("/api/lookalikes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        const err = json as ApiError;
        throw new Error(err.error || `Lookalike search failed (${res.status})`);
      }

      const resData = json as ApiResponse<any>;
      const raw = resData.data;

      let list: Creator[] = [];
      if (Array.isArray(raw)) {
        list = raw;
      } else if (raw && Array.isArray(raw.results)) {
        list = raw.results;
      } else if (raw && Array.isArray(raw.lookalikes)) {
        list = raw.lookalikes;
      } else if (raw && Array.isArray(raw.data)) {
        list = raw.data;
      }

      setLookalikes(list);
    } catch (err: any) {
      setError(err.message || "Failed to find lookalike creators.");
      setLookalikes(null);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customHandle.trim().replace(/^@/, "");
    if (!trimmed) return;
    const manualSeed: Creator = {
      username: trimmed,
      handle: trimmed,
      platform: "instagram",
    };
    setActiveSeed(manualSeed);
    fetchLookalikes(manualSeed);
  };

  const seedAvatar = getCreatorAvatar(activeSeed);
  const seedName = getCreatorName(activeSeed);
  const seedHandle = getCreatorHandle(activeSeed);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900 to-zinc-950 p-6 sm:p-8">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-5 w-5 text-indigo-400" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Lookalike Creator Discovery
            </h1>
          </div>
          <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
            Find creators with matching content aesthetics, audience demographics, and engagement patterns based on seed creators from Influship.
          </p>

          {/* Active Seed Creator Banner or Handle input */}
          {activeSeed ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-indigo-500/40 bg-indigo-950/20 p-4">
              <div className="flex items-center gap-3">
                {seedAvatar ? (
                  <img
                    src={seedAvatar}
                    alt={seedName || seedHandle || "Seed creator"}
                    className="h-12 w-12 rounded-full object-cover border border-indigo-400/40 bg-zinc-800"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                ) : null}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-wider font-semibold text-indigo-300">
                      Seed Creator
                    </span>
                    <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400 capitalize">
                      {activeSeed.platform || "instagram"}
                    </span>
                  </div>
                  <h3 className="font-semibold text-white text-sm">
                    {seedName ? `${seedName} ` : ""}
                    {seedHandle ? <span className="text-zinc-400">(@{seedHandle})</span> : ""}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fetchLookalikes(activeSeed)}
                  disabled={loading}
                  className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors disabled:opacity-50"
                >
                  {loading ? "Refreshing..." : "Re-run"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveSeed(null);
                    onClearSeed();
                    setLookalikes(null);
                  }}
                  className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
                >
                  Change Seed
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <form onSubmit={handleManualSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-zinc-500 font-mono">
                    @
                  </span>
                  <input
                    type="text"
                    value={customHandle}
                    onChange={(e) => setCustomHandle(e.target.value)}
                    placeholder="Enter creator Instagram handle (e.g. fitness_coach_jane)"
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-950 py-3 pl-8 pr-4 text-sm text-zinc-100 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!customHandle.trim() || loading}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors"
                >
                  <Search className="h-4 w-4" />
                  <span>Find Lookalikes</span>
                </button>
              </form>

              {/* Quick seed picker from shortlist */}
              {shortlist.length > 0 && (
                <div>
                  <span className="text-xs text-zinc-500 uppercase tracking-wider block mb-2 font-medium">
                    Or select from your starred shortlist:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {shortlist.map((creator, idx) => {
                      const h = getCreatorHandle(creator);
                      const n = getCreatorName(creator);
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setActiveSeed(creator);
                            fetchLookalikes(creator);
                          }}
                          className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:border-zinc-700 transition-colors"
                        >
                          <Sparkles className="h-3 w-3 text-indigo-400" />
                          <span>{n || (h ? `@${h}` : "Creator")}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900/40 p-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-400 mb-3" />
          <h3 className="font-semibold text-zinc-200 text-base">
            Analyzing Lookalike Audience Graph...
          </h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm">
            Influship is evaluating content clusters, topic affinities, and follower overlap to identify similar creators.
          </p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="rounded-2xl border border-red-900/50 bg-red-950/20 p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-200 text-sm">
                Lookalike Search Error
              </h3>
              <p className="mt-1 text-xs text-red-300 font-mono leading-relaxed">
                {error}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Empty State: Initial */}
      {!activeSeed && !loading && !error && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 p-12 text-center">
          <Users className="h-10 w-10 text-zinc-600 mb-3" />
          <h3 className="font-semibold text-zinc-300 text-sm">
            Select or enter a seed creator
          </h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-md">
            Click "Find Similar" on any creator card in Discover or Detail view, or enter a handle above to discover lookalikes.
          </p>
        </div>
      )}

      {/* Empty State: Zero Results */}
      {lookalikes !== null && lookalikes.length === 0 && !loading && !error && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900/20 p-12 text-center">
          <Users className="h-8 w-8 text-zinc-500 mb-3" />
          <h3 className="font-semibold text-zinc-300 text-sm">
            No lookalikes found
          </h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm">
            Influship did not return lookalike creators for this seed. Try another creator or a more established profile.
          </p>
        </div>
      )}

      {/* Results Grid */}
      {lookalikes !== null && lookalikes.length > 0 && !loading && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-300">
              Found {lookalikes.length} Lookalike Creator{lookalikes.length === 1 ? "" : "s"}
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {lookalikes.map((creator, idx) => (
              <CreatorCard
                key={creator.id || creator.creator_id || creator.username || idx}
                creator={creator}
                isStarred={isStarred(creator)}
                onToggleStar={onToggleStar}
                onViewDetail={onViewDetail}
                onFindSimilar={onFindSimilar}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
