import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  Star,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  Heart,
  MessageCircle,
  Eye,
  Loader2,
  AlertCircle,
  Grid,
} from "lucide-react";
import { Creator, Post, ApiResponse, ApiError } from "../types";
import {
  getCreatorAvatar,
  getCreatorName,
  getCreatorHandle,
  getCreatorPlatform,
  getCreatorFollowers,
  getCreatorEngagement,
  getCreatorBio,
  getCreatorId,
  formatNumber,
  formatPercent,
} from "../utils/formatters";

interface CreatorDetailScreenProps {
  initialCreator: Creator;
  onBack: () => void;
  isStarred: boolean;
  onToggleStar: (creator: Creator) => void;
  onFindSimilar: (creator: Creator) => void;
}

export const CreatorDetailScreen: React.FC<CreatorDetailScreenProps> = ({
  initialCreator,
  onBack,
  isStarred,
  onToggleStar,
  onFindSimilar,
}) => {
  const [creatorData, setCreatorData] = useState<Creator>(initialCreator);
  const [loadingProfile, setLoadingProfile] = useState<boolean>(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [posts, setPosts] = useState<Post[] | null>(null);
  const [loadingPosts, setLoadingPosts] = useState<boolean>(true);
  const [postsError, setPostsError] = useState<string | null>(null);

  const handle = getCreatorHandle(creatorData);
  const creatorId = getCreatorId(creatorData);
  const platform = getCreatorPlatform(creatorData);

  // Fetch full creator record
  useEffect(() => {
    let isMounted = true;
    const fetchProfile = async () => {
      setLoadingProfile(true);
      setProfileError(null);

      try {
        const payload: Record<string, any> = {};
        if (creatorId) {
          payload.id = creatorId;
        } else if (handle) {
          payload.platform = platform === "instagram" ? "instagram" : "instagram";
          payload.username = handle;
        } else {
          // No identifier
          setLoadingProfile(false);
          return;
        }

        const res = await fetch("/api/creator", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const json = await res.json();
        if (!res.ok) {
          const err = json as ApiError;
          throw new Error(err.error || `Failed to fetch profile (${res.status})`);
        }

        if (isMounted) {
          const resData = json as ApiResponse<any>;
          const raw = resData.data;
          const merged = { ...initialCreator, ...(raw?.creator || raw?.profile || raw?.data || raw) };
          setCreatorData(merged);
        }
      } catch (err: any) {
        if (isMounted) {
          setProfileError(err.message || "Failed to load creator profile.");
        }
      } finally {
        if (isMounted) setLoadingProfile(false);
      }
    };

    fetchProfile();

    return () => {
      isMounted = false;
    };
  }, [creatorId, handle, platform]);

  // Fetch recent posts
  useEffect(() => {
    let isMounted = true;
    const fetchPosts = async () => {
      const activeHandle = getCreatorHandle(creatorData);
      if (!activeHandle) {
        setLoadingPosts(false);
        return;
      }

      setLoadingPosts(true);
      setPostsError(null);

      try {
        const payload: Record<string, any> = {
          platform: "instagram",
          username: activeHandle,
        };

        const activeId = getCreatorId(creatorData);
        if (activeId) {
          payload.creator_id = activeId;
        }

        const res = await fetch("/api/creator-posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const json = await res.json();
        if (!res.ok) {
          const err = json as ApiError;
          throw new Error(err.error || `Failed to fetch posts (${res.status})`);
        }

        if (isMounted) {
          const resData = json as ApiResponse<any>;
          const raw = resData.data;
          let list: Post[] = [];
          if (Array.isArray(raw)) {
            list = raw;
          } else if (raw && Array.isArray(raw.posts)) {
            list = raw.posts;
          } else if (raw && Array.isArray(raw.results)) {
            list = raw.results;
          } else if (raw && Array.isArray(raw.items)) {
            list = raw.items;
          } else if (raw && Array.isArray(raw.data)) {
            list = raw.data;
          }
          setPosts(list);
        }
      } catch (err: any) {
        if (isMounted) {
          setPostsError(err.message || "Failed to load creator posts.");
          setPosts(null);
        }
      } finally {
        if (isMounted) setLoadingPosts(false);
      }
    };

    fetchPosts();

    return () => {
      isMounted = false;
    };
  }, [creatorData]);

  const avatar = getCreatorAvatar(creatorData);
  const name = getCreatorName(creatorData);
  const bio = getCreatorBio(creatorData);
  const followers = getCreatorFollowers(creatorData);
  const engagement = getCreatorEngagement(creatorData);
  const isVerified = creatorData.verified || creatorData.is_verified;

  // Additional stats that might be in response
  const following = creatorData.following ?? creatorData.following_count;
  const postsCount = creatorData.posts_count ?? creatorData.media_count;
  const avgLikes = creatorData.avg_likes ?? creatorData.average_likes;
  const avgComments = creatorData.avg_comments ?? creatorData.average_comments;

  // Linked profiles
  const linkedProfiles = creatorData.profiles || creatorData.linked_profiles;

  return (
    <div className="space-y-6">
      {/* Top navigation actions */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs sm:text-sm font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onFindSimilar(creatorData)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-600/50 bg-indigo-950/40 px-3.5 py-1.5 text-xs sm:text-sm font-medium text-indigo-300 hover:bg-indigo-900/50 transition-colors shadow-sm"
          >
            <Sparkles className="h-4 w-4 text-indigo-400" />
            <span>Find Similar Creators</span>
          </button>

          <button
            type="button"
            onClick={() => onToggleStar(creatorData)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-1.5 text-xs sm:text-sm font-medium transition-colors ${
              isStarred
                ? "border-amber-500/50 bg-amber-400/10 text-amber-400 hover:bg-amber-400/20"
                : "border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white"
            }`}
          >
            <Star className={`h-4 w-4 ${isStarred ? "fill-amber-400 text-amber-400" : ""}`} />
            <span>{isStarred ? "Shortlisted" : "Add to Shortlist"}</span>
          </button>
        </div>
      </div>

      {/* Profile Error State */}
      {profileError && (
        <div className="rounded-xl border border-red-900/50 bg-red-950/20 p-4">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-semibold text-red-200">Notice from Influship MCP</h4>
              <p className="text-xs text-red-300/80 font-mono mt-0.5">{profileError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Profile Card Header */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6 sm:p-8 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          {avatar && (
            <img
              src={avatar}
              alt={name || handle || "Creator"}
              className="h-20 w-20 sm:h-24 sm:w-24 rounded-full object-cover border-2 border-zinc-700 bg-zinc-800 shadow-md"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
          )}

          <div className="flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              {name && (
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {name}
                </h1>
              )}
              {isVerified && (
                <CheckCircle2 className="h-5 w-5 fill-sky-500 text-zinc-950" />
              )}
              {platform && (
                <span className="rounded-md bg-zinc-800 px-2.5 py-0.5 text-xs font-medium text-zinc-300 capitalize border border-zinc-700">
                  {platform}
                </span>
              )}
            </div>

            {handle && (
              <p className="text-sm font-medium text-zinc-400">
                @{handle}
              </p>
            )}

            {bio && (
              <p className="text-sm text-zinc-300 pt-2 max-w-2xl leading-relaxed whitespace-pre-line">
                {bio}
              </p>
            )}
          </div>
        </div>

        {/* Profile Stats Grid (Renders only fields actually returned!) */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 pt-6 border-t border-zinc-800/80">
          {followers !== undefined && (
            <div className="rounded-xl bg-zinc-950/60 p-3.5 border border-zinc-800">
              <span className="block text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                Followers
              </span>
              <span className="text-lg font-bold text-white">
                {formatNumber(followers)}
              </span>
            </div>
          )}

          {engagement !== undefined && (
            <div className="rounded-xl bg-zinc-950/60 p-3.5 border border-zinc-800">
              <span className="block text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                Engagement Rate
              </span>
              <span className="text-lg font-bold text-emerald-400">
                {formatPercent(engagement)}
              </span>
            </div>
          )}

          {typeof following === "number" && (
            <div className="rounded-xl bg-zinc-950/60 p-3.5 border border-zinc-800">
              <span className="block text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                Following
              </span>
              <span className="text-lg font-bold text-white">
                {formatNumber(following)}
              </span>
            </div>
          )}

          {typeof postsCount === "number" && (
            <div className="rounded-xl bg-zinc-950/60 p-3.5 border border-zinc-800">
              <span className="block text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                Total Posts
              </span>
              <span className="text-lg font-bold text-white">
                {formatNumber(postsCount)}
              </span>
            </div>
          )}

          {typeof avgLikes === "number" && (
            <div className="rounded-xl bg-zinc-950/60 p-3.5 border border-zinc-800">
              <span className="block text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                Avg Likes
              </span>
              <span className="text-lg font-bold text-white">
                {formatNumber(avgLikes)}
              </span>
            </div>
          )}

          {typeof avgComments === "number" && (
            <div className="rounded-xl bg-zinc-950/60 p-3.5 border border-zinc-800">
              <span className="block text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                Avg Comments
              </span>
              <span className="text-lg font-bold text-white">
                {formatNumber(avgComments)}
              </span>
            </div>
          )}
        </div>

        {/* Linked Profiles (only if present in response) */}
        {Array.isArray(linkedProfiles) && linkedProfiles.length > 0 && (
          <div className="mt-6 pt-5 border-t border-zinc-800">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">
              Linked Social Profiles
            </h4>
            <div className="flex flex-wrap gap-2.5">
              {linkedProfiles.map((p, idx) => {
                const pHandle = p.handle || p.username;
                const pPlatform = p.platform;
                return (
                  <div
                    key={idx}
                    className="flex items-center gap-2 rounded-lg bg-zinc-800/80 px-3 py-1.5 border border-zinc-700/60 text-xs"
                  >
                    {pPlatform && (
                      <span className="capitalize font-semibold text-zinc-300">
                        {pPlatform}:
                      </span>
                    )}
                    {pHandle && <span className="text-zinc-200">@{pHandle}</span>}
                    {p.followers !== undefined && (
                      <span className="text-zinc-400 font-mono text-[11px]">
                        ({formatNumber(p.followers)})
                      </span>
                    )}
                    {p.url && (
                      <a
                        href={p.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-zinc-400 hover:text-white"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Recent Posts Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Grid className="h-4 w-4 text-zinc-400" />
            <h2 className="text-base font-semibold text-zinc-200">Recent Posts</h2>
          </div>
          {posts && posts.length > 0 && (
            <span className="text-xs text-zinc-400 font-mono">
              {posts.length} post{posts.length === 1 ? "" : "s"} loaded
            </span>
          )}
        </div>

        {/* Loading posts */}
        {loadingPosts && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900/30 p-10 text-center">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-400 mb-2" />
            <p className="text-xs text-zinc-400">Loading recent posts from Influship MCP...</p>
          </div>
        )}

        {/* Posts Error State */}
        {postsError && !loadingPosts && (
          <div className="rounded-xl border border-red-900/50 bg-red-950/20 p-5">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-semibold text-red-200">Could not retrieve posts</h4>
                <p className="mt-1 text-xs text-red-300 font-mono">{postsError}</p>
              </div>
            </div>
          </div>
        )}

        {/* Empty Posts State */}
        {posts !== null && posts.length === 0 && !loadingPosts && !postsError && (
          <div className="rounded-2xl border border-dashed border-zinc-800 p-8 text-center">
            <p className="text-xs text-zinc-500">No public posts returned for this creator.</p>
          </div>
        )}

        {/* Posts Grid */}
        {posts !== null && posts.length > 0 && !loadingPosts && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {posts.map((post, idx) => {
              const thumbnail = post.thumbnail_url || post.image_url || post.display_url || post.media_url;
              const likes = post.likes ?? post.like_count ?? post.likes_count;
              const comments = post.comments ?? post.comment_count ?? post.comments_count;
              const views = post.views ?? post.view_count;
              const caption = post.caption || post.text;
              const postUrl = post.url || post.permalink;

              return (
                <div
                  key={post.id || post.post_id || idx}
                  className="group flex flex-col justify-between overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/70 shadow-sm transition-all hover:border-zinc-700"
                >
                  <div>
                    {thumbnail && (
                      <div className="relative aspect-square w-full overflow-hidden bg-zinc-950">
                        <img
                          src={thumbnail}
                          alt="Post media"
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                        {post.is_video && (
                          <span className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
                            VIDEO
                          </span>
                        )}
                      </div>
                    )}

                    {caption && (
                      <div className="p-3">
                        <p className="line-clamp-3 text-xs text-zinc-300 leading-relaxed">
                          {caption}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="p-3 pt-0">
                    {/* Post Engagement Stats (only if present) */}
                    {(likes !== undefined || comments !== undefined || views !== undefined) && (
                      <div className="flex flex-wrap items-center gap-3 border-t border-zinc-800/80 pt-2 text-[11px] text-zinc-400">
                        {likes !== undefined && (
                          <span className="inline-flex items-center gap-1 font-medium">
                            <Heart className="h-3 w-3 text-rose-400" />
                            {formatNumber(likes)}
                          </span>
                        )}
                        {comments !== undefined && (
                          <span className="inline-flex items-center gap-1 font-medium">
                            <MessageCircle className="h-3 w-3 text-sky-400" />
                            {formatNumber(comments)}
                          </span>
                        )}
                        {views !== undefined && (
                          <span className="inline-flex items-center gap-1 font-medium">
                            <Eye className="h-3 w-3 text-amber-400" />
                            {formatNumber(views)}
                          </span>
                        )}
                      </div>
                    )}

                    {postUrl && (
                      <div className="mt-2 text-right">
                        <a
                          href={postUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors"
                        >
                          <span>Open post</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
