<script lang="ts">
	import type { GameStore } from '$lib/stores/game.svelte.js';

	interface Props {
		game: GameStore;
	}

	let { game }: Props = $props();

	const homeActive = $derived(game.current_player_id === game.home_player.id);
	const awayActive = $derived(game.current_player_id === game.away_player.id);
</script>

<div class="grid grid-cols-3 gap-2" data-testid="scoreboard">
	<div
		class="card p-4 text-center transition-all duration-300 {homeActive ? 'bg-primary text-primary-content ring-2 ring-primary shadow-lg shadow-primary/20' : 'bg-base-100'}"
		data-testid="scoreboard-home"
	>
		<div class="text-sm font-medium truncate" data-testid="scoreboard-home-name">
			{game.home_player.first_name} {game.home_player.last_name}
		</div>
		<div class="text-4xl font-bold my-2 tabular-nums" data-testid="scoreboard-home-remaining">
			{game.home_remaining}
		</div>
		<div class="text-xs opacity-70" data-testid="scoreboard-home-avg">
			Avg: {game.homeAverage.toFixed(1)}
		</div>
	</div>

	<div class="flex flex-col items-center justify-center">
		<div class="text-sm text-base-content/60">Leg {game.leg_number}</div>
		<div class="text-xs text-base-content/40 mt-1">Runde {game.current_turn}</div>
		{#if game.status === 'completed'}
			<div class="badge badge-success mt-2 animate-pulse" data-testid="scoreboard-completed">Checkout!</div>
		{/if}
	</div>

	<div
		class="card p-4 text-center transition-all duration-300 {awayActive ? 'bg-secondary text-secondary-content ring-2 ring-secondary shadow-lg shadow-secondary/20' : 'bg-base-100'}"
		data-testid="scoreboard-away"
	>
		<div class="text-sm font-medium truncate" data-testid="scoreboard-away-name">
			{game.away_player.first_name} {game.away_player.last_name}
		</div>
		<div class="text-4xl font-bold my-2 tabular-nums" data-testid="scoreboard-away-remaining">
			{game.away_remaining}
		</div>
		<div class="text-xs opacity-70" data-testid="scoreboard-away-avg">
			Avg: {game.awayAverage.toFixed(1)}
		</div>
	</div>
</div>
