<script lang="ts">
	let { data } = $props();
</script>

<div class="flex flex-col gap-6">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold">Saisons</h1>
		<a href="/seasons/new" class="btn btn-primary" data-testid="new-season-btn">Neue Saison</a>
	</div>

	{#if data.seasons.length === 0}
		<div class="text-center py-12 text-base-content/60">
			<p class="text-lg">Keine Saisons vorhanden.</p>
		</div>
	{:else}
		<div class="grid gap-4" data-testid="season-list">
			{#each data.seasons as season (season.id)}
				<a href="/seasons/{season.id}" class="card card-border bg-base-100 shadow-sm hover:shadow-md transition-shadow" data-testid="season-card">
					<div class="card-body flex-row items-center justify-between">
						<div>
							<h2 class="card-title text-base">{season.name}</h2>
							<p class="text-sm text-base-content/60">
								{season.game_mode} &middot; {season.legs_per_set} Legs/Set &middot; {season.sets_per_match} Sets/Match
							</p>
						</div>
						{#if season.is_active}
							<span class="badge badge-success">Aktiv</span>
						{/if}
					</div>
				</a>
			{/each}
		</div>
	{/if}
</div>
