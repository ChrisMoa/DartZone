<script lang="ts">
	import ClubCard from '$lib/components/clubs/ClubCard.svelte';

	let { data } = $props();
</script>

<div class="flex flex-col gap-6">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold">Vereine</h1>
		<a href="/clubs/new" class="btn btn-primary" data-testid="new-club-btn">Neuer Verein</a>
	</div>

	<form method="GET" class="flex gap-2">
		<input
			type="search"
			name="q"
			placeholder="Verein suchen..."
			class="input input-bordered flex-1"
			value={data.query}
			data-testid="club-search"
		/>
		<button type="submit" class="btn btn-ghost">Suchen</button>
	</form>

	{#if data.clubs.length === 0}
		<div class="text-center py-12 text-base-content/60">
			<p class="text-lg">Keine Vereine gefunden.</p>
			<a href="/clubs/new" class="btn btn-primary mt-4">Ersten Verein erstellen</a>
		</div>
	{:else}
		<div class="grid gap-4 md:grid-cols-2" data-testid="club-list">
			{#each data.clubs as club (club.id)}
				<ClubCard {club} />
			{/each}
		</div>
	{/if}
</div>
