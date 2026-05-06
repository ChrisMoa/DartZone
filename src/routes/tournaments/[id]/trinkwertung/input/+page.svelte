<script lang="ts">
	import ClubCrest from '$lib/components/clubs/ClubCrest.svelte';
	import { longPress } from '$lib/actions/long-press.js';
	import type { DrinkingScore } from '$lib/types/league.js';

	let { data } = $props();

	let scores = $state<DrinkingScore[]>(
		[...data.scores].sort((a, b) => a.club_name.localeCompare(b.club_name))
	);
	let sending = $state<string | null>(null);

	const isRunning = $derived(data.drinkingGame.status === 'running');

	const QUICK_VALUES = [1, 2, 3, 5, 10] as const;

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
</script>

<div class="flex flex-col gap-4 max-w-4xl mx-auto">
	<div class="flex items-center gap-4">
		<a href="/tournaments/{data.tournament.id}/trinkwertung" class="btn btn-ghost btn-sm">Zurueck</a>
		<h1 class="text-2xl font-bold">Trinkwertung – Eingabe</h1>
	</div>

	<div class="alert alert-info text-sm py-2">
		<svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
			<path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
		</svg>
		<span>Knopf gedrueckt halten, bis er voll faellt — verhindert versehentliche Eingaben.</span>
	</div>

	{#if !isRunning}
		<div class="alert alert-warning">
			Die Trinkwertung ist beendet. Aenderungen sind nicht mehr moeglich.
		</div>
	{/if}

	<div class="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3" data-testid="drinking-input">
		{#each scores as score (score.club_id)}
			{@const isActive = sending === score.club_id}
			{@const isLocked = !isRunning || isActive}
			<div class="card bg-base-100 shadow-sm" data-testid="drinking-input-card">
				<div class="card-body p-3 gap-2">
					<div class="flex items-center gap-2">
						<ClubCrest
							club_id={score.club_id}
							has_crest={score.has_crest}
							club_name={score.club_name}
							primary_color={score.primary_color}
							size={32}
						/>
						<div class="flex-1 min-w-0">
							<div class="font-semibold truncate text-sm leading-tight">{score.club_name}</div>
						</div>
						<div class="text-2xl font-bold tabular-nums" data-testid="drink-count">
							{score.drink_count}
						</div>
						<button
							type="button"
							class="btn btn-outline btn-sm px-2"
							disabled={isLocked || score.drink_count === 0}
							use:longPress={{
								onpress: () => addDrinks(score.club_id, -1),
								disabled: () => isLocked || score.drink_count === 0
							}}
							data-testid="decrement-btn"
							title="Halten fuer −1"
						>
							−1
						</button>
					</div>

					<div class="grid grid-cols-5 gap-1" data-testid="quick-add-row">
						{#each QUICK_VALUES as v}
							<button
								type="button"
								class="btn btn-sm {v === 1 ? 'btn-outline btn-success' : 'btn-success'}"
								disabled={isLocked}
								use:longPress={{
									onpress: () => addDrinks(score.club_id, v),
									disabled: () => isLocked
								}}
								data-testid="quick-add-{v}"
							>
								+{v}
							</button>
						{/each}
					</div>
				</div>
			</div>
		{/each}
	</div>
</div>
