# DartZone Implementation Progress

## Phase 1: Project Bootstrap & Dartboard

- [x] Initialize SvelteKit project with TypeScript, Tailwind CSS 4, Vitest, Playwright
- [x] Install dependencies: gsap, zod, DaisyUI
- [x] Configure Vitest multi-project (unit: node, component: browser mode)
- [x] Configure Playwright for E2E tests
- [x] Define core types (`club.ts`, `game.ts`, `league.ts`)
- [x] Create `dartboard.utils.ts` with sector geometry and score mapping
- [x] Create `scoring.ts` with score calculation logic
- [x] Build `Dartboard.svelte` main SVG component
- [x] Build `DartboardSector.svelte` individual sector component
- [x] Build `DartboardOverlay.svelte` hit marker overlay
- [x] Write unit tests: `dartboard.utils.test.ts` (31 tests)
- [x] Write unit tests: `scoring.test.ts` (18 tests)
- [x] Write component tests: `Dartboard.svelte.test.ts` (5 tests)
- [x] Verify all Phase 1 tests pass (54 total)

## Phase 2: Club Management

- [x] Define data repository interface (abstracts storage)
- [x] Implement in-memory repository for clubs/players
- [x] Build `ClubCard.svelte` component
- [x] Build `ClubForm.svelte` component
- [x] Build `ClubCrest.svelte` component
- [x] Create club routes: list, detail, create, edit
- [x] Implement Zod validation schemas
- [x] Add seed data for development
- [x] Write unit tests: `validation.test.ts` (19 tests)
- [x] Write component tests: `ClubCard.svelte.test.ts` (4 tests), `ClubForm.svelte.test.ts` (5 tests)
- [x] Write E2E test: `club-management.spec.ts` (6 tests)
- [x] Verify all Phase 2 tests pass (82 unit+component, 6 E2E)

## Phase 3: Season & Match Management

- [x] Extend repository for seasons, matches, standings
- [x] Implement standings calculation logic
- [x] Build season routes: list, create, detail
- [x] Implement club assignment to season
- [x] Build match scheduling (home vs away)
- [x] Build `LeagueTable.svelte` component
- [x] Build `MatchCard.svelte`, `SeasonSelector.svelte` components
- [x] Build dashboard page with active season overview
- [x] Write component tests: `LeagueTable.svelte.test.ts` (4 tests)
- [x] Write E2E test: `league-table.spec.ts` (4 tests)
- [x] Verify all Phase 3 tests pass (86 unit+component, 10 E2E)

## Phase 4: Game / Scoring Engine

- [x] Implement `game.svelte.ts` state management (Svelte 5 runes)
- [x] Build scoring logic: bust detection, checkout validation
- [x] Build checkout route calculator (`checkout.ts`)
- [x] Build `ScoreBoard.svelte`, `ThrowHistory.svelte`, `TurnIndicator.svelte`
- [x] Build `CheckoutHelper.svelte`
- [x] Wire dartboard clicks to game state
- [x] Implement undo functionality
- [x] Match result aggregation on leg completion
- [x] Write unit tests: `checkout.test.ts` (13 tests)
- [x] Write component tests: `ScoreBoard.svelte.test.ts` (5 tests)
- [x] Write E2E test: `game-flow.spec.ts` (6 tests)
- [x] Verify all Phase 4 tests pass (104 unit+component, 16 E2E)

## Phase 5: Animations & Visual Polish

- [x] Implement animation store (event queue) with reactive trigger/dismiss
- [x] Build `BullseyeEffect.svelte` (radial pulse + particle burst)
- [x] Build `TripleTwentyEffect.svelte` (fire streak + text pop)
- [x] Build `OneEightyEffect.svelte` (golden full-screen + elastic text + particles)
- [x] Build `CheckoutEffect.svelte` (confetti fall + victory banner)
- [x] Build `AnimationOverlay.svelte` container component
- [x] Create `animation.utils.ts` with GSAP timeline factories
- [x] Integrate special hit detection → animation triggers in play page
- [x] Polish UI: transitions, hover effects, sticky navbar, responsive layout
- [x] Dark/light theme toggle with localStorage persistence
- [x] DaisyUI light/dark theme configuration
- [x] `LoadingSpinner.svelte` utility component
- [x] Verify all tests pass (104 Vitest + 16 Playwright E2E)

## Phase 6: Statistics & Deployment

- [x] Implement statistics aggregation functions (`statistics.ts`) — calcAverage, calcCheckoutPercentage, calcHighestTurnScore, count180s, countTonPlus, buildSectorCounts, calcPlayerMatchStats, calcPlayerOverallStats
- [x] Build `PlayerStats.svelte` — stat grid with matches, average, best avg, highest score, 180s, 100+, checkout %, total darts
- [x] Build `HeatmapBoard.svelte` — SVG dartboard with color-coded sector heat visualization
- [x] Build `AverageChart.svelte` — bar chart showing per-match averages
- [x] Build stats routes: `/stats` (player list), `/stats/[playerId]` (player detail with stats, heatmap, chart)
- [x] Add "Statistiken" navigation link to layout
- [x] Write unit tests: `statistics.test.ts` (28 tests)
- [x] Write component tests: `PlayerStats.svelte.test.ts` (9 tests)
- [x] Final test pass: 141 Vitest (109 unit + 32 component) + 16 Playwright E2E — all passing
