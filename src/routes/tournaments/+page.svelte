<script lang="ts">
	let { data } = $props();
</script>

<div class="flex flex-col gap-6">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold">Turniere</h1>
		<a href="/tournaments/new" class="btn btn-primary" data-testid="new-tournament-btn">Neues Turnier</a>
	</div>

	{#if data.tournaments.length === 0}
		<div class="text-center py-12 text-base-content/60">
			<p class="text-lg">Keine Turniere vorhanden.</p>
		</div>
	{:else}
		<div class="grid gap-4" data-testid="tournament-list">
			{#each data.tournaments as tournament (tournament.id)}
				<a href="/tournaments/{tournament.id}" class="card card-border bg-base-100 shadow-sm hover:shadow-md transition-shadow" data-testid="tournament-card">
					<div class="card-body flex-row items-center justify-between">
						<div>
							<h2 class="card-title text-base">{tournament.name}</h2>
							<p class="text-sm text-base-content/60">
								{tournament.game_mode} &middot;
								{tournament.format === 'round_robin' ? 'Jeder gegen Jeden' : 'K.O.'} &middot;
								{tournament.legs_per_set} Legs/Set &middot; {tournament.sets_per_match} Sets/Match
							</p>
						</div>
						{#if tournament.is_active}
							<span class="badge badge-success">Aktiv</span>
						{/if}
					</div>
				</a>
			{/each}
		</div>
	{/if}
</div>
