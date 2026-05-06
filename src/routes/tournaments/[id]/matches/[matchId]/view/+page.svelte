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

<div class="flex flex-col h-[calc(100vh-2rem)] gap-3" data-testid="view-page">
	<!-- Compact header -->
	<div class="flex items-center gap-3 flex-wrap shrink-0">
		<a href="/tournaments/{data.tournament.id}" class="btn btn-ghost btn-sm">Zurueck</a>
		<h1 class="text-lg md:text-xl font-bold flex-1">
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

	<!-- Club + leg score header (with full roster) -->
	<div class="flex items-stretch justify-around gap-4 px-4 py-3 bg-base-100 rounded-lg shadow-sm shrink-0" data-testid="view-legs">
		<div class="flex items-center gap-4 flex-1 justify-end min-w-0">
			<div class="flex flex-col items-end min-w-0">
				<span class="text-2xl md:text-4xl font-bold text-right leading-tight truncate max-w-full">
					{match.home_club.name}
				</span>
				{#if data.homePlayers.length > 0}
					<div class="flex flex-wrap justify-end gap-x-2 gap-y-0.5 mt-1" data-testid="view-home-roster">
						{#each data.homePlayers as p (p.id)}
							{@const isActive = live?.current_player_side === 'home' && live.home_player_name === `${p.first_name} ${p.last_name}`}
							<span
								class="text-sm md:text-base {isActive ? 'text-primary font-semibold' : 'text-base-content/70'}"
							>
								{#if isActive}● {/if}{p.first_name} {p.last_name}
							</span>
						{/each}
					</div>
				{:else if live}
					<span class="text-sm md:text-base text-base-content/70 mt-1">{live.home_player_name}</span>
				{/if}
			</div>
			<ClubCrest
				club_id={match.home_club.id}
				has_crest={match.home_club.has_crest}
				crest_url={match.home_club.crest_url}
				club_name={match.home_club.name}
				primary_color={match.home_club.primary_color}
				size={72}
			/>
		</div>
		<div class="flex flex-col items-center justify-center shrink-0">
			<span class="text-6xl md:text-8xl font-black tabular-nums leading-none" data-testid="view-leg-score">
				{match.home_legs_won} : {match.away_legs_won}
			</span>
			<span class="text-xs md:text-sm text-base-content/50 uppercase tracking-wider mt-1">Legs</span>
		</div>
		<div class="flex items-center gap-4 flex-1 justify-start min-w-0">
			<ClubCrest
				club_id={match.away_club.id}
				has_crest={match.away_club.has_crest}
				crest_url={match.away_club.crest_url}
				club_name={match.away_club.name}
				primary_color={match.away_club.primary_color}
				size={72}
			/>
			<div class="flex flex-col items-start min-w-0">
				<span class="text-2xl md:text-4xl font-bold text-left leading-tight truncate max-w-full">
					{match.away_club.name}
				</span>
				{#if data.awayPlayers.length > 0}
					<div class="flex flex-wrap justify-start gap-x-2 gap-y-0.5 mt-1" data-testid="view-away-roster">
						{#each data.awayPlayers as p (p.id)}
							{@const isActive = live?.current_player_side === 'away' && live.away_player_name === `${p.first_name} ${p.last_name}`}
							<span
								class="text-sm md:text-base {isActive ? 'text-primary font-semibold' : 'text-base-content/70'}"
							>
								{#if isActive}● {/if}{p.first_name} {p.last_name}
							</span>
						{/each}
					</div>
				{:else if live}
					<span class="text-sm md:text-base text-base-content/70 mt-1">{live.away_player_name}</span>
				{/if}
			</div>
		</div>
	</div>

	{#if matchCompleted}
		<div class="card bg-success/10 border border-success/30 shadow-sm flex-1" data-testid="view-match-completed">
			<div class="card-body items-center justify-center text-center">
				<h2 class="text-4xl md:text-7xl font-bold">Spiel beendet</h2>
				<p class="text-2xl md:text-4xl mt-4">{winnerLabel} gewinnt!</p>
			</div>
		</div>
	{:else if live && live.game_mode !== 'cricket'}
		<!-- Big symmetric player cards (fill remaining viewport) — average is dominant -->
		<div class="grid grid-cols-2 gap-3 flex-1 min-h-0">
			<div
				class="card shadow-md flex flex-col {homeIsActive ? 'bg-primary/10 ring-2 ring-primary' : 'bg-base-100'}"
				data-testid="view-home-card"
			>
				<div class="card-body flex flex-col items-center justify-center gap-2 py-4 px-3">
					<div class="flex items-center gap-2 text-base md:text-lg font-medium {homeIsActive ? 'text-primary' : 'text-base-content/70'}">
						{#if homeIsActive}
							<span class="inline-block w-2 h-2 rounded-full bg-primary animate-pulse"></span>
						{/if}
						<span>⌀ Schnitt</span>
					</div>
					<span
						class="font-black tabular-nums leading-none {homeIsActive ? 'text-primary' : 'text-base-content'}"
						style="font-size: clamp(5rem, 22vw, 18rem);"
						data-testid="view-home-average"
					>
						{live.home_average.toFixed(1)}
					</span>
					<div class="mt-2 flex flex-col items-center">
						<span class="text-xs md:text-sm uppercase tracking-wide text-base-content/60">Rest</span>
						<span class="text-3xl md:text-5xl font-bold tabular-nums text-base-content/80" data-testid="view-home-remaining">
							{live.home_remaining}
						</span>
					</div>
				</div>
			</div>
			<div
				class="card shadow-md flex flex-col {awayIsActive ? 'bg-primary/10 ring-2 ring-primary' : 'bg-base-100'}"
				data-testid="view-away-card"
			>
				<div class="card-body flex flex-col items-center justify-center gap-2 py-4 px-3">
					<div class="flex items-center gap-2 text-base md:text-lg font-medium {awayIsActive ? 'text-primary' : 'text-base-content/70'}">
						{#if awayIsActive}
							<span class="inline-block w-2 h-2 rounded-full bg-primary animate-pulse"></span>
						{/if}
						<span>⌀ Schnitt</span>
					</div>
					<span
						class="font-black tabular-nums leading-none {awayIsActive ? 'text-primary' : 'text-base-content'}"
						style="font-size: clamp(5rem, 22vw, 18rem);"
						data-testid="view-away-average"
					>
						{live.away_average.toFixed(1)}
					</span>
					<div class="mt-2 flex flex-col items-center">
						<span class="text-xs md:text-sm uppercase tracking-wide text-base-content/60">Rest</span>
						<span class="text-3xl md:text-5xl font-bold tabular-nums text-base-content/80" data-testid="view-away-remaining">
							{live.away_remaining}
						</span>
					</div>
				</div>
			</div>
		</div>

		<!-- Current turn / leg info (compact footer) -->
		<div class="flex items-center justify-center gap-4 flex-wrap px-4 py-2 bg-base-100 rounded-lg shadow-sm shrink-0" data-testid="view-turn-info">
			<span class="text-sm md:text-base text-base-content/70">
				Leg {live.leg_number} &middot; Dart {live.current_dart} von 3
			</span>
			{#if live.current_turn_throws.length > 0}
				<div class="flex items-center gap-2" data-testid="view-current-throws">
					{#each live.current_turn_throws as t, i (i)}
						<div class="badge badge-lg {t.is_bust ? 'badge-error' : 'badge-neutral'} text-sm md:text-base">
							{formatThrow(t)}
						</div>
					{/each}
				</div>
				<span class="text-lg md:text-2xl font-bold">
					Σ {live.current_turn_throws.reduce((s, t) => s + (t.is_bust ? 0 : t.score), 0)}
				</span>
			{/if}
			{#if isMatchPoint}
				<div class="badge badge-warning badge-lg animate-pulse font-semibold" data-testid="view-match-point">
					Match Point
				</div>
			{/if}
		</div>
	{:else if live && live.game_mode === 'cricket'}
		<div class="card bg-base-100 shadow-sm flex-1">
			<div class="card-body items-center justify-center text-center">
				<p class="text-lg text-base-content/70">
					Cricket-Live-Ansicht bald verfuegbar. Aktueller Leg-Stand siehe oben.
				</p>
			</div>
		</div>
	{:else}
		<div class="card bg-base-100 shadow-sm flex-1">
			<div class="card-body items-center justify-center text-center" data-testid="view-no-live">
				<p class="text-lg text-base-content/70">
					Spiel noch nicht gestartet oder pausiert. Live-Daten erscheinen, sobald der Organisator das Spiel startet.
				</p>
			</div>
		</div>
	{/if}
</div>
