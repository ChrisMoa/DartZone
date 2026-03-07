<script lang="ts">
	import Dartboard from '$lib/components/dartboard/Dartboard.svelte';
	import ScoreBoard from '$lib/components/scoring/ScoreBoard.svelte';
	import ThrowHistory from '$lib/components/scoring/ThrowHistory.svelte';
	import TurnIndicator from '$lib/components/scoring/TurnIndicator.svelte';
	import CheckoutHelper from '$lib/components/scoring/CheckoutHelper.svelte';
	import AnimationOverlay from '$lib/components/animations/AnimationOverlay.svelte';
	import ClubCrest from '$lib/components/clubs/ClubCrest.svelte';
	import { createGameState, type GameStore } from '$lib/stores/game.svelte.js';
	import { createAnimationStore } from '$lib/stores/animation.svelte.js';
	import type { Multiplier, SectorValue } from '$lib/types/game.js';
	import type { Player } from '$lib/types/club.js';

	let { data } = $props();

	let homePlayerIndex = $state(0);
	let awayPlayerIndex = $state(0);
	let legNumber = $state(1);
	let matchStarted = $state(data.match.status !== 'scheduled');
	let matchCompleted = $state(data.match.status === 'completed');
	let homeLegsWon = $state(data.match.home_legs_won);
	let awayLegsWon = $state(data.match.away_legs_won);

	let game = $state<GameStore | null>(null);
	const animations = createAnimationStore();

	const startingScore = $derived(
		data.season.game_mode === '301' ? 301 : 501
	);

	function startGame() {
		const homePlayer = data.homePlayers[homePlayerIndex];
		const awayPlayer = data.awayPlayers[awayPlayerIndex];
		if (!homePlayer || !awayPlayer) return;

		game = createGameState({
			match_id: data.match.id,
			leg_number: legNumber,
			home_player: homePlayer,
			away_player: awayPlayer,
			starting_score: startingScore
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

	async function handleLegComplete() {
		if (!game || game.status !== 'completed' || !game.winner_player_id) return;

		const winnerSide = game.winner_player_id === game.home_player.id ? 'home' : 'away';

		const formData = new FormData();
		formData.set('winner_side', winnerSide);

		const response = await fetch('?/completeLeg', {
			method: 'POST',
			body: formData
		});

		const result = await response.json();

		if (winnerSide === 'home') {
			homeLegsWon++;
		} else {
			awayLegsWon++;
		}

		// Check result for match completion
		const legsToWin = Math.ceil(data.season.sets_per_match / 2);
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
			starting_score: startingScore
		});
	}
</script>

<div class="flex flex-col gap-4" data-testid="game-page">
	<div class="flex items-center gap-4">
		<a href="/seasons/{data.season.id}" class="btn btn-ghost btn-sm">Zurueck</a>
		<h1 class="text-xl font-bold">
			{data.match.home_club.short_name} vs {data.match.away_club.short_name}
		</h1>
	</div>

	<!-- Match Score Header -->
	<div class="flex items-center justify-center gap-6 p-4 bg-base-100 rounded-lg shadow-sm" data-testid="match-score-header">
		<div class="flex items-center gap-2">
			<ClubCrest
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
				crest_url={data.match.away_club.crest_url}
				club_name={data.match.away_club.name}
				primary_color={data.match.away_club.primary_color}
				size={40}
			/>
		</div>
	</div>

	{#if matchCompleted}
		<div class="card bg-success/10 border border-success/30 shadow-sm" data-testid="match-completed">
			<div class="card-body text-center">
				<h2 class="text-2xl font-bold">Spiel beendet!</h2>
				<p class="text-lg">
					{homeLegsWon > awayLegsWon ? data.match.home_club.name : data.match.away_club.name} gewinnt!
				</p>
				<a href="/seasons/{data.season.id}" class="btn btn-primary mt-4">Zur Saison</a>
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
								<option value={i}>{player.first_name} {player.last_name}</option>
							{/each}
						</select>
					</div>
					<div class="form-control">
						<label class="label text-sm" for="away-player">Gast</label>
						<select id="away-player" class="select select-bordered" bind:value={awayPlayerIndex} data-testid="away-player-select">
							{#each data.awayPlayers as player, i (player.id)}
								<option value={i}>{player.first_name} {player.last_name}</option>
							{/each}
						</select>
					</div>
				</div>
				<button class="btn btn-primary mt-4" onclick={startGame} data-testid="start-game-btn">
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

		<div class="grid gap-4 lg:grid-cols-2">
			<div class="flex flex-col items-center gap-4">
				<Dartboard
					size={350}
					disabled={game.status === 'completed'}
					onhit={handleHit}
				/>
				<div class="flex gap-2">
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
							data-testid="next-leg-btn"
						>
							Naechstes Leg
						</button>
					{/if}
				</div>
			</div>

			<div class="flex flex-col gap-4">
				<CheckoutHelper remaining={game.currentRemaining} checkoutRoute={game.checkoutRoute} />
				<ThrowHistory throws={game.throws} currentTurnThrows={game.currentTurnThrows} />
			</div>
		</div>
	{/if}
</div>
