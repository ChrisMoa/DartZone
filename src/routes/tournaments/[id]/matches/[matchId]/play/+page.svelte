<script lang="ts">
	import Dartboard from '$lib/components/dartboard/Dartboard.svelte';
	import ScoreBoard from '$lib/components/scoring/ScoreBoard.svelte';
	import ThrowHistory from '$lib/components/scoring/ThrowHistory.svelte';
	import TurnIndicator from '$lib/components/scoring/TurnIndicator.svelte';
	import CheckoutHelper from '$lib/components/scoring/CheckoutHelper.svelte';
	import LegHistory from '$lib/components/scoring/LegHistory.svelte';
	import type { LegRecord } from '$lib/components/scoring/LegHistory.svelte';
	import AnimationOverlay from '$lib/components/animations/AnimationOverlay.svelte';
	import ClubCrest from '$lib/components/clubs/ClubCrest.svelte';
	import PlayerStatsCard from '$lib/components/scoring/PlayerStatsCard.svelte';
	import type { PlayerStats } from '$lib/components/scoring/PlayerStatsCard.svelte';
	import { createGameState, type GameStore } from '$lib/stores/game.svelte.js';
	import { createAnimationStore } from '$lib/stores/animation.svelte.js';
	import type { DartThrow, Multiplier, SectorValue } from '$lib/types/game.js';
	import type { Player } from '$lib/types/club.js';

	let { data } = $props();

	let homePlayerIndex = $state(0);
	let awayPlayerIndex = $state(0);
	let legNumber = $state(1);
	let matchStarted = $state(data.match.status !== 'scheduled');
	let matchCompleted = $state(data.match.status === 'completed');
	let homeLegsWon = $state(data.match.home_legs_won);
	let awayLegsWon = $state(data.match.away_legs_won);
	let softCheckout = $state(false);

	let game = $state<GameStore | null>(null);
	const animations = createAnimationStore();

	// Leg history tracking
	let completedLegs = $state<LegRecord[]>([]);

	function extractLegRecord(g: GameStore): LegRecord {
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
		if (game) {
			game.setSoftCheckout(softCheckout);
		}
	});

	const startingScore = $derived(
		data.tournament.game_mode === '301' ? 301 : 501
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

		game = createGameState({
			match_id: data.match.id,
			leg_number: legNumber,
			home_player: homePlayer,
			away_player: awayPlayer,
			starting_score: startingScore,
			softCheckout
		});
		matchStarted = true;
	}

	function handleHit(event: { sector: SectorValue; multiplier: Multiplier; score: number }) {
		if (!game || game.status === 'completed') return;
		game.registerThrow(event.sector, event.multiplier);

		if (game.lastSpecialHit) {
			animations.trigger(game.lastSpecialHit);
		}
	}

	function handleUndo() {
		if (!game) return;
		game.undoLastThrow();
	}

	let legSaving = $state(false);

	async function handleLegComplete() {
		if (!game || game.status !== 'completed' || !game.winner_player_id) return;
		if (legSaving) return;

		legSaving = true;
		const winnerSide = game.winner_player_id === game.home_player.id ? 'home' : 'away';

		// Capture leg record before resetting game state
		const legRecord = extractLegRecord(game);

		try {
			const formData = new FormData();
			formData.set('winner_side', winnerSide);

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
			game = createGameState({
				match_id: data.match.id,
				leg_number: legNumber,
				home_player: data.homePlayers[homePlayerIndex],
				away_player: data.awayPlayers[awayPlayerIndex],
				starting_score: startingScore,
				softCheckout
			});
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
		<h1 class="text-xl font-bold">
			{data.match.home_club.short_name} vs {data.match.away_club.short_name}
		</h1>
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
				<div class="form-control mt-4">
					<label class="label cursor-pointer justify-start gap-3">
						<input type="checkbox" class="checkbox checkbox-primary" bind:checked={softCheckout} data-testid="soft-checkout-toggle" />
						<div>
							<span class="label-text font-medium">Einfaches Checkout</span>
							<p class="text-xs text-base-content/60">Ueberwerfen erlaubt — kein exaktes Finish auf Doppel noetig</p>
						</div>
					</label>
				</div>
				<button class="btn btn-primary mt-2" onclick={startGame} data-testid="start-game-btn">
					Spiel starten
				</button>
			</div>
		</div>
	{:else if game}
		<!-- Animation Overlay -->
		<AnimationOverlay
			{animations}
			playerName={game.status === 'completed' ? `${game.currentPlayer.first_name} ${game.currentPlayer.last_name}` : ''}
		/>

		<!-- Active Game -->
		<ScoreBoard {game} />

		<TurnIndicator {game} />

		<!-- Leg History -->
		<LegHistory legs={completedLegs} currentLegNumber={legNumber} />

		<div class="grid gap-4 lg:grid-cols-2">
			<div class="flex flex-col items-center gap-4">
				<Dartboard
					size={350}
					disabled={game.status === 'completed'}
					onhit={handleHit}
				/>
				<div class="flex flex-wrap items-center gap-2">
					<button
						class="btn btn-outline btn-sm"
						onclick={handleUndo}
						disabled={game.throws.length === 0}
						data-testid="undo-btn"
					>
						Rueckgaengig
					</button>
					{#if game.status === 'completed'}
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
					<label class="label cursor-pointer gap-2 ml-auto">
						<span class="label-text text-xs">Einfaches Checkout</span>
						<input type="checkbox" class="toggle toggle-primary toggle-sm" bind:checked={softCheckout} data-testid="soft-checkout-toggle" />
					</label>
				</div>
			</div>

			<div class="flex flex-col gap-4">
				<CheckoutHelper remaining={game.currentRemaining} checkoutRoute={game.checkoutRoute} />
				<ThrowHistory throws={game.throws} currentTurnThrows={game.currentTurnThrows} />
			</div>
		</div>
	{/if}
</div>
