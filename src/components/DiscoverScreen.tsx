import React, { useState, useMemo } from "react";
import { Search, SlidersHorizontal, Loader2, AlertCircle, Compass, X } from "lucide-react";
import { CreatorCard } from "./CreatorCard";
import { Creator, ApiResponse, ApiError } from "../types";
import { normalizeResult } from "../lib/normalizeCreator";

interface DiscoverScreenProps {
  isStarred: (creator: Creator) => boolean;
  onToggleStar: (creator: Creator) => void;
  onViewDetail: (creator: Creator) => void;
  onFindSimilar: (creator: Creator) => void;
}

const PRESET_QUERIES = [
  "Sustainable eco-friendly travel creators in Europe",
  "Plant-based meal prep and vegan nutrition coaches",
  "Tech gadget reviewers and productivity setup creators",
  "Boutique skincare and minimalist beauty routines",
];

const PLATFORMS = [
  { id: "all", label: "All Platforms" },
  { id: "instagram", label: "Instagram" },
  { id: "tiktok", label: "TikTok" },
  { id: "youtube", label: "YouTube" },
];

export const DiscoverScreen: React.FC<DiscoverScreenProps> = ({
  isStarred,
  onToggleStar,
  onViewDetail,
  onFindSimilar,
}) => {
  const [query, setQuery] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all");
  const [minFollowers, setMinFollowers] = useState<string>("");
  const [maxFollowers, setMaxFollowers] = useState<string>("");
  const [showFilters, setShowFilters] = useState<boolean>(false);

  // Search state
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<any[] | null>(null);

  // Pagination and metadata state
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [quality, setQuality] = useState<{ mode?: string; reason?: string } | null>(null);
  const [activePlatformFilter, setActivePlatformFilter] = useState<string>("all");
  const [lastSubmittedQuery, setLastSubmittedQuery] = useState<string>("");
  const [lastMinFollowers, setLastMinFollowers] = useState<string>("");
  const [lastMaxFollowers, setLastMaxFollowers] = useState<string>("");

  // Handle initial search submit (runs on submit only, never on keystroke)
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    setResults(null);
    setHasMore(false);
    setNextCursor(null);
    setQuality(null);

    // Save submitted search params for pagination
    setLastSubmittedQuery(trimmed);
    setActivePlatformFilter(selectedPlatform);
    setLastMinFollowers(minFollowers);
    setLastMaxFollowers(maxFollowers);

    try {
      const payload: Record<string, any> = {
        query: trimmed,
      };

      // Platform filter: pass using parameter name from inputSchema ('platforms')
      if (selectedPlatform === "instagram") {
        payload.platforms = ["instagram"];
      }

      const parsedMin = parseInt(minFollowers, 10);
      if (!isNaN(parsedMin) && parsedMin >= 0) {
        payload.min_followers = parsedMin;
      }

      const parsedMax = parseInt(maxFollowers, 10);
      if (!isNaN(parsedMax) && parsedMax >= 0) {
        payload.max_followers = parsedMax;
      }

      const response = await fetch("/api/creators-search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const json = await response.json();

      if (!response.ok) {
        const errorData = json as ApiError;
        throw new Error(errorData.error || `Search failed with status ${response.status}`);
      }

      // Unwrapped response structure { data, search_id, total, has_more, next_cursor, quality }
      const resPayload = json.data || json;
      const rawList = Array.isArray(resPayload.data)
        ? resPayload.data
        : Array.isArray(resPayload)
        ? resPayload
        : [];

      setResults(rawList);
      setHasMore(Boolean(resPayload.has_more));
      setNextCursor(resPayload.next_cursor || null);
      setQuality(resPayload.quality || null);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during search.");
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  // Handle Load More pagination
  const handleLoadMore = async () => {
    if (!hasMore || loadingMore || !lastSubmittedQuery) return;

    setLoadingMore(true);
    setError(null);

    try {
      const payload: Record<string, any> = {
        query: lastSubmittedQuery,
      };

      if (activePlatformFilter === "instagram") {
        payload.platforms = ["instagram"];
      }

      const parsedMin = parseInt(lastMinFollowers, 10);
      if (!isNaN(parsedMin) && parsedMin >= 0) {
        payload.min_followers = parsedMin;
      }

      const parsedMax = parseInt(lastMaxFollowers, 10);
      if (!isNaN(parsedMax) && parsedMax >= 0) {
        payload.max_followers = parsedMax;
      }

      // Send next_cursor using cursor parameter name from inputSchema
      if (nextCursor) {
        payload.cursor = nextCursor;
        payload.next_cursor = nextCursor;
      }

      const response = await fetch("/api/creators-search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const json = await response.json();

      if (!response.ok) {
        const errorData = json as ApiError;
        throw new Error(errorData.error || `Failed to load more results (${response.status})`);
      }

      const resPayload = json.data || json;
      const newItems = Array.isArray(resPayload.data) ? resPayload.data : [];

      // Append new results below existing ones, skipping any creator id already shown
      setResults((prev) => {
        const currentList = prev || [];
        const seenIds = new Set<string>();

        // Collect existing IDs/usernames
        currentList.forEach((item) => {
          const norm = normalizeResult(item);
          if (norm.id) seenIds.add(norm.id);
          else if (norm.username) seenIds.add(norm.username.toLowerCase());
        });

        // Filter incoming items
        const deduplicatedNew = newItems.filter((item: any) => {
          const norm = normalizeResult(item);
          if (norm.id && seenIds.has(norm.id)) return false;
          if (norm.username && seenIds.has(norm.username.toLowerCase())) return false;
          if (norm.id) seenIds.add(norm.id);
          else if (norm.username) seenIds.add(norm.username.toLowerCase());
          return true;
        });

        return [...currentList, ...deduplicatedNew];
      });

      setHasMore(Boolean(resPayload.has_more));
      setNextCursor(resPayload.next_cursor || null);
      if (resPayload.quality) {
        setQuality(resPayload.quality);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load additional creators.");
    } finally {
      setLoadingMore(false);
    }
  };

  // Client-side platform filtering: drop cards whose platform does not match selected filter
  const displayedResults = useMemo(() => {
    if (results === null) return null;
    if (activePlatformFilter === "all") return results;

    return results.filter((item) => {
      const norm = normalizeResult(item);
      const p = (norm.platform || "").toLowerCase();
      return p === activePlatformFilter.toLowerCase();
    });
  }, [results, activePlatformFilter]);

  // Ranking notice: when quality.mode is anything other than fully reranked
  const showRankingNotice = Boolean(
    quality && quality.mode && quality.mode !== "fully_reranked"
  );

  const getPlatformLabel = (id: string) => {
    const found = PLATFORMS.find((p) => p.id === id);
    return found ? found.label : id;
  };

  return (
    <div className="space-y-6">
      {/* Search Header Banner */}
      <div className="rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900 via-zinc-900/80 to-zinc-950 p-6 sm:p-8 shadow-sm">
        <div className="max-w-3xl">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-2">
            Semantic Creator Discovery
          </h1>
          <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
            Search Influship's creator database with natural language briefs.
            Describe topics, niches, audience aesthetics, or campaign goals.
          </p>

          {/* Search Form - Submits on form submit only, never on each keystroke */}
          <form onSubmit={handleSearch} className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g. High-protein plant-based nutrition coaches in Los Angeles"
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950/80 py-3 pl-11 pr-4 text-sm text-zinc-100 placeholder-zinc-500 shadow-inner focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowFilters(!showFilters)}
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-3 text-sm font-medium transition-colors ${
                    showFilters || minFollowers || maxFollowers
                      ? "border-indigo-500/50 bg-indigo-950/40 text-indigo-300"
                      : "border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
                  }`}
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  <span className="hidden sm:inline">Filters</span>
                </button>

                <button
                  type="submit"
                  disabled={loading || !query.trim()}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-500/25 hover:from-indigo-600 hover:to-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Searching...</span>
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4" />
                      <span>Search</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Platform Filter Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs font-medium text-zinc-400">Platform:</span>
              {PLATFORMS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedPlatform(p.id)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                    selectedPlatform === p.id
                      ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/40"
                      : "bg-zinc-800/60 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 border border-transparent"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Collapsible Follower Filters */}
            {showFilters && (
              <div className="pt-3 border-t border-zinc-800 flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-zinc-400">Min Followers:</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 10000"
                    value={minFollowers}
                    onChange={(e) => setMinFollowers(e.target.value)}
                    className="w-32 rounded-lg border border-zinc-700 bg-zinc-950 px-2.5 py-1 text-xs text-zinc-200 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-xs text-zinc-400">Max Followers:</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 500000"
                    value={maxFollowers}
                    onChange={(e) => setMaxFollowers(e.target.value)}
                    className="w-32 rounded-lg border border-zinc-700 bg-zinc-950 px-2.5 py-1 text-xs text-zinc-200 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                {(minFollowers || maxFollowers) && (
                  <button
                    type="button"
                    onClick={() => {
                      setMinFollowers("");
                      setMaxFollowers("");
                    }}
                    className="text-xs text-indigo-400 hover:underline"
                  >
                    Clear follower filters
                  </button>
                )}
              </div>
            )}
          </form>

          {/* Preset discovery briefs */}
          {results === null && !loading && !error && (
            <div className="mt-6">
              <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider block mb-2">
                Suggested discovery briefs
              </span>
              <div className="flex flex-wrap gap-2">
                {PRESET_QUERIES.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setQuery(preset);
                    }}
                    className="rounded-lg bg-zinc-800/40 border border-zinc-800 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:border-zinc-700 transition-colors text-left"
                  >
                    "{preset}"
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900/40 p-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-400 mb-3" />
          <h3 className="font-semibold text-zinc-200 text-base">
            Connecting to Influship MCP...
          </h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm">
            Querying semantic creator embeddings and indexing metrics. This consumes search credits on your Influship plan.
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
                Search Request Failed
              </h3>
              <p className="mt-1 text-xs text-red-300/90 leading-relaxed font-mono">
                {error}
              </p>
              {error.includes("INFLUSHIP_API_KEY") && (
                <div className="mt-3 rounded-lg bg-red-950/40 p-3 text-xs text-red-300 border border-red-800/40">
                  Tip: Provide your <code className="font-mono font-semibold">INFLUSHIP_API_KEY</code> in the project secrets or environment variables.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Empty State: Initial */}
      {results === null && !loading && !error && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 p-12 text-center">
          <Compass className="h-10 w-10 text-zinc-600 mb-3" />
          <h3 className="font-semibold text-zinc-300 text-sm">
            Ready to Discover Creators
          </h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-md">
            Type your campaign intent above or select one of the suggested briefs.
            Search runs strictly on submit to preserve Influship credits.
          </p>
        </div>
      )}

      {/* Empty State: Zero Results (reads exact wording "No creators found. Try a broader brief.") */}
      {displayedResults !== null && displayedResults.length === 0 && !loading && !error && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900/20 p-12 text-center">
          <Search className="h-8 w-8 text-zinc-500 mb-3" />
          <h3 className="font-semibold text-zinc-300 text-sm">
            No creators found. Try a broader brief.
          </h3>
        </div>
      )}

      {/* Results Header & Grid */}
      {displayedResults !== null && displayedResults.length > 0 && !loading && (
        <div className="space-y-4">
          <div className="space-y-1">
            {/* Platform filter status label */}
            {activePlatformFilter !== "all" ? (
              <div className="text-xs font-semibold text-indigo-400">
                Filtered to {getPlatformLabel(activePlatformFilter)} profiles
              </div>
            ) : null}

            {/* Ranking notice: when quality.mode is anything other than fully reranked */}
            {showRankingNotice && (
              <p className="text-xs text-zinc-500">
                Ranking is approximate for this search.
              </p>
            )}
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {displayedResults.map((creator, idx) => (
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

          {/* Pagination: Load More button only when has_more is true */}
          {hasMore && (
            <div className="pt-4 pb-2 text-center">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-6 py-2.5 text-xs sm:text-sm font-semibold text-zinc-200 hover:bg-zinc-800 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
                    <span>Loading more creators...</span>
                  </>
                ) : (
                  <span>Load more</span>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
