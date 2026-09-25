import React from "react";
import { Search, Sparkles, Star, Users, Radio } from "lucide-react";

interface NavbarProps {
  activeTab: "discover" | "detail" | "lookalikes" | "shortlist";
  setActiveTab: (tab: "discover" | "detail" | "lookalikes" | "shortlist") => void;
  shortlistCount: number;
  hasSelectedCreator: boolean;
  selectedCreatorHandle?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  shortlistCount,
  hasSelectedCreator,
  selectedCreatorHandle,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 shadow-md shadow-indigo-500/20">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-zinc-100 tracking-tight text-base sm:text-lg">
                Influship Discovery
              </span>
              <span className="hidden items-center gap-1 rounded-full bg-emerald-950/80 px-2 py-0.5 text-[11px] font-medium text-emerald-400 border border-emerald-800/60 sm:inline-flex">
                <Radio className="h-2.5 w-2.5 animate-pulse text-emerald-400" />
                MCP Streamable HTTP
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => setActiveTab("discover")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium transition-all ${
              activeTab === "discover"
                ? "bg-zinc-800 text-white shadow-sm"
                : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
            }`}
          >
            <Search className="h-4 w-4" />
            <span>Discover</span>
          </button>

          {hasSelectedCreator && (
            <button
              onClick={() => setActiveTab("detail")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium transition-all ${
                activeTab === "detail"
                  ? "bg-zinc-800 text-white shadow-sm"
                  : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
              }`}
            >
              <Users className="h-4 w-4" />
              <span>Detail {selectedCreatorHandle ? `(@${selectedCreatorHandle})` : ""}</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab("lookalikes")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium transition-all ${
              activeTab === "lookalikes"
                ? "bg-zinc-800 text-white shadow-sm"
                : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Lookalikes</span>
          </button>

          <button
            onClick={() => setActiveTab("shortlist")}
            className={`relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium transition-all ${
              activeTab === "shortlist"
                ? "bg-zinc-800 text-white shadow-sm"
                : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
            }`}
          >
            <Star
              className={`h-4 w-4 ${
                shortlistCount > 0 ? "fill-amber-400 text-amber-400" : ""
              }`}
            />
            <span>Shortlist & Fit</span>
            {shortlistCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500/20 px-1 text-xs font-semibold text-amber-400 border border-amber-500/30">
                {shortlistCount}
              </span>
            )}
          </button>
        </nav>
      </div>
    </header>
  );
};
