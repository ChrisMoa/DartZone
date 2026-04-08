<script lang="ts">
	import { onMount } from 'svelte';
	import DrinkingProgressBar from '$lib/components/drinking/DrinkingProgressBar.svelte';
	import type { DrinkingScore, DrinkingGame } from '$lib/types/league.js';

	let { data } = $props();

	let drinkingGame = $state<DrinkingGame | null>(data.drinkingGame);
	let scores = $state<DrinkingScore[]>(data.scores);
	let pollInterval: ReturnType<typeof setInterval> | null = null;

	const maxCount = $derived(
		Math.max(1, ...scores.map((s) => s.drink_count))
	);

	const sortedScores = $derived(
		[...scores].sort((a, b) => b.drink_count - a.drink_count || a.club_name.localeCompare(b.club_name))
	);

	async function fetchScores() {
		try {
			const res = await fetch(`/api/tournaments/${data.tournament.id}/trinkwertung`);
			if (res.ok) {
				const result = await res.json();
				drinkingGame = result.game;
				scores = result.scores;

				if (result.game.status !== 'running' && pollInterval) {
					clearInterval(pollInterval);
					pollInterval = null;
				}
			}
		} catch {
			// silently ignore network errors during polling
		}
	}

	onMount(() => {
		if (drinkingGame?.status === 'running') {
			pollInterval = setInterval(fetchScores, 2000);
		}

		return () => {
			if (pollInterval) clearInterval(pollInterval);
		};
	});
</script>

<div class="flex flex-col gap-6">
	<div class="flex items-center gap-4">
		<a href="/tournaments/{data.tournament.id}" class="btn btn-ghost btn-sm">Zurueck</a>
		<h1 class="text-2xl font-bold">Trinkwertung</h1>
		{#if drinkingGame}
			<span class="badge {drinkingGame.status === 'running' ? 'badge-success' : 'badge-neutral'}">
				{drinkingGame.status === 'running' ? 'Laufend' : 'Beendet'}
			</span>
		{/if}
	</div>

	{#if !drinkingGame}
		<div class="card bg-base-100 shadow-sm">
			<div class="card-body items-center text-center">
				<p class="text-base-content/60 mb-4">Noch keine Trinkwertung fuer dieses Turnier erstellt.</p>
				<form method="POST" action="?/create">
					<button type="submit" class="btn btn-primary" data-testid="create-drinking-game-btn">
						Trinkwertung starten
					</button>
				</form>
			</div>
		</div>
	{:else}
		<div class="flex gap-2 justify-end">
			<a
				href="/tournaments/{data.tournament.id}/trinkwertung/input"
				class="btn btn-primary btn-sm"
				data-testid="drinking-input-link"
			>
				Eingabe
			</a>
			{#if drinkingGame.status === 'running'}
				<form method="POST" action="?/finish">
					<button type="submit" class="btn btn-outline btn-sm" data-testid="finish-drinking-game-btn">
						Beenden
					</button>
				</form>
			{/if}
		</div>

		{#if scores.length === 0}
			<p class="text-base-content/60">Keine Vereine zugeordnet.</p>
		{:else}
			<div class="flex flex-col gap-3" data-testid="drinking-display">
				{#each sortedScores as score (score.club_id)}
					<DrinkingProgressBar
						club_id={score.club_id}
						club_name={score.club_name}
						short_name={score.short_name}
						has_crest={score.has_crest}
						primary_color={score.primary_color}
						drink_count={score.drink_count}
						max_count={maxCount}
					/>
				{/each}
			</div>
		{/if}
	{/if}
</div>
