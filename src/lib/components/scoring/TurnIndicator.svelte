<script lang="ts">
	import type { GameStore } from '$lib/stores/game.svelte.js';

	interface Props {
		game: GameStore;
	}

	let { game }: Props = $props();

	const dartsRemaining = $derived(4 - game.current_dart);
	const playerName = $derived(
		`${game.currentPlayer.first_name} ${game.currentPlayer.last_name}`
	);
</script>

<div class="flex items-center justify-between p-3 bg-base-200 rounded-lg" data-testid="turn-indicator">
	<div class="flex items-center gap-2">
		<span class="text-sm font-medium" data-testid="turn-player-name">{playerName}</span>
		{#if game.currentPlayer.nickname}
			<span class="text-xs text-base-content/50">"{game.currentPlayer.nickname}"</span>
		{/if}
	</div>
	<div class="flex gap-1" data-testid="darts-remaining">
		{#each [1, 2, 3] as dartNum}
			<div
				class="w-5 h-5 rounded-full {dartNum < game.current_dart ? 'bg-base-content/20' : dartNum === game.current_dart ? 'bg-primary' : 'bg-base-300'}"
				data-testid="dart-indicator"
			></div>
		{/each}
	</div>
</div>
