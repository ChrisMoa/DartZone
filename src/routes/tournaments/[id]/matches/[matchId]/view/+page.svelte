<script lang="ts">
	import { onMount } from 'svelte';
	import ClubCrest from '$lib/components/clubs/ClubCrest.svelte';
	import type { Match } from '$lib/types/league.js';
	import type { LiveMatchState } from '$lib/types/live-match.js';

	let { data } = $props();

	let match = $state<Match>(data.match);
	let live = $state<LiveMatchState | null>(null);

	const legsToWin = $derived(Math.ceil(data.tournament.sets_per_match / 2));

	const isMatchPoint = $derived(
		(legsToWin - match.home_legs_won === 1) || (legsToWin - match.away_legs_won === 1)
	);

	const matchCompleted = $derived(match.status === 'completed');

	const winnerLabel = $derived.by(() => {
		if (!matchCompleted) return null;
		return match.home_legs_won > match.away_legs_won
			? match.home_club.name
			: match.away_club.name;
	});

	const homeIsActive = $derived(live?.current_player_side === 'home');
	const awayIsActive = $derived(live?.current_player_side === 'away');

	async function fetchLive() {
		try {
			const res = await fetch(`/api/matches/${data.match.id}/live`);
			if (!res.ok) return;
			const body = await res.json();
			match = { ...match, ...body.match };
			live = body.live;
		} catch {
			// ignore polling errors
		}
	}

	onMount(() => {
		fetchLive();
		const interval = setInterval(fetchLive, 1000);
		return () => clearInterval(interval);
	});

	function formatThrow(t: { sector: number; multiplier: number; score: number; is_bust: boolean }): string {
		if (t.is_bust) return 'BUST';
		if (t.multiplier === 0 || t.score === 0) return '0';
		const prefix = t.multiplier === 3 ? 'T' : t.multiplier === 2 ? 'D' : '';
		const sectorLabel = t.sector === 25 ? (t.multiplier === 2 ? 'BULL' : 'B') : `${t.sector}`;
		if (t.sector === 25) return t.multiplier === 2 ? 'BULL' : 'BULL 25';
		return `${prefix}${sectorLabel}`;
	}
</script>

<div class="flex flex-col gap-6 min-h-[80vh]" data-testid="view-page">
	<div class="flex items-center gap-3 flex-wrap">
		<a href="/tournaments/{data.tournament.id}" class="btn btn-ghost btn-sm">Zurueck</a>
		<h1 class="text-2xl font-bold flex-1">
			{match.home_club.short_name} vs {match.away_club.short_name}
		</h1>
		<a
			href="/tournaments/{data.tournament.id}/matches/{match.id}/play"
			class="btn btn-primary btn-sm"
			data-testid="organizer-play-link"
		>
			Organisator
		</a>
	</div>

	<!-- Big leg score -->
	<div class="flex items-center justify-around gap-4 p-6 bg-base-100 rounded-lg shadow-sm" data-testid="view-legs">
		<div class="flex flex-col items-center gap-2 flex-1">
			<ClubCrest
				club_id={match.home_club.id}
				has_crest={match.home_club.has_crest}
				crest_url={match.home_club.crest_url}
				club_name={match.home_club.name}
				primary_color={match.home_club.primary_color}
				size={64}
			/>
			<span class="text-xl md:text-2xl font-bold text-center">{match.home_club.name}</span>
			{#if live}
				<span class="text-base md:text-lg text-base-content/70">{live.home_player_name}</span>
			{/if}
		</div>
		<div class="text-6xl md:text-8xl font-bold tabular-nums" data-testid="view-leg-score">
			{match.home_legs_won} : {match.away_legs_won}
		</div>
		<div class="flex flex-col items-center gap-2 flex-1">
			<ClubCrest
				club_id={match.away_club.id}
				has_crest={match.away_club.has_crest}
				crest_url={match.away_club.crest_url}
				club_name={match.away_club.name}
				primary_color={match.away_club.primary_color}
				size={64}
			/>
			<span class="text-xl md:text-2xl font-bold text-center">{match.away_club.name}</span>
			{#if live}
				<span class="text-base md:text-lg text-base-content/70">{live.away_player_name}</span>
			{/if}
		</div>
	</div>

	{#if matchCompleted}
		<div class="card bg-success/10 border border-success/30 shadow-sm" data-testid="view-match-completed">
			<div class="card-body text-center py-8">
				<h2 class="text-3xl md:text-5xl font-bold">Spiel beendet</h2>
				<p class="text-xl md:text-2xl mt-2">{winnerLabel} gewinnt!</p>
			</div>
		</div>
	{:else if live && live.game_mode !== 'cricket'}
		<!-- Big remaining points -->
		<div class="grid grid-cols-2 gap-4">
			<div
				class="card shadow-md transition-all {homeIsActive ? 'bg-primary/15 border-2 border-primary' : 'bg-base-100'}"
				data-testid="view-home-card"
				class:scale-105={homeIsActive}
			>
				<div class="card-body items-center py-6">
					<span class="text-sm uppercase tracking-wide text-base-content/60">Rest</span>
					<span class="text-7xl md:text-9xl font-black tabular-nums" data-testid="view-home-remaining">
						{live.home_remaining}
					</span>
					<span class="text-sm md:text-base text-base-content/70">
						⌀ {live.home_average.toFixed(1)}
					</span>
				</div>
			</div>
			<div
				class="card shadow-md transition-all {awayIsActive ? 'bg-primary/15 border-2 border-primary' : 'bg-base-100'}"
				data-testid="view-away-card"
				class:scale-105={awayIsActive}
			>
				<div class="card-body items-center py-6">
					<span class="text-sm uppercase tracking-wide text-base-content/60">Rest</span>
					<span class="text-7xl md:text-9xl font-black tabular-nums" data-testid="view-away-remaining">
						{live.away_remaining}
					</span>
					<span class="text-sm md:text-base text-base-content/70">
						⌀ {live.away_average.toFixed(1)}
					</span>
				</div>
			</div>
		</div>

		<!-- Current turn / leg info -->
		<div class="flex flex-col items-center gap-3 p-4 bg-base-100 rounded-lg shadow-sm" data-testid="view-turn-info">
			<div class="text-base md:text-lg text-base-content/70">
				Leg {live.leg_number} &middot; Dart {live.current_dart} von 3
			</div>
			{#if live.current_turn_throws.length > 0}
				<div class="flex items-center gap-3" data-testid="view-current-throws">
					{#each live.current_turn_throws as t, i (i)}
						<div class="badge badge-lg {t.is_bust ? 'badge-error' : 'badge-neutral'} text-base md:text-lg px-4 py-3">
							{formatThrow(t)}
						</div>
					{/each}
				</div>
				<div class="text-2xl md:text-3xl font-bold">
					Wurf-Summe: {live.current_turn_throws.reduce((s, t) => s + (t.is_bust ? 0 : t.score), 0)}
				</div>
			{/if}
			{#if isMatchPoint}
				<div class="badge badge-warning badge-lg animate-pulse font-semibold" data-testid="view-match-point">
					Match Point
				</div>
			{/if}
		</div>
	{:else if live && live.game_mode === 'cricket'}
		<div class="card bg-base-100 shadow-sm">
			<div class="card-body text-center py-8">
				<p class="text-lg text-base-content/70">
					Cricket-Live-Ansicht bald verfuegbar. Aktueller Leg-Stand siehe oben.
				</p>
			</div>
		</div>
	{:else}
		<div class="card bg-base-100 shadow-sm">
			<div class="card-body text-center py-8" data-testid="view-no-live">
				<p class="text-lg text-base-content/70">
					Spiel noch nicht gestartet oder pausiert. Live-Daten erscheinen, sobald der Organisator das Spiel startet.
				</p>
			</div>
		</div>
	{/if}
</div>
