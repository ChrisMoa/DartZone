<script lang="ts">
	import type { TournamentStatus } from '$lib/types/league.js';

	let { data } = $props();

	const STATUS_BADGE: Record<TournamentStatus, { label: string; class: string; border: string }> = {
		planned: { label: 'Geplant', class: 'badge-info', border: 'status-border-planned' },
		running: { label: 'Laufend', class: 'badge-success', border: 'status-border-running' },
		finished: { label: 'Beendet', class: 'badge-neutral', border: 'status-border-finished' },
		aborted: { label: 'Abgebrochen', class: 'badge-error', border: 'status-border-aborted' }
	};
</script>

<div class="flex flex-col gap-6">
	<div class="flex items-center justify-between flex-wrap gap-3">
		<div>
			<h1 class="font-display text-3xl md:text-4xl font-extrabold">Turniere</h1>
			<p class="text-base-content/60 text-sm mt-1">
				{data.tournaments.length}
				{data.tournaments.length === 1 ? 'Turnier' : 'Turniere'} gesamt
			</p>
		</div>
		<a href="/tournaments/new" class="btn btn-primary" data-testid="new-tournament-btn">
			<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
			</svg>
			Neues Turnier
		</a>
	</div>

	{#if data.tournaments.length === 0}
		<div
			class="card bg-base-100 border border-dashed border-base-300/60 shadow-none"
		>
			<div class="card-body items-center text-center py-16">
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="h-16 w-16 mb-4 opacity-40" aria-hidden="true">
					<circle cx="12" cy="12" r="11" fill="var(--color-primary)" opacity="0.6" />
					<circle cx="12" cy="12" r="6" fill="var(--color-base-100)" opacity="0.4" />
					<circle cx="12" cy="12" r="2" fill="var(--color-accent)" />
				</svg>
				<p class="font-display text-2xl font-bold mb-2">Noch keine Turniere</p>
				<p class="text-base-content/60 mb-6 max-w-md">
					Lege ein Turnier an, weise Vereine zu und starte mit dem ersten Wurf.
				</p>
				<a href="/tournaments/new" class="btn btn-primary">Erstes Turnier erstellen</a>
			</div>
		</div>
	{:else}
		<div class="grid gap-4" data-testid="tournament-list">
			{#each data.tournaments as tournament (tournament.id)}
				{@const meta = STATUS_BADGE[tournament.status]}
				<a
					href="/tournaments/{tournament.id}"
					class="card card-border bg-base-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all {meta.border}"
					class:opacity-60={tournament.status === 'finished' || tournament.status === 'aborted'}
					data-testid="tournament-card"
				>
					<div class="card-body flex-row items-center justify-between gap-4">
						<div class="min-w-0">
							<h2 class="font-display card-title text-lg md:text-xl truncate">
								{tournament.name}
							</h2>
							<p class="text-sm text-base-content/60 mt-1">
								{tournament.game_mode} ·
								{tournament.format === 'round_robin' ? 'Jeder gegen Jeden' : 'K.O.'} ·
								{tournament.legs_per_set} Legs/Set · {tournament.sets_per_match} Sets/Match
							</p>
						</div>
						<div class="flex items-center gap-2 shrink-0">
							{#if tournament.status === 'running'}
								<span
									class="inline-block h-2 w-2 rounded-full bg-success live-dot"
									aria-hidden="true"
								></span>
							{/if}
							<span class="badge {meta.class}" data-testid="tournament-status-badge">
								{meta.label}
							</span>
						</div>
					</div>
				</a>
			{/each}
		</div>
	{/if}
</div>
