<script lang="ts">
	import ClubCrest from '$lib/components/clubs/ClubCrest.svelte';
	import type { TournamentStats } from '$lib/server/tournament-stats.js';

	interface Props {
		stats: TournamentStats;
	}

	let { stats }: Props = $props();

	const entityLabel = $derived(stats.mode === 'player' ? 'Spieler' : 'Team');

	type Sortable = 'average' | 'one_eighties' | 'highest_finish' | 'highest_turn' | 'ton_plus';
	let sort = $state<Sortable>('average');

	const sorted = $derived(
		[...stats.entries].sort((a, b) => {
			const diff = b[sort] - a[sort];
			if (diff !== 0) return diff;
			return a.name.localeCompare(b.name);
		})
	);
</script>

<div class="card bg-base-100 shadow-sm">
	<div class="card-body">
		<div class="flex items-center justify-between flex-wrap gap-2">
			<h2 class="card-title">Statistiken</h2>
			<span class="text-xs text-base-content/50 uppercase tracking-wider">
				{entityLabel}-Bestenliste
			</span>
		</div>

		{#if stats.entries.length === 0}
			<p class="text-base-content/60">Noch keine Wuerfe erfasst.</p>
		{:else}
			<div class="flex flex-wrap gap-1 my-2 text-xs" data-testid="stats-sort">
				{#each [['average', 'Schnitt'], ['one_eighties', '180er'], ['ton_plus', '100+'], ['highest_turn', 'Hoechste Aufnahme'], ['highest_finish', 'Hoechstes Finish']] as [key, label]}
					<button
						type="button"
						class="btn btn-xs"
						class:btn-primary={sort === key}
						class:btn-ghost={sort !== key}
						onclick={() => (sort = key as Sortable)}
					>{label}</button>
				{/each}
			</div>

			<div class="overflow-x-auto">
				<table class="table table-sm">
					<thead>
						<tr>
							<th class="w-10">#</th>
							<th>{entityLabel}</th>
							<th class="text-right">Schnitt</th>
							<th class="text-right hidden md:table-cell">180er</th>
							<th class="text-right hidden md:table-cell">100+</th>
							<th class="text-right hidden lg:table-cell">Hoch. Aufn.</th>
							<th class="text-right">Hoch. Finish</th>
							<th class="text-right hidden md:table-cell">Darts</th>
						</tr>
					</thead>
					<tbody>
						{#each sorted as e, idx (e.id)}
							<tr data-testid="stats-row" class:bg-primary={idx === 0} class:text-primary-content={idx === 0}>
								<td class="font-bold tabular-nums">{idx + 1}</td>
								<td>
									<div class="flex items-center gap-2">
										{#if e.club_id || stats.mode === 'team'}
											<ClubCrest
												club_id={e.club_id ?? e.id}
												has_crest={e.has_crest}
												club_name={e.name}
												primary_color={e.primary_color ?? '#888'}
												size={24}
											/>
										{/if}
										<div class="flex flex-col">
											<span class="font-semibold">{e.name}</span>
											{#if stats.mode === 'player' && e.short_name}
												<span class="text-xs opacity-60">{e.short_name}</span>
											{/if}
										</div>
									</div>
								</td>
								<td class="text-right font-bold tabular-nums">{e.average.toFixed(1)}</td>
								<td class="text-right tabular-nums hidden md:table-cell">{e.one_eighties}</td>
								<td class="text-right tabular-nums hidden md:table-cell">{e.ton_plus}</td>
								<td class="text-right tabular-nums hidden lg:table-cell">{e.highest_turn || '–'}</td>
								<td class="text-right tabular-nums">{e.highest_finish || '–'}</td>
								<td class="text-right tabular-nums hidden md:table-cell text-base-content/60">{e.total_darts}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
</div>
