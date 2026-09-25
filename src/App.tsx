/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Navbar } from "./components/Navbar";
import { DiscoverScreen } from "./components/DiscoverScreen";
import { CreatorDetailScreen } from "./components/CreatorDetailScreen";
import { LookalikesScreen } from "./components/LookalikesScreen";
import { ShortlistFitScreen } from "./components/ShortlistFitScreen";
import { Creator } from "./types";
import { getCreatorId, getCreatorHandle } from "./utils/formatters";

export default function App() {
  const [activeTab, setActiveTab] = useState<"discover" | "detail" | "lookalikes" | "shortlist">("discover");
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
  const [seedCreator, setSeedCreator] = useState<Creator | null>(null);
  const [shortlist, setShortlist] = useState<Creator[]>([]);

  // Check if a creator is starred
  const isStarred = (creator: Creator): boolean => {
    const id = getCreatorId(creator);
    const handle = getCreatorHandle(creator);
    return shortlist.some((item) => {
      const itemId = getCreatorId(item);
      const itemHandle = getCreatorHandle(item);
      if (id && itemId && id === itemId) return true;
      if (handle && itemHandle && handle.toLowerCase() === itemHandle.toLowerCase()) return true;
      return false;
    });
  };

  // Toggle star in React state
  const onToggleStar = (creator: Creator) => {
    if (isStarred(creator)) {
      onRemoveFromShortlist(creator);
    } else {
      setShortlist((prev) => [...prev, creator]);
    }
  };

  // Remove single creator from shortlist
  const onRemoveFromShortlist = (creator: Creator) => {
    const id = getCreatorId(creator);
    const handle = getCreatorHandle(creator);
    setShortlist((prev) =>
      prev.filter((item) => {
        const itemId = getCreatorId(item);
        const itemHandle = getCreatorHandle(item);
        if (id && itemId && id === itemId) return false;
        if (handle && itemHandle && handle.toLowerCase() === itemHandle.toLowerCase()) return false;
        return true;
      })
    );
  };

  // Clear entire shortlist
  const onClearShortlist = () => {
    setShortlist([]);
  };

  // View creator details
  const onViewDetail = (creator: Creator) => {
    setSelectedCreator(creator);
    setActiveTab("detail");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Find lookalikes / similar creators
  const onFindSimilar = (creator: Creator) => {
    setSeedCreator(creator);
    setActiveTab("lookalikes");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const selectedHandle = selectedCreator ? getCreatorHandle(selectedCreator) : undefined;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        shortlistCount={shortlist.length}
        hasSelectedCreator={selectedCreator !== null}
        selectedCreatorHandle={selectedHandle}
      />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {activeTab === "discover" && (
          <DiscoverScreen
            isStarred={isStarred}
            onToggleStar={onToggleStar}
            onViewDetail={onViewDetail}
            onFindSimilar={onFindSimilar}
          />
        )}

        {activeTab === "detail" && selectedCreator && (
          <CreatorDetailScreen
            initialCreator={selectedCreator}
            onBack={() => setActiveTab("discover")}
            isStarred={isStarred(selectedCreator)}
            onToggleStar={onToggleStar}
            onFindSimilar={onFindSimilar}
          />
        )}

        {activeTab === "lookalikes" && (
          <LookalikesScreen
            seedCreator={seedCreator}
            onClearSeed={() => setSeedCreator(null)}
            isStarred={isStarred}
            onToggleStar={onToggleStar}
            onViewDetail={onViewDetail}
            onFindSimilar={onFindSimilar}
            shortlist={shortlist}
          />
        )}

        {activeTab === "shortlist" && (
          <ShortlistFitScreen
            shortlist={shortlist}
            onRemoveFromShortlist={onRemoveFromShortlist}
            onClearShortlist={onClearShortlist}
            onViewDetail={onViewDetail}
          />
        )}
      </main>

      <footer className="border-t border-zinc-900 bg-zinc-950 py-6 text-center text-xs text-zinc-500">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>
            Influship MCP Integration • Model Context Protocol over Streamable HTTP
          </span>
          <div className="flex items-center gap-4 text-zinc-400">
            <span>Semantic Search</span>
            <span>•</span>
            <span>Lookalikes</span>
            <span>•</span>
            <span>Campaign Match Scoring</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
