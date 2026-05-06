<script lang="ts">
	import { onMount } from 'svelte';
	import TournamentStats from '$lib/components/league/TournamentStats.svelte';
	import type { TournamentStats as TStats } from '$lib/server/tournament-stats.js';

	let { data } = $props();

	let stats = $state<TStats>(data.stats);

	$effect(() => {
		stats = data.stats;
	});

	async function fetchStats() {
		try {
			const res = await fetch(`/api/tournaments/${data.tournament.id}/stats`);
			if (res.ok) {
				const result = await res.json();
				if (result.stats) stats = result.stats;
			}
		} catch {
			// ignore polling errors
		}
	}

	onMount(() => {
		const interval = setInterval(fetchStats, 3000);
		return () => clearInterval(interval);
	});
</script>

<div class="flex flex-col gap-4">
	<div class="flex items-center gap-3">
		<a href="/tournaments/{data.tournament.id}" class="btn btn-ghost btn-sm">Zurueck</a>
		<h1 class="text-2xl font-bold">Statistik &mdash; {data.tournament.name}</h1>
	</div>

	<div class="text-sm text-base-content/60">
		{data.tournament.track_players ? 'Pro Spieler' : 'Pro Team'} &middot; aktualisiert sich live
	</div>

	<TournamentStats {stats} />
</div>
