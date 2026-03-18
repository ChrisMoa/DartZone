<script lang="ts">
	import { browser } from '$app/environment';
	import Dartboard from '$lib/components/dartboard/Dartboard.svelte';
	import type { Quadrant } from '$lib/components/dartboard/Dartboard.svelte';
	import ScoreBoard from '$lib/components/scoring/ScoreBoard.svelte';
	import ScoreKeypad from '$lib/components/scoring/ScoreKeypad.svelte';
	import ThrowHistory from '$lib/components/scoring/ThrowHistory.svelte';
	import TurnIndicator from '$lib/components/scoring/TurnIndicator.svelte';
	import CheckoutHelper from '$lib/components/scoring/CheckoutHelper.svelte';
	import LegHistory from '$lib/components/scoring/LegHistory.svelte';
	import type { LegRecord } from '$lib/components/scoring/LegHistory.svelte';
	import AnimationOverlay from '$lib/components/animations/AnimationOverlay.svelte';
	import ClubCrest from '$lib/components/clubs/ClubCrest.svelte';
	import PlayerStatsCard from '$lib/components/scoring/PlayerStatsCard.svelte';
	import type { PlayerStats } from '$lib/components/scoring/PlayerStatsCard.svelte';
	import CricketScoreBoard from '$lib/components/scoring/CricketScoreBoard.svelte';
	import { getContext } from 'svelte';
	import { createGameState, type GameStore } from '$lib/stores/game.svelte.js';
	import { createCricketGameState, type CricketGameStore } from '$lib/stores/cricket-game.svelte.js';
	import { createAnimationStore } from '$lib/stores/animation.svelte.js';
	import type { SettingsStore } from '$lib/stores/settings.svelte.js';
	import type { DartThrow, Multiplier, SectorValue } from '$lib/types/game.js';
	import { CRICKET_SEGMENTS } from '$lib/types/game.js';
	import type { Player } from '$lib/types/club.js';

	const settingsStore = getContext<SettingsStore>('settings');

	let { data } = $props();

	let homePlayerIndex = $state(0);
	let awayPlayerIndex = $state(0);
	let legNumber = $state(1);
	let matchStarted = $state(data.match.status !== 'scheduled');
	let matchCompleted = $state(data.match.status === 'completed');
	let homeLegsWon = $state(data.match.home_legs_won);
	let awayLegsWon = $state(data.match.away_legs_won);
	let softCheckout = $state(settingsStore.settings.defaultSoftCheckout);

	let game = $state<GameStore | null>(null);
	let cricketGame = $state<CricketGameStore | null>(null);
	const isCricket = $derived(data.tournament.game_mode === 'cricket');
	// Unified accessor for the active game (either standard or cricket)
	const activeGame = $derived(isCricket ? cricketGame : game);
	const animations = createAnimationStore();

	// Input mode from settings
	type InputMode = 'dartboard' | 'keypad' | 'both';
	let inputMode = $state<InputMode>(settingsStore.settings.inputMode);

	function cycleInputMode() {
		const modes: InputMode[] = ['dartboard', 'keypad', 'both'];
		const idx = modes.indexOf(inputMode);
		inputMode = modes[(idx + 1) % modes.length];
		settingsStore.update('inputMode', inputMode);
	}

	// Quadrant zoom for mobile
	let activeQuadrant = $state<Quadrant>('full');
	let isMobile = $state(false);

	$effect(() => {
		if (!browser) return;
		const mq = window.matchMedia('(max-width: 499px)');
		isMobile = mq.matches;
		function onChange(e: MediaQueryListEvent) {
			isMobile = e.matches;
			if (!e.matches) activeQuadrant = 'full';
		}
		mq.addEventListener('change', onChange);
		return () => mq.removeEventListener('change', onChange);
	});

	const QUADRANTS: { id: Quadrant; label: string; sectors: string }[] = [
		{ id: 'top-left', label: '↖', sectors: '11/14/9/12/5' },
		{ id: 'top-right', label: '↗', sectors: '20/1/18/4/13' },
		{ id: 'bottom-left', label: '↙', sectors: '8/16/7/19/3' },
		{ id: 'bottom-right', label: '↘', sectors: '6/10/15/2/17' },
	];

	// Leg history tracking
	let completedLegs = $state<LegRecord[]>([]);

	function extractLegRecord(g: GameStore | CricketGameStore): LegRecord {
		const throws = g.throws;
		const winnerId = g.winner_player_id!;
		const winner = winnerId === g.home_player.id ? g.home_player : g.away_player;

		// Darts thrown by the winner
		const winnerThrows = throws.filter((t) => t.player_id === winnerId && !t.is_bust);
		const dartsThrown = throws.filter((t) => t.player_id === winnerId).length;

		// Highest turn score (sum of non-bust throws in a single turn for the winner)
		const turnMap = new Map<number, number>();
		for (const t of winnerThrows) {
			turnMap.set(t.turn_number, (turnMap.get(t.turn_number) ?? 0) + t.score);
		}
		const highestTurn = turnMap.size > 0 ? Math.max(...turnMap.values()) : 0;

		// Checkout score: score of the final throw
		const lastThrow = [...throws].reverse().find((t) => t.player_id === winnerId && !t.is_bust);
		const checkoutScore = lastThrow?.score ?? 0;

		return {
			legNumber: g.leg_number,
			winnerName: `${winner.first_name} ${winner.last_name}`,
			dartsThrown,
			highestTurn,
			checkoutScore
		};
	}

	// Best-of / match progress derived values
	const legsToWin = $derived(Math.ceil(data.tournament.sets_per_match / 2));
	const totalLegs = $derived(data.tournament.sets_per_match);

	const bestOfText = $derived(`Best of ${totalLegs} Legs`);

	const progressText = $derived.by(() => {
		const homeNeeds = legsToWin - homeLegsWon;
		const awayNeeds = legsToWin - awayLegsWon;

		if (homeLegsWon === awayLegsWon) return 'Gleichstand';
		if (homeLegsWon > awayLegsWon) {
			if (homeNeeds === 1) return `${data.match.home_club.short_name}: Match Point!`;
			return `${data.match.home_club.short_name} führt — noch ${homeNeeds} Leg${homeNeeds !== 1 ? 's' : ''} zum Sieg`;
		}
		if (awayNeeds === 1) return `${data.match.away_club.short_name}: Match Point!`;
		return `${data.match.away_club.short_name} führt — noch ${awayNeeds} Leg${awayNeeds !== 1 ? 's' : ''} zum Sieg`;
	});

	const isMatchPoint = $derived(
		(legsToWin - homeLegsWon === 1) || (legsToWin - awayLegsWon === 1)
	);

	// Player stats for the selection screen
	let homeStats = $state<PlayerStats | null>(null);
	let awayStats = $state<PlayerStats | null>(null);
	let homeStatsLoading = $state(false);
	let awayStatsLoading = $state(false);

	async function fetchPlayerStats(playerId: string): Promise<PlayerStats | null> {
		try {
			const res = await fetch(`/api/players/${playerId}/stats`);
			if (!res.ok) return null;
			return await res.json();
		} catch {
			return null;
		}
	}

	$effect(() => {
		const player = data.homePlayers[homePlayerIndex];
		if (!player || matchStarted) return;
		homeStatsLoading = true;
		fetchPlayerStats(player.id).then((s) => {
			homeStats = s;
			homeStatsLoading = false;
		});
	});

	$effect(() => {
		const player = data.awayPlayers[awayPlayerIndex];
		if (!player || matchStarted) return;
		awayStatsLoading = true;
		fetchPlayerStats(player.id).then((s) => {
			awayStats = s;
			awayStatsLoading = false;
		});
	});

	$effect(() => {
		if (game && !isCricket) {
			game.setSoftCheckout(softCheckout);
		}
	});

	const startingScore = $derived(
		data.tournament.game_mode === '301' ? 301 : data.tournament.game_mode === 'cricket' ? 0 : 501
	);

	function playerLabel(player: Player, stats: PlayerStats | null): string {
		let label = `${player.first_name} ${player.last_name}`;
		if (player.nickname) label += ` (${player.nickname})`;
		if (stats?.average != null) {
			label += ` — ⌀ ${stats.average.toFixed(1)}`;
		} else {
			label += ' — keine Spiele';
		}
		return label;
	}

	function startGame() {
		const homePlayer = data.homePlayers[homePlayerIndex];
		const awayPlayer = data.awayPlayers[awayPlayerIndex];
		if (!homePlayer || !awayPlayer) return;

		if (isCricket) {
			cricketGame = createCricketGameState({
				match_id: data.match.id,
				leg_number: legNumber,
				home_player: homePlayer,
				away_player: awayPlayer
			});
		} else {
			game = createGameState({
				match_id: data.match.id,
				leg_number: legNumber,
				home_player: homePlayer,
				away_player: awayPlayer,
				starting_score: startingScore,
				softCheckout
			});
		}
		matchStarted = true;
	}

	function handleHit(event: { sector: SectorValue; multiplier: Multiplier; score: number }) {
		const g = activeGame;
		if (!g || g.status === 'completed') return;
		try {
			g.registerThrow(event.sector, event.multiplier);

			if (g.lastSpecialHit && settingsStore.isAnimationEnabled(g.lastSpecialHit)) {
				animations.trigger(g.lastSpecialHit);
			}
		} catch (err) {
			console.error('Error registering throw:', err);
		}
	}

	function handleMiss() {
		handleHit({ sector: 0 as SectorValue, multiplier: 0 as Multiplier, score: 0 });
	}

	function handleUndo() {
		const g = activeGame;
		if (!g) return;
		g.undoLastThrow();
	}

	// Forfeit state
	let showForfeitDialog = $state(false);
	let forfeitStep = $state<'choose' | 'confirm-leg' | 'confirm-match'>('choose');
	let forfeitSaving = $state(false);

	function openForfeitDialog() {
		forfeitStep = 'choose';
		showForfeitDialog = true;
	}

	function closeForfeitDialog() {
		showForfeitDialog = false;
		forfeitStep = 'choose';
	}

	// The side that forfeits is the current player's side
	const forfeitSide = $derived(
		activeGame && activeGame.current_player_id === activeGame.home_player.id ? 'home' : 'away'
	);
	const opponentClubName = $derived(
		forfeitSide === 'home' ? data.match.away_club.name : data.match.home_club.name
	);

	async function handleForfeitLeg() {
		if (!activeGame || forfeitSaving) return;
		forfeitSaving = true;

		try {
			const formData = new FormData();
			formData.set('forfeit_side', forfeitSide!);

			const response = await fetch('?/forfeitLeg', {
				method: 'POST',
				body: formData,
				headers: { 'x-sveltekit-action': 'true' }
			});

			if (!response.ok) {
				console.error('Failed to forfeit leg:', response.status);
				return;
			}

			const result = await response.json();

			// Award leg to opponent
			if (forfeitSide === 'home') {
				awayLegsWon++;
			} else {
				homeLegsWon++;
			}

			closeForfeitDialog();

			// Check match completion
			if (result.data?.matchCompleted || homeLegsWon >= legsToWin || awayLegsWon >= legsToWin) {
				matchCompleted = true;
				return;
			}

			// Start next leg
			legNumber++;
			if (isCricket) {
				cricketGame = createCricketGameState({
					match_id: data.match.id,
					leg_number: legNumber,
					home_player: data.homePlayers[homePlayerIndex],
					away_player: data.awayPlayers[awayPlayerIndex]
				});
			} else {
				game = createGameState({
					match_id: data.match.id,
					leg_number: legNumber,
					home_player: data.homePlayers[homePlayerIndex],
					away_player: data.awayPlayers[awayPlayerIndex],
					starting_score: startingScore,
					softCheckout
				});
			}
		} catch (err) {
			console.error('Error forfeiting leg:', err);
		} finally {
			forfeitSaving = false;
		}
	}

	async function handleConcedeMatch() {
		if (!activeGame || forfeitSaving) return;
		forfeitSaving = true;

		try {
			const formData = new FormData();
			formData.set('forfeit_side', forfeitSide!);

			const response = await fetch('?/concedeMatch', {
				method: 'POST',
				body: formData,
				headers: { 'x-sveltekit-action': 'true' }
			});

			if (!response.ok) {
				console.error('Failed to concede match:', response.status);
				return;
			}

			// Set final score
			if (forfeitSide === 'home') {
				awayLegsWon = legsToWin;
			} else {
				homeLegsWon = legsToWin;
			}

			closeForfeitDialog();
			matchCompleted = true;
		} catch (err) {
			console.error('Error conceding match:', err);
		} finally {
			forfeitSaving = false;
		}
	}

	let legSaving = $state(false);

	async function handleLegComplete() {
		const g = activeGame;
		if (!g || g.status !== 'completed' || !g.winner_player_id) return;
		if (legSaving) return;

		legSaving = true;
		const winnerSide = g.winner_player_id === g.home_player.id ? 'home' : 'away';

		// Capture leg record before resetting game state
		const legRecord = extractLegRecord(g);

		try {
			const formData = new FormData();
			formData.set('winner_side', winnerSide);

			// Serialize throws for persistence (map game_id → match_id)
			const throwsData = g.throws.map((t: DartThrow) => ({
				...t,
				game_id: data.match.id,
				leg_number: legNumber
			}));
			formData.set('throws', JSON.stringify(throwsData));

			const response = await fetch('?/completeLeg', {
				method: 'POST',
				body: formData,
				headers: { 'x-sveltekit-action': 'true' }
			});

			if (!response.ok) {
				console.error('Failed to save leg result:', response.status);
				return;
			}

			completedLegs = [...completedLegs, legRecord];

			if (winnerSide === 'home') {
				homeLegsWon++;
			} else {
				awayLegsWon++;
			}

			// Check for match completion
			if (homeLegsWon >= legsToWin || awayLegsWon >= legsToWin) {
				matchCompleted = true;
				return;
			}

			// Start next leg
			legNumber++;
			if (isCricket) {
				cricketGame = createCricketGameState({
					match_id: data.match.id,
					leg_number: legNumber,
					home_player: data.homePlayers[homePlayerIndex],
					away_player: data.awayPlayers[awayPlayerIndex]
				});
			} else {
				game = createGameState({
					match_id: data.match.id,
					leg_number: legNumber,
					home_player: data.homePlayers[homePlayerIndex],
					away_player: data.awayPlayers[awayPlayerIndex],
					starting_score: startingScore,
					softCheckout
				});
			}
		} catch (err) {
			console.error('Error saving leg result:', err);
		} finally {
			legSaving = false;
		}
	}
</script>

<div class="flex flex-col gap-4" data-testid="game-page">
	<div class="flex items-center gap-4">
		<a href="/tournaments/{data.tournament.id}" class="btn btn-ghost btn-sm">Zurueck</a>
		<h1 class="text-xl font-bold flex-1">
			{data.match.home_club.short_name} vs {data.match.away_club.short_name}
		</h1>
		{#if matchStarted && !matchCompleted}
			<button
				class="btn btn-outline btn-error btn-sm"
				onclick={openForfeitDialog}
				data-testid="forfeit-btn"
			>
				Aufgeben
			</button>
		{/if}
	</div>

	<!-- Match Score Header -->
	<div class="flex flex-col items-center gap-1 p-4 bg-base-100 rounded-lg shadow-sm" data-testid="match-score-header">
		<div class="flex items-center justify-center gap-6 w-full">
			<div class="flex items-center gap-2">
				<ClubCrest
					club_id={data.match.home_club.id}
					has_crest={data.match.home_club.has_crest}
					crest_url={data.match.home_club.crest_url}
					club_name={data.match.home_club.name}
					primary_color={data.match.home_club.primary_color}
					size={40}
				/>
				<span class="font-bold">{data.match.home_club.short_name}</span>
			</div>
			<div class="text-3xl font-bold tabular-nums" data-testid="match-legs-score">
				{homeLegsWon} : {awayLegsWon}
			</div>
			<div class="flex items-center gap-2">
				<span class="font-bold">{data.match.away_club.short_name}</span>
				<ClubCrest
					club_id={data.match.away_club.id}
					has_crest={data.match.away_club.has_crest}
					crest_url={data.match.away_club.crest_url}
					club_name={data.match.away_club.name}
					primary_color={data.match.away_club.primary_color}
					size={40}
				/>
			</div>
		</div>

		<!-- Best-of indicator -->
		{#if matchStarted && !matchCompleted}
			<div class="flex flex-col items-center gap-1 mt-1" data-testid="best-of-indicator">
				<span class="text-xs text-base-content/50">{bestOfText}</span>
				{#if isMatchPoint}
					<span class="badge badge-warning animate-pulse font-semibold" data-testid="match-point-badge">
						{progressText}
					</span>
				{:else}
					<span class="text-xs text-base-content/60" data-testid="progress-text">{progressText}</span>
				{/if}
			</div>
		{/if}
	</div>

	{#if matchCompleted}
		<div class="card bg-success/10 border border-success/30 shadow-sm" data-testid="match-completed">
			<div class="card-body text-center">
				<h2 class="text-2xl font-bold">Spiel beendet!</h2>
				<p class="text-lg">
					{homeLegsWon > awayLegsWon ? data.match.home_club.name : data.match.away_club.name} gewinnt!
				</p>
				{#if completedLegs.length > 0}
					<div class="mt-4">
						<LegHistory legs={completedLegs} currentLegNumber={legNumber} />
					</div>
				{/if}
				<a href="/tournaments/{data.tournament.id}" class="btn btn-primary mt-4">Zum Turnier</a>
			</div>
		</div>
	{:else if !matchStarted}
		<!-- Player Selection -->
		<div class="card bg-base-100 shadow-sm" data-testid="player-selection">
			<div class="card-body">
				<h2 class="card-title">Spieler waehlen</h2>
				<div class="grid grid-cols-2 gap-4">
					<div class="form-control">
						<label class="label text-sm" for="home-player">Heim</label>
						<select id="home-player" class="select select-bordered" bind:value={homePlayerIndex} data-testid="home-player-select">
							{#each data.homePlayers as player, i (player.id)}
								<option value={i}>{playerLabel(player, null)}</option>
							{/each}
						</select>
						{#if data.homePlayers[homePlayerIndex]}
							<div class="mt-2">
								<PlayerStatsCard
									player={data.homePlayers[homePlayerIndex]}
									clubName={data.match.home_club.name}
									stats={homeStats}
									loading={homeStatsLoading}
								/>
							</div>
						{/if}
					</div>
					<div class="form-control">
						<label class="label text-sm" for="away-player">Gast</label>
						<select id="away-player" class="select select-bordered" bind:value={awayPlayerIndex} data-testid="away-player-select">
							{#each data.awayPlayers as player, i (player.id)}
								<option value={i}>{playerLabel(player, null)}</option>
							{/each}
						</select>
						{#if data.awayPlayers[awayPlayerIndex]}
							<div class="mt-2">
								<PlayerStatsCard
									player={data.awayPlayers[awayPlayerIndex]}
									clubName={data.match.away_club.name}
									stats={awayStats}
									loading={awayStatsLoading}
								/>
							</div>
						{/if}
					</div>
				</div>
				{#if !isCricket}
					<div class="form-control mt-4">
						<label class="label cursor-pointer justify-start gap-3">
							<input type="checkbox" class="checkbox checkbox-primary" bind:checked={softCheckout} data-testid="soft-checkout-toggle" />
							<div>
								<span class="label-text font-medium">Einfaches Checkout</span>
								<p class="text-xs text-base-content/60">Ueberwerfen erlaubt — kein exaktes Finish auf Doppel noetig</p>
							</div>
						</label>
					</div>
				{/if}
				<button class="btn btn-primary mt-2" onclick={startGame} data-testid="start-game-btn">
					Spiel starten
				</button>
			</div>
		</div>
	{:else if activeGame}
		{@const g = activeGame}
		<!-- Animation Overlay -->
		<AnimationOverlay
			{animations}
			playerName={g.status === 'completed' ? `${g.currentPlayer.first_name} ${g.currentPlayer.last_name}` : ''}
		/>

		<!-- Active Game -->
		{#if isCricket && cricketGame}
			<CricketScoreBoard game={cricketGame} />
		{:else if game}
			<ScoreBoard {game} />
		{/if}

		<TurnIndicator game={g} />

		<!-- Leg History -->
		<LegHistory legs={completedLegs} currentLegNumber={legNumber} />

		<div class="grid gap-4 lg:grid-cols-2">
			<div class="flex flex-col items-center gap-4">
				<!-- Input mode toggle -->
				<div class="flex items-center gap-2">
					<button
						class="btn btn-ghost btn-xs"
						onclick={cycleInputMode}
						title="Eingabemodus wechseln"
						aria-label="Eingabemodus wechseln"
						data-testid="input-mode-toggle"
					>
						{#if inputMode === 'dartboard'}
							<!-- Dartboard icon -->
							<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
								<circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
							</svg>
							<span class="text-xs">Dartboard</span>
						{:else if inputMode === 'keypad'}
							<!-- Keypad icon -->
							<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
								<rect x="4" y="4" width="16" height="16" rx="2" /><path d="M8 8h.01M12 8h.01M16 8h.01M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01" stroke-linecap="round" />
							</svg>
							<span class="text-xs">Tastatur</span>
						{:else}
							<!-- Both icon -->
							<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
								<circle cx="8" cy="12" r="5" /><rect x="14" y="8" width="8" height="8" rx="1" />
							</svg>
							<span class="text-xs">Beides</span>
						{/if}
					</button>
				</div>

				<!-- Quadrant zoom selector (mobile or manual toggle) -->
				{#if (inputMode === 'dartboard' || inputMode === 'both') && (isMobile || activeQuadrant !== 'full')}
					<div class="flex items-center gap-1" data-testid="quadrant-selector">
						<button
							class="btn btn-xs {activeQuadrant === 'full' ? 'btn-primary' : 'btn-ghost'}"
							onclick={() => (activeQuadrant = 'full')}
						>Voll</button>
						{#each QUADRANTS as q (q.id)}
							<button
								class="btn btn-xs {activeQuadrant === q.id ? 'btn-primary' : 'btn-outline'}"
								onclick={() => (activeQuadrant = q.id)}
								title={q.sectors}
							>{q.label}</button>
						{/each}
					</div>
				{/if}

				<!-- Dartboard (shown in dartboard or both mode) -->
				{#if inputMode === 'dartboard' || inputMode === 'both'}
					<Dartboard
						size={inputMode === 'both' ? 280 : isMobile ? Math.min(350, 300) : 350}
						disabled={g.status === 'completed'}
						quadrant={activeQuadrant}
						highlightSegments={isCricket ? [...CRICKET_SEGMENTS] : []}
						onhit={handleHit}
					/>
					<div class="flex items-center gap-2">
						<button
							class="btn btn-ghost btn-sm"
							onclick={handleMiss}
							disabled={g.status === 'completed'}
							data-testid="dartboard-miss-btn"
						>Miss (0)</button>
						<!-- Manual zoom toggle on non-mobile -->
						{#if !isMobile}
							<button
								class="btn btn-ghost btn-xs opacity-50 hover:opacity-100"
								onclick={() => (activeQuadrant = activeQuadrant === 'full' ? 'top-right' : 'full')}
								title="Zoom-Modus umschalten"
								aria-label="Zoom-Modus umschalten"
								data-testid="zoom-toggle"
							>
								<svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
									<circle cx="11" cy="11" r="8" /><path stroke-linecap="round" d="M21 21l-4.35-4.35M8 11h6M11 8v6" />
								</svg>
								<span class="text-xs">Zoom</span>
							</button>
						{/if}
					</div>
				{/if}

				<!-- Keypad (shown in keypad or both mode) -->
				{#if inputMode === 'keypad' || inputMode === 'both'}
					<div class="w-full max-w-sm">
						<ScoreKeypad
							disabled={g.status === 'completed'}
							onhit={handleHit}
						/>
					</div>
				{/if}

				<div class="flex flex-wrap items-center gap-2">
					<button
						class="btn btn-outline btn-sm"
						onclick={handleUndo}
						disabled={g.throws.length === 0}
						data-testid="undo-btn"
					>
						Rueckgaengig
					</button>
					{#if g.status === 'completed'}
						<button
							class="btn btn-primary btn-sm"
							onclick={handleLegComplete}
							disabled={legSaving}
							data-testid="next-leg-btn"
						>
							{#if legSaving}
								<span class="loading loading-spinner loading-xs"></span>
							{/if}
							Leg bestaetigen
						</button>
					{/if}
					{#if !isCricket}
						<label class="label cursor-pointer gap-2 ml-auto">
							<span class="label-text text-xs">Einfaches Checkout</span>
							<input type="checkbox" class="toggle toggle-primary toggle-sm" bind:checked={softCheckout} data-testid="soft-checkout-toggle" />
						</label>
					{/if}
				</div>
			</div>

			<div class="flex flex-col gap-4">
				{#if !isCricket && settingsStore.settings.showCheckoutHelper}
					<CheckoutHelper remaining={g.currentRemaining} checkoutRoutes={g.checkoutRoutes} />
				{/if}
				<ThrowHistory throws={g.throws} currentTurnThrows={g.currentTurnThrows} />
			</div>
		</div>
	{/if}

	<!-- Forfeit Dialog -->
	{#if showForfeitDialog}
		<div class="modal modal-open" data-testid="forfeit-dialog">
			<div class="modal-box">
				{#if forfeitStep === 'choose'}
					<h3 class="font-bold text-lg">Aufgeben</h3>
					<p class="py-4 text-base-content/70">Was moechtest du aufgeben?</p>
					<div class="flex flex-col gap-3">
						<button
							class="btn btn-outline btn-warning"
							onclick={() => (forfeitStep = 'confirm-leg')}
							data-testid="forfeit-leg-option"
						>
							Leg aufgeben
						</button>
						<button
							class="btn btn-outline btn-error"
							onclick={() => (forfeitStep = 'confirm-match')}
							data-testid="forfeit-match-option"
						>
							Match aufgeben
						</button>
					</div>
					<div class="modal-action">
						<button class="btn btn-ghost" onclick={closeForfeitDialog}>Abbrechen</button>
					</div>

				{:else if forfeitStep === 'confirm-leg'}
					<h3 class="font-bold text-lg text-warning">Leg aufgeben?</h3>
					<p class="py-4">
						Leg {legNumber} wird <strong>{opponentClubName}</strong> zugesprochen.
						Das Spiel geht weiter.
					</p>
					<div class="modal-action">
						<button class="btn btn-ghost" onclick={() => (forfeitStep = 'choose')}>Zurueck</button>
						<button
							class="btn btn-warning"
							onclick={handleForfeitLeg}
							disabled={forfeitSaving}
							data-testid="forfeit-leg-confirm"
						>
							{#if forfeitSaving}
								<span class="loading loading-spinner loading-xs"></span>
							{/if}
							Leg aufgeben
						</button>
					</div>

				{:else if forfeitStep === 'confirm-match'}
					<h3 class="font-bold text-lg text-error">Match aufgeben?</h3>
					<div class="py-4 flex flex-col gap-2">
						<p>
							Das gesamte Match wird <strong>{opponentClubName}</strong> zugesprochen.
						</p>
						<p>Alle verbleibenden Legs werden gewertet.</p>
						<p class="text-error text-sm font-medium">Diese Aktion kann nicht rueckgaengig gemacht werden.</p>
					</div>
					<div class="modal-action">
						<button class="btn btn-ghost" onclick={() => (forfeitStep = 'choose')}>Zurueck</button>
						<button
							class="btn btn-error"
							onclick={handleConcedeMatch}
							disabled={forfeitSaving}
							data-testid="forfeit-match-confirm"
						>
							{#if forfeitSaving}
								<span class="loading loading-spinner loading-xs"></span>
							{/if}
							Match aufgeben
						</button>
					</div>
				{/if}
			</div>
			<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
			<div class="modal-backdrop" onclick={closeForfeitDialog}></div>
		</div>
	{/if}
</div>
