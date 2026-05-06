<script lang="ts">
	import { onMount } from 'svelte';
	import LeagueTable from '$lib/components/league/LeagueTable.svelte';
	import KnockoutBracket from '$lib/components/league/KnockoutBracket.svelte';
	import type { TournamentStatus, Tournament, Match, Standing, DrinkingGame } from '$lib/types/league.js';

	let { data } = $props();

	let tournament = $state<Tournament>(data.tournament);
	let standings = $state<Standing[]>(data.standings);
	let matches = $state<Match[]>(data.matches);
	let drinkingGame = $state<DrinkingGame | null>(data.drinkingGame);

	$effect(() => {
		tournament = data.tournament;
		standings = data.standings;
		matches = data.matches;
		drinkingGame = data.drinkingGame;
	});

	const formatLabel = $derived(
		tournament.format === 'round_robin' ? 'Jeder gegen Jeden' : 'K.O.'
	);

	const STATUS_BADGE: Record<TournamentStatus, { label: string; class: string }> = {
		planned: { label: 'Geplant', class: 'badge-info' },
		running: { label: 'Laufend', class: 'badge-success' },
		finished: { label: 'Beendet', class: 'badge-neutral' },
		aborted: { label: 'Abgebrochen', class: 'badge-error' }
	};

	async function fetchLiveData() {
		try {
			const res = await fetch(`/api/tournaments/${data.tournament.id}/live`);
			if (res.ok) {
				const result = await res.json();
				tournament = result.tournament;
				standings = result.standings;
				matches = result.matches;
				drinkingGame = result.drinkingGame;
			}
		} catch {
			// ignore network errors during polling
		}
	}

	onMount(() => {
		const interval = setInterval(fetchLiveData, 2000);
		return () => clearInterval(interval);
	});
</script>

<div class="flex flex-col gap-6">
	<div class="flex flex-wrap items-center gap-3">
		<a href="/tournaments" class="btn btn-ghost btn-sm">Zurueck</a>
		<h1 class="text-2xl font-bold">{tournament.name}</h1>
		<span class="badge {STATUS_BADGE[tournament.status].class}" data-testid="tournament-status-badge">
			{STATUS_BADGE[tournament.status].label}
		</span>
		<a
			href="/tournaments/{tournament.id}/matches"
			class="btn btn-sm btn-primary ml-auto"
			data-testid="organizer-view-link"
		>
			Organisator-Ansicht
		</a>
	</div>

	<div class="text-sm text-base-content/60">
		{tournament.game_mode} &middot; {formatLabel} &middot;
		{tournament.legs_per_set} Legs/Set &middot; {tournament.sets_per_match} Sets/Match
	</div>

	<!-- Organizer card -->
	{#if tournament.organizer_name}
		<div class="card card-border bg-base-100 shadow-sm" data-testid="organizer-card">
			<div class="card-body p-4 flex-row items-center gap-4">
				{#if tournament.has_organizer_logo}
					<img
						src="/api/tournaments/{tournament.id}/logo"
						alt="Logo {tournament.organizer_name}"
						class="w-14 h-14 rounded-lg object-contain"
					/>
				{:else}
					<div class="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
						{tournament.organizer_name.slice(0, 2).toUpperCase()}
					</div>
				{/if}
				<div class="flex flex-col gap-0.5">
					<span class="font-semibold">{tournament.organizer_name}</span>
					{#if tournament.organizer_contact}
						<span class="text-sm text-base-content/60">{tournament.organizer_contact}</span>
					{/if}
					{#if tournament.organizer_note}
						<span class="text-sm italic text-base-content/50">'{tournament.organizer_note}'</span>
					{/if}
				</div>
			</div>
		</div>
	{/if}

	<!-- Standings (round-robin) or Bracket (knockout) -->
	{#if tournament.format === 'round_robin'}
		<div class="card bg-base-100 shadow-sm">
			<div class="card-body">
				<h2 class="card-title">Tabelle</h2>
				{#if standings.length === 0}
					<p class="text-base-content/60">Noch keine Vereine zugeordnet.</p>
				{:else}
					<LeagueTable {standings} />
				{/if}
			</div>
		</div>
	{:else}
		<div class="card bg-base-100 shadow-sm">
			<div class="card-body">
				<h2 class="card-title">K.O.-Runde</h2>
				{#if matches.length === 0}
					<p class="text-base-content/60">Noch keine Spiele generiert.</p>
				{:else}
					<KnockoutBracket {matches} tournamentId={tournament.id} />
				{/if}
			</div>
		</div>
	{/if}

	<!-- Zuschauer-Multi-Ansicht -->
	<div class="card bg-base-100 shadow-sm" data-testid="spectator-card">
		<div class="card-body p-4 flex-row items-center justify-between">
			<div class="flex items-center gap-3">
				<span class="text-2xl">📺</span>
				<div>
					<h2 class="font-semibold">Zuschauer-Ansicht</h2>
					<span class="text-sm text-base-content/60">
						Mehrere Spiele gleichzeitig in Kachel-Ansicht
					</span>
				</div>
			</div>
			<a
				href="/tournaments/{tournament.id}/spectator"
				class="btn btn-primary btn-sm"
				data-testid="spectator-link"
			>
				Anzeigen
			</a>
		</div>
	</div>

	<!-- Statistik-Link -->
	<div class="card bg-base-100 shadow-sm" data-testid="stats-card">
		<div class="card-body p-4 flex-row items-center justify-between">
			<div class="flex items-center gap-3">
				<span class="text-2xl">📊</span>
				<div>
					<h2 class="font-semibold">Statistik</h2>
					<span class="text-sm text-base-content/60">
						{tournament.track_players ? 'Spielerwerte' : 'Teamwerte'} &middot; Schnitt, 180er, Finishes
					</span>
				</div>
			</div>
			<a
				href="/tournaments/{tournament.id}/stats"
				class="btn btn-primary btn-sm"
				data-testid="stats-link"
			>
				Anzeigen
			</a>
		</div>
	</div>

	<!-- Trinkwertung -->
	{#if drinkingGame}
		<div class="card bg-base-100 shadow-sm" data-testid="drinking-game-card">
			<div class="card-body p-4 flex-row items-center justify-between">
				<div class="flex items-center gap-3">
					<span class="text-2xl">🍺</span>
					<div>
						<h2 class="font-semibold">Trinkwertung</h2>
						<span class="text-sm text-base-content/60">
							{drinkingGame.status === 'running' ? 'Laufend' : 'Beendet'}
						</span>
					</div>
				</div>
				<a
					href="/tournaments/{tournament.id}/trinkwertung"
					class="btn btn-primary btn-sm"
					data-testid="drinking-game-link"
				>
					Anzeigen
				</a>
			</div>
		</div>
	{/if}
</div>
