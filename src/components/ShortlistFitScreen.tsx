import React, { useState } from "react";
import {
  Star,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sparkles,
  Loader2,
  AlertCircle,
  Trash2,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { Creator, MatchDecision, ApiResponse, ApiError } from "../types";
import {
  getCreatorAvatar,
  getCreatorName,
  getCreatorHandle,
  getCreatorId,
  getCreatorPlatform,
  getCreatorFollowers,
  getCreatorEngagement,
  formatNumber,
  formatPercent,
} from "../utils/formatters";

interface ShortlistFitScreenProps {
  shortlist: Creator[];
  onRemoveFromShortlist: (creator: Creator) => void;
  onClearShortlist: () => void;
  onViewDetail: (creator: Creator) => void;
}

export const ShortlistFitScreen: React.FC<ShortlistFitScreenProps> = ({
  shortlist,
  onRemoveFromShortlist,
  onClearShortlist,
  onViewDetail,
}) => {
  const [brief, setBrief] = useState<string>("");
  const [context, setContext] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [matchResults, setMatchResults] = useState<MatchDecision[] | null>(null);
  const [matchMeta, setMatchMeta] = useState<{ source?: string; fetched_at?: string } | null>(null);

  const handleRunMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedBrief = brief.trim();
    if (!trimmedBrief) return;
    if (shortlist.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      // Build candidate lists for match_creators tool schema
      const creatorIds: string[] = [];
      const profiles: { platform: "instagram"; username: string }[] = [];

      for (const c of shortlist) {
        const id = getCreatorId(c);
        const handle = getCreatorHandle(c);

        if (id && /^[0-9a-fA-F-]{36}$/.test(id)) {
          creatorIds.push(id);
        } else if (handle) {
          profiles.push({
            platform: "instagram",
            username: handle,
          });
        }
      }

      if (creatorIds.length === 0 && profiles.length === 0) {
        throw new Error("None of the shortlisted creators have valid IDs or handles.");
      }

      const payload: Record<string, any> = {
        intent_query: trimmedBrief,
      };

      if (creatorIds.length > 0) {
        payload.creator_ids = creatorIds;
      }
      if (profiles.length > 0) {
        payload.profiles = profiles;
      }
      if (context.trim()) {
        payload.intent_context = context.trim();
      }

      const res = await fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        const err = json as ApiError;
        throw new Error(err.error || `Campaign fit match failed (${res.status})`);
      }

      const resData = json as ApiResponse<any>;
      const raw = resData.data;

      let list: MatchDecision[] = [];
      if (Array.isArray(raw)) {
        list = raw;
      } else if (raw && Array.isArray(raw.results)) {
        list = raw.results;
      } else if (raw && Array.isArray(raw.creators)) {
        list = raw.creators;
      } else if (raw && Array.isArray(raw.matches)) {
        list = raw.matches;
      } else if (raw && Array.isArray(raw.data)) {
        list = raw.data;
      }

      setMatchResults(list);
      setMatchMeta({
        source: resData.source,
        fetched_at: resData.fetched_at,
      });
    } catch (err: any) {
      setError(err.message || "Failed to score creators against campaign brief.");
      setMatchResults(null);
    } finally {
      setLoading(false);
    }
  };

  // Helper to render decision badge
  const renderDecisionBadge = (decision?: string, status?: string, recommendation?: string) => {
    const rawVal = (decision || status || recommendation || "").toLowerCase();
    if (rawVal.includes("good") || rawVal.includes("pass") || rawVal.includes("approve") || rawVal.includes("recommended") || rawVal.includes("high")) {
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-950/80 px-2.5 py-1 text-xs font-semibold text-emerald-400 border border-emerald-800/80">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
          <span>Good Fit</span>
        </span>
      );
    }
    if (rawVal.includes("avoid") || rawVal.includes("reject") || rawVal.includes("risk") || rawVal.includes("poor") || rawVal.includes("low")) {
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-rose-950/80 px-2.5 py-1 text-xs font-semibold text-rose-400 border border-rose-800/80">
          <XCircle className="h-3.5 w-3.5 text-rose-400" />
          <span>Avoid</span>
        </span>
      );
    }
    if (rawVal.includes("neutral") || rawVal.includes("medium") || rawVal.includes("moderate") || rawVal.includes("consider") || rawVal.length > 0) {
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-amber-950/80 px-2.5 py-1 text-xs font-semibold text-amber-400 border border-amber-800/80">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
          <span>{decision || status || "Neutral"}</span>
        </span>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8">
      {/* Shortlist Section */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Candidate Shortlist
              </h1>
              <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-semibold text-amber-400 border border-amber-500/30">
                {shortlist.length} creator{shortlist.length === 1 ? "" : "s"}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Creators starred across Discover or Lookalike results for evaluation.
            </p>
          </div>

          {shortlist.length > 0 && (
            <button
              type="button"
              onClick={onClearShortlist}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-red-400 hover:border-red-900/50 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear shortlist</span>
            </button>
          )}
        </div>

        {/* Empty Shortlist State */}
        {shortlist.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-800 p-8 text-center">
            <Star className="h-8 w-8 text-zinc-600 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-zinc-300">Your shortlist is empty</h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
              Star creator cards in the Discover or Lookalikes views to add them here and evaluate them against your campaign brief.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {shortlist.map((creator, idx) => {
              const avatar = getCreatorAvatar(creator);
              const name = getCreatorName(creator);
              const handle = getCreatorHandle(creator);
              const platform = getCreatorPlatform(creator);
              const followers = getCreatorFollowers(creator);
              const engagement = getCreatorEngagement(creator);

              return (
                <div
                  key={creator.id || creator.creator_id || creator.username || idx}
                  className="flex items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-950/60 p-3.5"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {avatar && (
                      <img
                        src={avatar}
                        alt={name || handle || "Creator"}
                        className="h-10 w-10 rounded-full object-cover border border-zinc-700 bg-zinc-800 shrink-0"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    )}
                    <div className="min-w-0">
                      <h4 className="truncate text-xs sm:text-sm font-semibold text-zinc-200">
                        {name || (handle ? `@${handle}` : "Creator")}
                      </h4>
                      {handle && (
                        <p className="truncate text-[11px] text-zinc-400">@{handle}</p>
                      )}
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-zinc-500">
                        {platform && <span className="capitalize">{platform}</span>}
                        {followers !== undefined && (
                          <span>• {formatNumber(followers)} f</span>
                        )}
                        {engagement !== undefined && (
                          <span>• {formatPercent(engagement)} er</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => onViewDetail(creator)}
                      title="View Profile"
                      className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemoveFromShortlist(creator)}
                      title="Remove from shortlist"
                      className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Campaign Fit Evaluation Form */}
      <div className="rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900 to-zinc-950 p-6 sm:p-8">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-5 w-5 text-indigo-400" />
            <h2 className="text-xl font-bold tracking-tight text-white">
              Campaign Fit Check
            </h2>
          </div>
          <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
            Provide your campaign goals and constraints. Influship's matching model will evaluate each shortlisted creator and return fit scores, good/neutral/avoid decisions, and detailed reasons.
          </p>

          <form onSubmit={handleRunMatch} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                Campaign Brief / Target Intent *
              </label>
              <textarea
                rows={3}
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                placeholder="e.g. Seeking creators for a clean protein powder launch. Creators should emphasize natural ingredients, genuine gym routines, and mindful wellness without gimmicks."
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950/80 p-3.5 text-sm text-zinc-100 placeholder-zinc-500 shadow-inner focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                Brand Constraints & Context (Optional)
              </label>
              <textarea
                rows={2}
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="e.g. Budget per post $1,500, North American audience 60%+, must have posted about fitness in the last 30 days."
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950/80 p-3 text-sm text-zinc-100 placeholder-zinc-500 shadow-inner focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading || !brief.trim() || shortlist.length === 0}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-500/25 hover:from-indigo-600 hover:to-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Evaluating Shortlist via Influship...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Score Candidates Against Brief</span>
                  </>
                )}
              </button>
              {shortlist.length === 0 && (
                <span className="block sm:inline sm:ml-3 mt-2 sm:mt-0 text-xs text-amber-400">
                  Add at least 1 creator to the shortlist to run fit scoring.
                </span>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Loading state for fit check */}
      {loading && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900/40 p-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-400 mb-3" />
          <h3 className="font-semibold text-zinc-200 text-base">
            Scoring Creators Against Campaign Brief...
          </h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm">
            Influship MCP is computing semantic overlap, audience suitability, and decision criteria for each candidate.
          </p>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="rounded-2xl border border-red-900/50 bg-red-950/20 p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-200 text-sm">
                Campaign Fit Check Failed
              </h3>
              <p className="mt-1 text-xs text-red-300 font-mono leading-relaxed">
                {error}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Match Results */}
      {matchResults !== null && !loading && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-indigo-400" />
              <h3 className="text-base font-bold text-white">
                Match Results ({matchResults.length} evaluated)
              </h3>
            </div>
            {matchMeta?.fetched_at && (
              <span className="text-xs text-zinc-500">
                via {matchMeta.source} at {new Date(matchMeta.fetched_at).toLocaleTimeString()}
              </span>
            )}
          </div>

          {matchResults.length === 0 ? (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/20 p-8 text-center text-xs text-zinc-500">
              No evaluation results returned for this brief.
            </div>
          ) : (
            <div className="space-y-4">
              {matchResults.map((item, idx) => {
                const score = item.score ?? item.fit_score ?? item.match_score;
                const decision = item.decision ?? item.status ?? item.recommendation;
                const handle = item.handle || item.username;
                const name = item.name;

                // Match reasons can be array of strings, single string, or pros/cons
                const reasons = item.reasons || item.reason || item.explanation || item.fit_reasons || item.notes;

                return (
                  <div
                    key={item.creator_id || handle || idx}
                    className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5 sm:p-6 shadow-sm space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800/80">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-semibold text-white">
                            {name || (handle ? `@${handle}` : `Candidate #${idx + 1}`)}
                          </h4>
                          {handle && name && (
                            <span className="text-xs text-zinc-400">@{handle}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Score Display (only if present) */}
                        {typeof score === "number" && (
                          <div className="flex items-center gap-2 rounded-lg bg-zinc-950 px-3 py-1.5 border border-zinc-800">
                            <span className="text-xs text-zinc-400 font-medium">Fit Score:</span>
                            <span className="text-sm font-bold text-indigo-400">
                              {score > 1 ? `${Math.round(score)}/100` : `${Math.round(score * 100)}%`}
                            </span>
                          </div>
                        )}

                        {/* Decision Badge (only if present) */}
                        {renderDecisionBadge(item.decision, item.status, item.recommendation)}
                      </div>
                    </div>

                    {/* Reasons & Evaluation (only if present) */}
                    {reasons && (
                      <div className="space-y-2">
                        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 block">
                          Evaluation & Reasons
                        </span>
                        {Array.isArray(reasons) ? (
                          <ul className="space-y-1.5 pl-4 list-disc text-xs sm:text-sm text-zinc-300">
                            {reasons.map((r, rIdx) => (
                              <li key={rIdx} className="leading-relaxed">
                                {typeof r === "string" ? r : JSON.stringify(r)}
                              </li>
                            ))}
                          </ul>
                        ) : typeof reasons === "string" ? (
                          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed whitespace-pre-line">
                            {reasons}
                          </p>
                        ) : (
                          <pre className="text-xs text-zinc-400 overflow-x-auto">
                            {JSON.stringify(reasons, null, 2)}
                          </pre>
                        )}
                      </div>
                    )}

                    {/* Pros and Cons if specifically present */}
                    {Array.isArray(item.pros) && item.pros.length > 0 && (
                      <div className="rounded-lg bg-emerald-950/20 p-3 border border-emerald-900/30">
                        <span className="text-xs font-semibold text-emerald-400 block mb-1">
                          Pros
                        </span>
                        <ul className="list-disc pl-4 text-xs text-emerald-200/90 space-y-1">
                          {item.pros.map((p, pIdx) => (
                            <li key={pIdx}>{p}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {Array.isArray(item.cons) && item.cons.length > 0 && (
                      <div className="rounded-lg bg-rose-950/20 p-3 border border-rose-900/30">
                        <span className="text-xs font-semibold text-rose-400 block mb-1">
                          Potential Risks / Cons
                        </span>
                        <ul className="list-disc pl-4 text-xs text-rose-200/90 space-y-1">
                          {item.cons.map((c, cIdx) => (
                            <li key={cIdx}>{c}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
