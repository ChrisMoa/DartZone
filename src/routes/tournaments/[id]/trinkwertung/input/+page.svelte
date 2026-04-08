<script lang="ts">
	import ClubCrest from '$lib/components/clubs/ClubCrest.svelte';

	let { data } = $props();

	const isRunning = $derived(data.drinkingGame.status === 'running');
</script>

<div class="flex flex-col gap-6">
	<div class="flex items-center gap-4">
		<a href="/tournaments/{data.tournament.id}/trinkwertung" class="btn btn-ghost btn-sm">Zurueck</a>
		<h1 class="text-2xl font-bold">Trinkwertung – Eingabe</h1>
		<span class="badge {isRunning ? 'badge-success' : 'badge-neutral'}">
			{isRunning ? 'Laufend' : 'Beendet'}
		</span>
	</div>

	{#if !isRunning}
		<div class="alert alert-warning">
			Die Trinkwertung ist beendet. Aenderungen sind nicht mehr moeglich.
		</div>
	{/if}

	<div class="grid gap-4 sm:grid-cols-2" data-testid="drinking-input">
		{#each data.scores as score (score.club_id)}
			<div class="card bg-base-100 shadow-sm" data-testid="drinking-input-card">
				<div class="card-body p-4 flex-row items-center gap-4">
					<ClubCrest
						club_id={score.club_id}
						has_crest={score.has_crest}
						club_name={score.club_name}
						primary_color={score.primary_color}
						size={40}
					/>
					<div class="flex flex-col flex-1 min-w-0">
						<span class="font-semibold truncate">{score.club_name}</span>
						<span class="text-2xl font-bold tabular-nums" data-testid="drink-count">
							{score.drink_count}
						</span>
					</div>
					<div class="flex flex-col gap-2">
						<form method="POST" action="?/increment">
							<input type="hidden" name="club_id" value={score.club_id} />
							<button
								type="submit"
								class="btn btn-success btn-lg"
								disabled={!isRunning}
								data-testid="increment-btn"
							>
								+
							</button>
						</form>
						<form method="POST" action="?/decrement">
							<input type="hidden" name="club_id" value={score.club_id} />
							<button
								type="submit"
								class="btn btn-outline btn-sm"
								disabled={!isRunning || score.drink_count === 0}
								data-testid="decrement-btn"
							>
								-
							</button>
						</form>
					</div>
				</div>
			</div>
		{/each}
	</div>
</div>
