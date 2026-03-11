<script lang="ts">
	import type { Player } from '$lib/types/club.js';

	export interface PlayerStats {
		average: number | null;
		checkoutPct: number | null;
		legsPlayed: number;
	}

	interface Props {
		player: Player;
		clubName?: string;
		stats: PlayerStats | null;
		loading?: boolean;
	}

	let { player, clubName, stats, loading = false }: Props = $props();

	const displayName = $derived(
		player.nickname
			? `${player.first_name} ${player.last_name} (${player.nickname})`
			: `${player.first_name} ${player.last_name}`
	);
</script>

<div class="card bg-base-200 border border-base-300 p-3" data-testid="player-stats-card">
	{#if loading}
		<div class="flex items-center gap-2 text-sm text-base-content/60">
			<span class="loading loading-spinner loading-xs"></span>
			Lade Statistiken…
		</div>
	{:else}
		<div class="font-semibold text-sm">{displayName}</div>
		{#if clubName}
			<div class="text-xs text-base-content/60 mb-2">{clubName}</div>
		{/if}
		<div class="flex gap-4 text-xs">
			<span>
				<span class="text-base-content/60">⌀ </span>
				<span class="font-mono font-medium">
					{stats?.average != null ? stats.average.toFixed(1) : '--'}
				</span>
			</span>
			<span>
				<span class="text-base-content/60">Checkouts: </span>
				<span class="font-mono font-medium">
					{stats?.checkoutPct != null ? `${stats.checkoutPct}%` : '--%'}
				</span>
			</span>
			<span>
				<span class="text-base-content/60">Legs: </span>
				<span class="font-mono font-medium">{stats?.legsPlayed ?? 0}</span>
			</span>
		</div>
	{/if}
</div>
