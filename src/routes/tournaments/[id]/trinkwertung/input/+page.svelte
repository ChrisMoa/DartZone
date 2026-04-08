<script lang="ts">
	import ClubCrest from '$lib/components/clubs/ClubCrest.svelte';
	import type { DrinkingScore } from '$lib/types/league.js';

	let { data } = $props();

	let scores = $state<DrinkingScore[]>(
		[...data.scores].sort((a, b) => a.club_name.localeCompare(b.club_name))
	);
	let sending = $state<string | null>(null);
	let customClubId = $state<string | null>(null);
	let customValue = $state('2');

	const isRunning = $derived(data.drinkingGame.status === 'running');

	async function addDrinks(clubId: string, amount: number) {
		if (sending || !isRunning) return;

		sending = clubId;
		try {
			const res = await fetch(`/api/tournaments/${data.tournament.id}/trinkwertung`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ clubId, amount })
			});
			if (res.ok) {
				const result = await res.json();
				scores = (result.scores as DrinkingScore[]).sort((a, b) =>
					a.club_name.localeCompare(b.club_name)
				);
			}
		} finally {
			sending = null;
		}
	}

	function toggleCustom(clubId: string) {
		customClubId = customClubId === clubId ? null : clubId;
		customValue = '2';
	}

	function submitCustom(clubId: string, positive: boolean) {
		const val = parseInt(customValue, 10);
		if (!isNaN(val) && val > 0) {
			addDrinks(clubId, positive ? val : -val);
			customClubId = null;
		}
	}
</script>

<div class="flex flex-col gap-4 max-w-lg mx-auto">
	<div class="flex items-center gap-4">
		<a href="/tournaments/{data.tournament.id}/trinkwertung" class="btn btn-ghost btn-sm">Zurueck</a>
		<h1 class="text-2xl font-bold">Trinkwertung – Eingabe</h1>
	</div>

	{#if !isRunning}
		<div class="alert alert-warning">
			Die Trinkwertung ist beendet. Aenderungen sind nicht mehr moeglich.
		</div>
	{/if}

	<div class="flex flex-col gap-3" data-testid="drinking-input">
		{#each scores as score (score.club_id)}
			{@const isActive = sending === score.club_id}
			<div class="card bg-base-100 shadow-sm" data-testid="drinking-input-card">
				<div class="card-body p-3 gap-2">
					<div class="flex items-center gap-3">
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
						<div class="flex items-center gap-2">
							<button
								type="button"
								class="btn btn-outline btn-sm"
								disabled={!isRunning || isActive || score.drink_count === 0}
								onclick={() => addDrinks(score.club_id, -1)}
								data-testid="decrement-btn"
							>
								-1
							</button>
							<button
								type="button"
								class="btn btn-success btn-lg text-xl min-w-16"
								disabled={!isRunning || isActive}
								onclick={() => addDrinks(score.club_id, 1)}
								data-testid="increment-btn"
							>
								{isActive ? '...' : '+1'}
							</button>
							<button
								type="button"
								class="btn btn-ghost btn-sm"
								disabled={!isRunning}
								onclick={() => toggleCustom(score.club_id)}
								data-testid="custom-toggle-btn"
								title="Andere Anzahl eingeben"
							>
								#
							</button>
						</div>
					</div>

					{#if customClubId === score.club_id}
						<div class="flex items-center gap-2 pt-1 border-t border-base-200" data-testid="custom-input-row">
							<span class="text-sm text-base-content/60">Anzahl:</span>
							<div class="join flex-1">
								{#each ['2', '3', '5', '10'] as val}
									<button
										type="button"
										class="join-item btn btn-sm {customValue === val ? 'btn-primary' : ''}"
										onclick={() => (customValue = val)}
									>
										{val}
									</button>
								{/each}
							</div>
							<button
								type="button"
								class="btn btn-error btn-sm"
								disabled={isActive || score.drink_count === 0}
								onclick={() => submitCustom(score.club_id, false)}
								data-testid="custom-subtract-btn"
							>
								-{customValue}
							</button>
							<button
								type="button"
								class="btn btn-success btn-sm"
								disabled={isActive}
								onclick={() => submitCustom(score.club_id, true)}
								data-testid="custom-add-btn"
							>
								+{customValue}
							</button>
						</div>
					{/if}
				</div>
			</div>
		{/each}
	</div>
</div>
