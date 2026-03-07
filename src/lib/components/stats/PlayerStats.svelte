<script lang="ts">
	import type { PlayerOverallStats } from '$lib/utils/statistics.js';

	interface Props {
		stats: PlayerOverallStats;
	}

	let { stats }: Props = $props();
</script>

<div class="card bg-base-100 shadow-sm" data-testid="player-stats">
	<div class="card-body">
		<h2 class="card-title" data-testid="player-stats-name">{stats.player_name}</h2>

		<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-2">
			<div class="stat bg-base-200 rounded-lg p-3">
				<div class="stat-title text-xs">Spiele</div>
				<div class="stat-value text-lg tabular-nums" data-testid="player-stats-matches">{stats.matches_played}</div>
			</div>

			<div class="stat bg-base-200 rounded-lg p-3">
				<div class="stat-title text-xs">Avg (3 Darts)</div>
				<div class="stat-value text-lg tabular-nums" data-testid="player-stats-average">{stats.overall_average.toFixed(1)}</div>
			</div>

			<div class="stat bg-base-200 rounded-lg p-3">
				<div class="stat-title text-xs">Bester Avg</div>
				<div class="stat-value text-lg tabular-nums" data-testid="player-stats-best-avg">{stats.best_average.toFixed(1)}</div>
			</div>

			<div class="stat bg-base-200 rounded-lg p-3">
				<div class="stat-title text-xs">Hoechster Score</div>
				<div class="stat-value text-lg tabular-nums" data-testid="player-stats-highest">{stats.highest_score}</div>
			</div>

			<div class="stat bg-base-200 rounded-lg p-3">
				<div class="stat-title text-xs">180er</div>
				<div class="stat-value text-lg tabular-nums" data-testid="player-stats-180s">{stats.total_180s}</div>
			</div>

			<div class="stat bg-base-200 rounded-lg p-3">
				<div class="stat-title text-xs">100+</div>
				<div class="stat-value text-lg tabular-nums" data-testid="player-stats-ton-plus">{stats.total_ton_plus}</div>
			</div>

			<div class="stat bg-base-200 rounded-lg p-3">
				<div class="stat-title text-xs">Checkout %</div>
				<div class="stat-value text-lg tabular-nums" data-testid="player-stats-checkout">
					{stats.checkout_percentage.toFixed(1)}%
				</div>
				<div class="stat-desc text-xs">{stats.total_checkout_successes}/{stats.total_checkout_attempts}</div>
			</div>

			<div class="stat bg-base-200 rounded-lg p-3">
				<div class="stat-title text-xs">Darts gesamt</div>
				<div class="stat-value text-lg tabular-nums" data-testid="player-stats-darts">{stats.total_darts}</div>
			</div>
		</div>
	</div>
</div>
