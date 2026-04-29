<script lang="ts">
	import Dartboard from '$lib/components/dartboard/Dartboard.svelte';
	import LeagueTable from '$lib/components/league/LeagueTable.svelte';
	import MatchCard from '$lib/components/league/MatchCard.svelte';
	import ClubCrest from '$lib/components/clubs/ClubCrest.svelte';
	import type { Multiplier, SectorValue } from '$lib/types/game.js';

	let { data } = $props();

	let lastHit = $state<{ sector: SectorValue; multiplier: Multiplier; score: number } | null>(null);

	function handleHit(event: { sector: SectorValue; multiplier: Multiplier; score: number }) {
		lastHit = event;
	}

	const multiplierLabel = $derived(
		lastHit
			? lastHit.multiplier === 3
				? 'Triple'
				: lastHit.multiplier === 2
					? 'Double'
					: 'Single'
			: ''
	);

	const isLive = $derived(data.activeTournament?.status === 'running');
</script>

<div class="flex flex-col gap-8">
	<!-- Hero -->
	<section
		class="relative overflow-hidden rounded-2xl border border-base-300/40 bg-gradient-to-br from-primary/15 via-base-100 to-accent/10 p-6 md:p-10 shadow-sm"
	>
		<div
			class="pointer-events-none absolute -right-24 -top-24 h-80 w-80 opacity-20 spin-slow hidden md:block"
			aria-hidden="true"
		>
			<Dartboard size={320} />
		</div>

		<div class="relative max-w-2xl flex flex-col gap-4">
			{#if data.activeTournament}
				<div class="flex items-center gap-2 text-sm">
					{#if isLive}
						<span
							class="inline-block h-2.5 w-2.5 rounded-full bg-success live-dot"
							aria-hidden="true"
						></span>
						<span class="font-semibold uppercase tracking-wider text-success">Live jetzt</span>
					{:else}
						<span class="font-semibold uppercase tracking-wider text-base-content/60">
							Aktuelles Turnier
						</span>
					{/if}
				</div>
				<h1 class="font-display text-4xl md:text-6xl font-extrabold leading-tight">
					{data.activeTournament.name}
				</h1>
				<p class="text-base-content/70 text-lg">
					{data.activeTournament.game_mode} ·
					{data.activeTournament.format === 'round_robin' ? 'Jeder gegen Jeden' : 'K.O.'} ·
					{data.activeTournament.legs_per_set} Legs/Set ·
					{data.activeTournament.sets_per_match} Sets/Match
				</p>
				<div class="flex flex-wrap gap-3 mt-2">
					<a href="/tournaments/{data.activeTournament.id}" class="btn btn-primary">
						Zum Turnier
					</a>
					<a href="/tournaments" class="btn btn-ghost">Alle Turniere</a>
				</div>
			{:else}
				<div class="flex items-center gap-2 text-sm">
					<span class="font-semibold uppercase tracking-wider text-base-content/60">
						Willkommen
					</span>
				</div>
				<h1 class="font-display text-4xl md:text-6xl font-extrabold leading-tight">
					Bullseye<span class="text-primary">.</span>
				</h1>
				<p class="text-base-content/70 text-lg">
					Verwalte Vereine, plane Turniere und werte jeden Wurf live aus.
				</p>
				<div class="flex flex-wrap gap-3 mt-2">
					<a href="/tournaments/new" class="btn btn-primary">Turnier erstellen</a>
					<a href="/clubs" class="btn btn-ghost">Vereine verwalten</a>
				</div>
			{/if}
		</div>
	</section>

	<!-- Stat strip -->
	<section class="grid grid-cols-2 md:grid-cols-4 gap-3" aria-label="Übersicht">
		<div class="card bg-base-100 border border-base-300/40 shadow-sm">
			<div class="card-body p-4">
				<div class="text-xs uppercase tracking-wider text-base-content/60">Laufend</div>
				<div class="font-display text-3xl md:text-4xl font-extrabold tabular-nums text-success">
					{data.stats.runningTournaments}
				</div>
				<div class="text-xs text-base-content/60">Turniere live</div>
			</div>
		</div>
		<div class="card bg-base-100 border border-base-300/40 shadow-sm">
			<div class="card-body p-4">
				<div class="text-xs uppercase tracking-wider text-base-content/60">Turniere</div>
				<div class="font-display text-3xl md:text-4xl font-extrabold tabular-nums text-primary">
					{data.stats.tournaments}
				</div>
				<div class="text-xs text-base-content/60">gesamt</div>
			</div>
		</div>
		<div class="card bg-base-100 border border-base-300/40 shadow-sm">
			<div class="card-body p-4">
				<div class="text-xs uppercase tracking-wider text-base-content/60">Vereine</div>
				<div class="font-display text-3xl md:text-4xl font-extrabold tabular-nums">
					{data.stats.clubs}
				</div>
				<div class="text-xs text-base-content/60">registriert</div>
			</div>
		</div>
		<div class="card bg-base-100 border border-base-300/40 shadow-sm">
			<div class="card-body p-4">
				<div class="text-xs uppercase tracking-wider text-base-content/60">Spieler</div>
				<div class="font-display text-3xl md:text-4xl font-extrabold tabular-nums text-accent">
					{data.stats.players}
				</div>
				<div class="text-xs text-base-content/60">aktiv</div>
			</div>
		</div>
	</section>

	{#if data.activeTournament}
		<div class="grid gap-6 lg:grid-cols-2">
			<div class="card bg-base-100 shadow-sm">
				<div class="card-body">
					<div class="flex items-center justify-between">
						<h2 class="font-display card-title text-2xl">Tabelle</h2>
						<a href="/tournaments/{data.activeTournament.id}" class="btn btn-ghost btn-sm">Details</a>
					</div>
					<LeagueTable standings={data.standings} />
				</div>
			</div>

			<div class="flex flex-col gap-6">
				{#if data.recentMatches.length > 0}
					<div class="card bg-base-100 shadow-sm">
						<div class="card-body">
							<h2 class="font-display card-title text-2xl">Letzte Ergebnisse</h2>
							<div class="grid gap-3">
								{#each data.recentMatches as match (match.id)}
									<MatchCard {match} />
								{/each}
							</div>
						</div>
					</div>
				{/if}

				<div class="card bg-base-100 shadow-sm">
					<div class="card-body items-center">
						<h2 class="font-display card-title text-2xl mb-2">Probewurf</h2>
						<Dartboard size={300} onhit={handleHit} />
						{#if lastHit}
							<div class="stats shadow mt-4">
								<div class="stat py-2">
									<div class="stat-title text-xs">Letzter Treffer</div>
									<div class="stat-value font-display text-lg text-primary">{lastHit.score}</div>
									<div class="stat-desc text-xs">
										{multiplierLabel}
										{lastHit.sector === 25 ? 'Bull' : lastHit.sector}
									</div>
								</div>
							</div>
						{/if}
					</div>
				</div>
			</div>
		</div>
	{:else}
		<div class="grid gap-6 lg:grid-cols-3">
			<div class="card bg-base-100 shadow-sm lg:col-span-2">
				<div class="card-body">
					<div class="flex items-center justify-between mb-2">
						<h2 class="font-display card-title text-2xl">Mannschaften</h2>
						<a href="/clubs" class="btn btn-ghost btn-sm">Alle ansehen</a>
					</div>
					{#if data.clubs.length === 0}
						<p class="text-base-content/60 text-sm">Noch keine Vereine angelegt.</p>
					{:else}
						<div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
							{#each data.clubs as club (club.id)}
								<a
									href="/clubs/{club.id}"
									class="relative flex items-center gap-3 p-3 rounded-lg border border-base-300/40 bg-base-100 hover:bg-base-200/60 hover:-translate-y-0.5 transition-all overflow-hidden"
									style="border-left: 4px solid {club.primary_color};"
								>
									<ClubCrest
										club_id={club.id}
										has_crest={club.has_crest}
										crest_url={club.crest_url}
										club_name={club.name}
										primary_color={club.primary_color}
										secondary_color={club.secondary_color}
										size={48}
									/>
									<div class="min-w-0">
										<div class="font-semibold text-sm truncate">{club.name}</div>
										<div class="text-xs text-base-content/60">{club.short_name}</div>
									</div>
								</a>
							{/each}
						</div>
					{/if}
				</div>
			</div>

			<div class="card bg-base-100 shadow-sm">
				<div class="card-body items-center">
					<h2 class="font-display card-title text-2xl mb-2">Probewurf</h2>
					<Dartboard size={280} onhit={handleHit} />
					{#if lastHit}
						<div class="stats shadow mt-4">
							<div class="stat py-2">
								<div class="stat-title text-xs">Letzter Treffer</div>
								<div class="stat-value font-display text-lg text-primary">{lastHit.score}</div>
								<div class="stat-desc text-xs">
									{multiplierLabel}
									{lastHit.sector === 25 ? 'Bull' : lastHit.sector}
								</div>
							</div>
						</div>
					{/if}
				</div>
			</div>
		</div>
	{/if}
</div>
