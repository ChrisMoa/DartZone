<script lang="ts">
	import Dartboard from '$lib/components/dartboard/Dartboard.svelte';
	import LeagueTable from '$lib/components/league/LeagueTable.svelte';
	import MatchCard from '$lib/components/league/MatchCard.svelte';
	import type { Multiplier, SectorValue } from '$lib/types/game.js';

	let { data } = $props();

	let lastHit = $state<{ sector: SectorValue; multiplier: Multiplier; score: number } | null>(null);

	function handleHit(event: { sector: SectorValue; multiplier: Multiplier; score: number }) {
		lastHit = event;
	}

	const multiplierLabel = $derived(
		lastHit
			? lastHit.multiplier === 3
				? 'Triple'
				: lastHit.multiplier === 2
					? 'Double'
					: 'Single'
			: ''
	);
</script>

<div class="flex flex-col gap-8">
	{#if data.activeTournament}
		<div class="grid gap-6 lg:grid-cols-2">
			<div class="card bg-base-100 shadow-sm">
				<div class="card-body">
					<div class="flex items-center justify-between">
						<h2 class="card-title">{data.activeTournament.name}</h2>
						<a href="/tournaments/{data.activeTournament.id}" class="btn btn-ghost btn-sm">Details</a>
					</div>
					<LeagueTable standings={data.standings} />
				</div>
			</div>

			<div class="flex flex-col gap-6">
				{#if data.recentMatches.length > 0}
					<div class="card bg-base-100 shadow-sm">
						<div class="card-body">
							<h2 class="card-title">Letzte Ergebnisse</h2>
							<div class="grid gap-3">
								{#each data.recentMatches as match (match.id)}
									<MatchCard {match} />
								{/each}
							</div>
						</div>
					</div>
				{/if}

				<div class="card bg-base-100 shadow-sm">
					<div class="card-body items-center">
						<h2 class="card-title mb-2">Dartboard</h2>
						<Dartboard size={300} onhit={handleHit} />
						{#if lastHit}
							<div class="stats shadow mt-4">
								<div class="stat py-2">
									<div class="stat-title text-xs">Letzter Treffer</div>
									<div class="stat-value text-lg text-primary">{lastHit.score}</div>
									<div class="stat-desc text-xs">
										{multiplierLabel}
										{lastHit.sector === 25 ? 'Bull' : lastHit.sector}
									</div>
								</div>
							</div>
						{/if}
					</div>
				</div>
			</div>
		</div>
	{:else}
		<div class="flex flex-col items-center justify-center gap-8 p-8">
			<Dartboard size={400} onhit={handleHit} />
			{#if lastHit}
				<div class="stats shadow">
					<div class="stat">
						<div class="stat-title">Letzter Treffer</div>
						<div class="stat-value text-primary">{lastHit.score}</div>
						<div class="stat-desc">
							{multiplierLabel}
							{lastHit.sector === 25 ? 'Bull' : lastHit.sector}
						</div>
					</div>
				</div>
			{/if}
			<div class="text-center">
				<p class="text-base-content/60 mb-4">Kein aktives Turnier vorhanden.</p>
				<a href="/tournaments/new" class="btn btn-primary">Turnier erstellen</a>
			</div>
		</div>
	{/if}
</div>
