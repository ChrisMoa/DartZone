<script lang="ts">
	import DrinkingProgressBar from '$lib/components/drinking/DrinkingProgressBar.svelte';

	let { data } = $props();

	const maxCount = $derived(
		Math.max(1, ...data.scores.map((s: { drink_count: number }) => s.drink_count))
	);
</script>

<div class="flex flex-col gap-6">
	<div class="flex items-center gap-4">
		<a href="/tournaments/{data.tournament.id}" class="btn btn-ghost btn-sm">Zurueck</a>
		<h1 class="text-2xl font-bold">Trinkwertung</h1>
		{#if data.drinkingGame}
			<span class="badge {data.drinkingGame.status === 'running' ? 'badge-success' : 'badge-neutral'}">
				{data.drinkingGame.status === 'running' ? 'Laufend' : 'Beendet'}
			</span>
		{/if}
	</div>

	{#if !data.drinkingGame}
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
			{#if data.drinkingGame.status === 'running'}
				<form method="POST" action="?/finish">
					<button type="submit" class="btn btn-outline btn-sm" data-testid="finish-drinking-game-btn">
						Beenden
					</button>
				</form>
			{/if}
		</div>

		{#if data.scores.length === 0}
			<p class="text-base-content/60">Keine Vereine zugeordnet.</p>
		{:else}
			<div class="flex flex-col gap-3" data-testid="drinking-display">
				{#each data.scores as score (score.club_id)}
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
