<script lang="ts">
	import { onMount } from 'svelte';
	import ClubCrest from '$lib/components/clubs/ClubCrest.svelte';
	import type { Match } from '$lib/types/league.js';
	import type { LiveMatchState } from '$lib/types/live-match.js';
	import type { Player } from '$lib/types/club.js';

	interface Props {
		matchId: string;
		legsToWin: number;
		pollIntervalMs?: number;
		homeRoster?: Player[];
		awayRoster?: Player[];
	}

	let {
		matchId,
		legsToWin,
		pollIntervalMs = 1500,
		homeRoster = [],
		awayRoster = []
	}: Props = $props();

	let match = $state<Match | null>(null);
	let live = $state<LiveMatchState | null>(null);

	const homeIsActive = $derived(live?.current_player_side === 'home');
	const awayIsActive = $derived(live?.current_player_side === 'away');
	const matchCompleted = $derived(match?.status === 'completed');
	const isMatchPoint = $derived(
		match
			? legsToWin - match.home_legs_won === 1 || legsToWin - match.away_legs_won === 1
			: false
	);
	const winnerLabel = $derived.by(() => {
		if (!matchCompleted || !match) return null;
		return match.home_legs_won > match.away_legs_won
			? match.home_club.name
			: match.away_club.name;
	});

	async function fetchLive() {
		try {
			const res = await fetch(`/api/matches/${matchId}/live`);
			if (!res.ok) return;
			const body = await res.json();
			match = match ? { ...match, ...body.match } : body.match;
			live = body.live;
		} catch {
			/* ignore */
		}
	}

	onMount(() => {
		fetchLive();
		const interval = setInterval(fetchLive, pollIntervalMs);
		return () => clearInterval(interval);
	});

	function formatThrow(t: { sector: number; multiplier: number; score: number; is_bust: boolean }): string {
		if (t.is_bust) return 'BUST';
		if (t.multiplier === 0 || t.score === 0) return '0';
		const prefix = t.multiplier === 3 ? 'T' : t.multiplier === 2 ? 'D' : '';
		if (t.sector === 25) return t.multiplier === 2 ? 'BULL' : 'B25';
		return `${prefix}${t.sector}`;
	}
</script>

<style>
	.spectator-tile-container {
		container-type: inline-size;
	}
	/* Force ClubCrest's hardcoded width/height to fit the wrapper */
	.crest-fit :global(svg),
	.crest-fit :global(img) {
		width: 100% !important;
		height: 100% !important;
		display: block;
	}
</style>

<div
	class="flex flex-col h-full bg-base-200 rounded-lg overflow-hidden shadow-sm border border-base-300 spectator-tile-container"
	data-testid="spectator-tile"
	data-match-id={matchId}
>
	{#if !match}
		<div class="flex-1 flex items-center justify-center p-4">
			<span class="loading loading-spinner loading-md"></span>
		</div>
	{:else}
		<!-- Header: clubs + leg score (sized via container queries so it scales with tile width) -->
		<div class="flex items-center justify-between gap-3 px-3 py-2 bg-base-100 shrink-0">
			<div class="flex items-center gap-2 flex-1 min-w-0 justify-end">
				<div class="flex flex-col items-end min-w-0">
					<span
						class="font-bold truncate max-w-full leading-tight"
						style="font-size: clamp(1rem, 4cqw, 3rem);"
					>
						{match.home_club.short_name}
					</span>
					{#if homeRoster.length > 0}
						<div class="flex flex-wrap justify-end gap-x-2 gap-y-0 mt-0.5 max-w-full">
							{#each homeRoster as p (p.id)}
								{@const isActive = live?.current_player_side === 'home' && live.home_player_name === `${p.first_name} ${p.last_name}`}
								<span
									class="leading-tight {isActive ? 'text-primary font-semibold' : 'text-base-content/60'}"
									style="font-size: clamp(0.7rem, 1.8cqw, 1.5rem);"
								>
									{#if isActive}● {/if}{p.first_name} {p.last_name}
								</span>
							{/each}
						</div>
					{:else if live}
						<span
							class="text-base-content/60 truncate max-w-full leading-tight"
							style="font-size: clamp(0.7rem, 1.8cqw, 1.5rem);"
						>
							{live.home_player_name}
						</span>
					{/if}
				</div>
				<div
					class="shrink-0 crest-fit"
					style="width: clamp(28px, 6cqw, 96px); height: clamp(28px, 6cqw, 96px);"
				>
					<ClubCrest
						club_id={match.home_club.id}
						has_crest={match.home_club.has_crest}
						crest_url={match.home_club.crest_url}
						club_name={match.home_club.name}
						primary_color={match.home_club.primary_color}
						size={96}
					/>
				</div>
			</div>
			<div
				class="font-black tabular-nums shrink-0 leading-none"
				style="font-size: clamp(1.5rem, 7cqw, 6rem);"
			>
				{match.home_legs_won}:{match.away_legs_won}
			</div>
			<div class="flex items-center gap-2 flex-1 min-w-0 justify-start">
				<div
					class="shrink-0 crest-fit"
					style="width: clamp(28px, 6cqw, 96px); height: clamp(28px, 6cqw, 96px);"
				>
					<ClubCrest
						club_id={match.away_club.id}
						has_crest={match.away_club.has_crest}
						crest_url={match.away_club.crest_url}
						club_name={match.away_club.name}
						primary_color={match.away_club.primary_color}
						size={96}
					/>
				</div>
				<div class="flex flex-col items-start min-w-0">
					<span
						class="font-bold truncate max-w-full leading-tight"
						style="font-size: clamp(1rem, 4cqw, 3rem);"
					>
						{match.away_club.short_name}
					</span>
					{#if awayRoster.length > 0}
						<div class="flex flex-wrap justify-start gap-x-2 gap-y-0 mt-0.5 max-w-full">
							{#each awayRoster as p (p.id)}
								{@const isActive = live?.current_player_side === 'away' && live.away_player_name === `${p.first_name} ${p.last_name}`}
								<span
									class="leading-tight {isActive ? 'text-primary font-semibold' : 'text-base-content/60'}"
									style="font-size: clamp(0.7rem, 1.8cqw, 1.5rem);"
								>
									{#if isActive}● {/if}{p.first_name} {p.last_name}
								</span>
							{/each}
						</div>
					{:else if live}
						<span
							class="text-base-content/60 truncate max-w-full leading-tight"
							style="font-size: clamp(0.7rem, 1.8cqw, 1.5rem);"
						>
							{live.away_player_name}
						</span>
					{/if}
				</div>
			</div>
		</div>

		<!-- Body: states -->
		{#if matchCompleted}
			<div class="flex-1 flex flex-col items-center justify-center p-3 bg-success/10 text-center">
				<span class="text-lg font-bold">Beendet</span>
				<span class="text-sm">{winnerLabel}</span>
			</div>
		{:else if live && live.game_mode !== 'cricket'}
			<div class="flex-1 grid grid-cols-2 gap-1 p-1 min-h-0">
				<div
					class="flex flex-col items-center justify-center rounded {homeIsActive ? 'bg-primary/15 ring-1 ring-primary' : 'bg-base-100'}"
				>
					<span class="text-[10px] uppercase tracking-wider {homeIsActive ? 'text-primary' : 'text-base-content/60'}">
						⌀ Schnitt
					</span>
					<span
						class="font-black tabular-nums leading-none {homeIsActive ? 'text-primary' : ''}"
						style="font-size: clamp(2rem, 9cqw, 7rem);"
					>
						{live.home_average.toFixed(1)}
					</span>
					<span class="text-[10px] text-base-content/60 mt-1">Rest</span>
					<span class="text-lg md:text-2xl font-bold tabular-nums text-base-content/80">
						{live.home_remaining}
					</span>
				</div>
				<div
					class="flex flex-col items-center justify-center rounded {awayIsActive ? 'bg-primary/15 ring-1 ring-primary' : 'bg-base-100'}"
				>
					<span class="text-[10px] uppercase tracking-wider {awayIsActive ? 'text-primary' : 'text-base-content/60'}">
						⌀ Schnitt
					</span>
					<span
						class="font-black tabular-nums leading-none {awayIsActive ? 'text-primary' : ''}"
						style="font-size: clamp(2rem, 9cqw, 7rem);"
					>
						{live.away_average.toFixed(1)}
					</span>
					<span class="text-[10px] text-base-content/60 mt-1">Rest</span>
					<span class="text-lg md:text-2xl font-bold tabular-nums text-base-content/80">
						{live.away_remaining}
					</span>
				</div>
			</div>

			<!-- Footer: turn info -->
			<div class="flex items-center justify-center gap-2 flex-wrap px-2 py-1 bg-base-100 shrink-0 border-t border-base-300">
				<span class="text-[11px] text-base-content/70">
					Leg {live.leg_number} · D{live.current_dart}/3
				</span>
				{#if live.current_turn_throws.length > 0}
					{#each live.current_turn_throws as t, i (i)}
						<span class="badge badge-sm {t.is_bust ? 'badge-error' : 'badge-neutral'} text-[10px]">
							{formatThrow(t)}
						</span>
					{/each}
					<span class="text-xs font-bold">
						Σ {live.current_turn_throws.reduce((s, t) => s + (t.is_bust ? 0 : t.score), 0)}
					</span>
				{/if}
				{#if isMatchPoint}
					<span class="badge badge-sm badge-warning animate-pulse text-[10px]">MP</span>
				{/if}
			</div>
		{:else if live && live.game_mode === 'cricket'}
			<div class="flex-1 flex items-center justify-center p-3 text-center">
				<span class="text-xs text-base-content/60">Cricket-Live folgt</span>
			</div>
		{:else}
			<div class="flex-1 flex items-center justify-center p-3 text-center">
				<span class="text-xs text-base-content/60">Noch nicht gestartet</span>
			</div>
		{/if}
	{/if}
</div>
