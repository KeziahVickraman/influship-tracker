# Project Prompts & Development Log

This document records the prompts and specifications used in building, refining, and maintaining the **Influship Tracker** influencer discovery dashboard.

---

## Table of Contents
1. [Prompt 1: Initial Dashboard Architecture & MCP Integration](#prompt-1-initial-dashboard-architecture--mcp-integration)
2. [Prompt 2: Influship Response Normalizer, Honest Labels & Discover Refinement](#prompt-2-influship-response-normalizer-honest-labels--discover-refinement)
3. [Prompt 3: Session Resumption & Integrity Verification](#prompt-3-session-resumption--integrity-verification)
4. [Prompt 4: MCP Server Endpoint Fix (`/api/mcp`)](#prompt-4-mcp-server-endpoint-fix-apimcp)
5. [Prompt 5: Export Prompts as Markdown](#prompt-5-export-prompts-as-markdown)
6. [Built-in Application Discovery & Semantic Brief Prompts](#built-in-application-discovery--semantic-brief-prompts)

---

## Prompt 1: Initial Dashboard Architecture & MCP Integration

```markdown
ROLE: Senior Full-Stack Engineer

GOAL: Build an influencer discovery dashboard powered by the Influship Model Context Protocol (MCP) server.

REQUIREMENTS:
- Frontend: Vite + React SPA with Tailwind CSS, Lucide icons, responsive layout.
- Backend / API Layer: Serverless API handlers in `api/` (Vercel-compatible) and Express bridge in `server.ts` (local dev & AI Studio preview on port 3000).
- MCP Client: Connect to `https://mcp.influship.com/mcp` using `@modelcontextprotocol/sdk` StreamableHTTPClientTransport.
- Secure Credentials: Store `INFLUSHIP_API_KEY` exclusively on the server side in `process.env`. Never expose keys to client bundles or logs.
- Screens & Features:
  1. Semantic Creator Discovery with natural language queries, platform filters, follower range filters.
  2. Creator Profiles & Posts view with metrics (engagement, followers, recent posts).
  3. Lookalike Finder using creator lookalikes tool.
  4. Campaign Fit Matcher evaluating creators against campaign briefs.
  5. Shortlist / Starred creators management.
```

---

## Prompt 2: Influship Response Normalizer, Honest Labels & Discover Refinement

```markdown
ROLE: You are a senior full-stack developer working in this existing Vite + React influencer dashboard. It reads Influship data through lib/influship.js and the routes in api/ (Vercel) and server.ts (AI Studio preview).

GOAL: Make the Discover results and creator cards render the real Influship response correctly: the right fields, honest labels, working platform filtering and working pagination.

OUTPUT:
 1) Create src/lib/normalizeCreator.js exporting normalizeResult(item). It maps one search result into { id, name, bio, avatarUrl, platform, username, profileUrl, followers, engagementRate, isVerified, updatedAt, matchScore, matchReason }. It reads from creator { id, name, bio, avatar_url }, relevant_profile { platform, username, url, followers, engagement_rate, is_verified, data_updated_at } and match { score, reasons[] }. It falls back to primary_profile when relevant_profile is null. Any missing field becomes null, never a placeholder.
    Before finalising the mapping, check that /api/creators-search returns this same shape through the MCP tool. If the MCP result wraps it differently (for example under structuredContent or a text item), unwrap it in lib/influship.js so every route returns the same { data, search_id, total, has_more, next_cursor, quality } object.
 2) Update the result card to show: avatar, name, @username linking to profileUrl in a new tab, a platform label taken from the profile's platform, followers formatted compactly (553609 → 553.6K), a verified badge when isVerified is true, match score as a whole percentage (0.92 → 92%), the first match reason, and "updated X ago" from updatedAt. Hide any element whose value is null.
 3) Engagement rate: Influship's units are unconfirmed (one creator shows 21.77, another 1.2 alongside a bio claiming 120%). Show the raw value to two decimals labelled "Engagement", with no % sign and no conversion, and a small info tooltip saying "As reported by Influship". Put the formatting in one function, formatEngagement(value), so it can be changed in one place later.
 4) Platform filter: when the user picks Instagram, TikTok or YouTube, pass it to semantic_search_creators using the parameter name from the tool's inputSchema. After results return, also drop any card whose platform does not match the selected filter, and show "Filtered to {platform} profiles" above the results. With no filter selected, show all results and each card's own platform label.
 5) Ranking notice: when quality.mode is anything other than a fully reranked value, show one muted line above the results: "Ranking is approximate for this search." Never show quality.reason codes to the user.
 6) Pagination: show a "Load more" button only when has_more is true. It sends the same query and filters plus next_cursor (using the parameter name from the inputSchema) and appends the new results below the existing ones, skipping any creator id already shown. While loading, disable the button and show a spinner on it.
 7) Avatars: render with loading="lazy" and referrerPolicy="no-referrer". If an image fails to load, replace it with a circle showing the creator's initials.
 8) Keep the loading, empty and error states. The empty state reads "No creators found. Try a broader brief." The error state shows the route's error message.

GUARDRAILS: Change only the Discover screen, the card component, the new normalizer and the result unwrapping in lib/influship.js; leave other screens and routes as they are. Never show sample, seed or mock data. The key stays in process.env.INFLUSHIP_API_KEY on the server only: never in src/, never with a VITE_ prefix, never in a response or log. No database and no login.

CONTEXT: A live REST search returned data[] items shaped as creator / relevant_profile / primary_profile / match, with top-level search_id, total, has_more, next_cursor and quality { mode, reason }. In that sample, every relevant_profile was Instagram even though the query asked about YouTube, and quality.mode was "partially_reranked".
```

---

## Prompt 3: Session Resumption & Integrity Verification

```markdown
There was an unexpected error. Finish what you were doing.
```

*Action Taken:*
- Re-verified code state, linter status (`tsc --noEmit`), and production build (`npm run build`).
- Committed changes and pushed cleanly to remote repository (`main` branch).
- Restarted development server.

---

## Prompt 4: MCP Server Endpoint Fix (`/api/mcp`)

```markdown
api/mcp server is not found. fix it
```

*Action Taken:*
- Diagnosed missing `/api/mcp` endpoint causing 404/405 errors when clients attempted direct MCP Streamable HTTP or SSE connections.
- Created `api/mcp.js` providing full MCP proxy support:
  - Streamable HTTP and SSE support with CORS headers (`Mcp-Session-Id`, `text/event-stream`).
  - Automatic `INFLUSHIP_API_KEY` header injection to upstream MCP server.
  - JSON status/health response for browser inspection.
- Registered `app.all("/api/mcp", mcpHandler)` in `server.ts`.
- Verified live connection using `@modelcontextprotocol/sdk` client.

---

## Prompt 5: Export Prompts as Markdown

```markdown
exports the prompts as a .md file
```

*Action Taken:*
- Exported all development prompts, specifications, and contextual prompts into this `PROMPTS.md` file.

---

## Built-in Application Discovery & Semantic Brief Prompts

The application includes predefined natural language discovery queries in `src/components/DiscoverScreen.tsx`:

1. **Sustainable Travel:**
   `"Sustainable eco-friendly travel creators in Europe"`
2. **Plant-Based Nutrition:**
   `"Plant-based meal prep and vegan nutrition coaches"`
3. **Tech & Productivity:**
   `"Tech gadget reviewers and productivity setup creators"`
4. **Skincare & Beauty:**
   `"Boutique skincare and minimalist beauty routines"`

### Campaign Match Evaluation Intent Prompt Template
Used in `src/components/ShortlistFitScreen.tsx` to match candidate creator rosters against brand briefs:
- **Query Format:**
  `"Target demographic: [Age/Location]. Niche: [Core Subject]. Aesthetic: [Visual/Tone Style]. Key Deliverables: [Reels/Stories/TikToks]."`
- **Context:**
  Passes candidate creator IDs or profile handles to Influship's `match_creators` tool for real-time semantic scoring and fit justification.
