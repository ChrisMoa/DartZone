<script lang="ts">
	import PlayerStats from '$lib/components/stats/PlayerStats.svelte';
	import HeatmapBoard from '$lib/components/stats/HeatmapBoard.svelte';
	import AverageChart from '$lib/components/stats/AverageChart.svelte';
	import ClubCrest from '$lib/components/clubs/ClubCrest.svelte';
	import type { PlayerOverallStats } from '$lib/utils/statistics.js';

	let { data } = $props();

	// Stats placeholder - populated when game data is persisted
	const stats: PlayerOverallStats = {
		player_id: data.player.id,
		player_name: `${data.player.first_name} ${data.player.last_name}`,
		matches_played: 0,
		total_darts: 0,
		overall_average: 0,
		best_average: 0,
		highest_score: 0,
		total_180s: 0,
		total_ton_plus: 0,
		checkout_percentage: 0,
		total_checkout_attempts: 0,
		total_checkout_successes: 0,
		sector_counts: {}
	};

	const chartData: { match_id: string; label: string; average: number }[] = [];
</script>

<div class="flex flex-col gap-6" data-testid="player-detail-page">
	<div class="flex items-center gap-4">
		<a href="/stats" class="btn btn-ghost btn-sm">Zurueck</a>
		<div class="flex items-center gap-3">
			{#if data.club}
				<ClubCrest
					crest_url={data.club.crest_url}
					club_name={data.club.name}
					primary_color={data.club.primary_color}
					size={36}
				/>
			{/if}
			<div>
				<h1 class="text-2xl font-bold">{data.player.first_name} {data.player.last_name}</h1>
				{#if data.player.nickname}
					<p class="text-sm text-base-content/60">"{data.player.nickname}"</p>
				{/if}
				{#if data.club}
					<p class="text-sm text-base-content/60">{data.club.name}</p>
				{/if}
			</div>
		</div>
	</div>

	<PlayerStats {stats} />

	<div class="grid gap-6 lg:grid-cols-2">
		<div class="card bg-base-100 shadow-sm">
			<div class="card-body items-center">
				<h3 class="card-title text-sm">Segment-Heatmap</h3>
				{#if Object.keys(stats.sector_counts).length > 0}
					<HeatmapBoard sectorCounts={stats.sector_counts} size={280} />
				{:else}
					<p class="text-sm text-base-content/60 py-8">Noch keine Wurfdaten vorhanden.</p>
				{/if}
			</div>
		</div>

		<AverageChart data={chartData} />
	</div>
</div>
