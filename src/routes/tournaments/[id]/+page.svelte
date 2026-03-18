<script lang="ts">
	import LeagueTable from '$lib/components/league/LeagueTable.svelte';
	import MatchCard from '$lib/components/league/MatchCard.svelte';
	import KnockoutBracket from '$lib/components/league/KnockoutBracket.svelte';
	import ClubCrest from '$lib/components/clubs/ClubCrest.svelte';
	import type { TournamentStatus } from '$lib/types/league.js';

	let { data } = $props();

	const formatLabel = $derived(
		data.tournament.format === 'round_robin' ? 'Jeder gegen Jeden' : 'K.O.'
	);

	const STATUS_BADGE: Record<TournamentStatus, { label: string; class: string }> = {
		planned: { label: 'Geplant', class: 'badge-info' },
		running: { label: 'Laufend', class: 'badge-success' },
		finished: { label: 'Beendet', class: 'badge-neutral' },
		aborted: { label: 'Abgebrochen', class: 'badge-error' }
	};

	const STATUS_LABELS: Record<TournamentStatus, string> = {
		planned: 'Geplant',
		running: 'Laufend',
		finished: 'Beendet',
		aborted: 'Abgebrochen'
	};
</script>

<div class="flex flex-col gap-6">
	<div class="flex items-center gap-4">
		<a href="/tournaments" class="btn btn-ghost btn-sm">Zurueck</a>
		<h1 class="text-2xl font-bold">{data.tournament.name}</h1>
		<span class="badge {STATUS_BADGE[data.tournament.status].class}" data-testid="tournament-status-badge">
			{STATUS_BADGE[data.tournament.status].label}
		</span>
	</div>

	<div class="flex items-center gap-4 text-sm text-base-content/60">
		<span>
			{data.tournament.game_mode} &middot; {formatLabel} &middot;
			{data.tournament.legs_per_set} Legs/Set &middot; {data.tournament.sets_per_match} Sets/Match
		</span>
		<form method="POST" action="?/updateStatus" class="flex items-center gap-2" data-testid="status-form">
			<select name="status" class="select select-bordered select-xs" value={data.tournament.status} data-testid="status-select">
				{#each Object.entries(STATUS_LABELS) as [value, label]}
					<option {value} selected={value === data.tournament.status}>{label}</option>
				{/each}
			</select>
			<button type="submit" class="btn btn-xs btn-outline" data-testid="status-submit">Aendern</button>
		</form>
	</div>

	<!-- Organizer card -->
	{#if data.tournament.organizer_name}
		<div class="card card-border bg-base-100 shadow-sm" data-testid="organizer-card">
			<div class="card-body p-4 flex-row items-center gap-4">
				{#if data.tournament.has_organizer_logo}
					<img
						src="/api/tournaments/{data.tournament.id}/logo"
						alt="Logo {data.tournament.organizer_name}"
						class="w-14 h-14 rounded-lg object-contain"
					/>
				{:else}
					<div class="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
						{data.tournament.organizer_name.slice(0, 2).toUpperCase()}
					</div>
				{/if}
				<div class="flex flex-col gap-0.5">
					<span class="font-semibold">{data.tournament.organizer_name}</span>
					{#if data.tournament.organizer_contact}
						<span class="text-sm text-base-content/60">{data.tournament.organizer_contact}</span>
					{/if}
					{#if data.tournament.organizer_note}
						<span class="text-sm italic text-base-content/50">'{data.tournament.organizer_note}'</span>
					{/if}
				</div>
			</div>
		</div>
	{/if}

	<!-- Standings (round-robin) or Bracket (knockout) -->
	{#if data.tournament.format === 'round_robin'}
		<div class="card bg-base-100 shadow-sm">
			<div class="card-body">
				<h2 class="card-title">Tabelle</h2>
				{#if data.standings.length === 0}
					<p class="text-base-content/60">Noch keine Vereine zugeordnet.</p>
				{:else}
					<LeagueTable standings={data.standings} />
				{/if}
			</div>
		</div>
	{:else}
		<div class="card bg-base-100 shadow-sm">
			<div class="card-body">
				<h2 class="card-title">K.O.-Runde</h2>
				{#if data.matches.length === 0}
					<p class="text-base-content/60">Noch keine Spiele generiert.</p>
				{:else}
					<KnockoutBracket matches={data.matches} tournamentId={data.tournament.id} />
				{/if}
			</div>
		</div>
	{/if}

	<!-- Matches -->
	<div class="card bg-base-100 shadow-sm">
		<div class="card-body">
			<div class="flex items-center justify-between">
				<h2 class="card-title">Spiele</h2>
				{#if data.assignedClubIds.length >= 2}
					<form method="POST" action="?/generatePairings">
						{#if data.matches.length === 0}
							<button type="submit" class="btn btn-sm btn-secondary" data-testid="generate-pairings-btn">
								Paarungen generieren
							</button>
						{:else if data.hasMissingPairings}
							<button type="submit" class="btn btn-sm btn-secondary btn-outline" data-testid="update-pairings-btn">
								Paarungen aktualisieren
							</button>
						{/if}
					</form>
				{/if}
			</div>
			{#if data.matches.length === 0}
				<p class="text-base-content/60">Noch keine Spiele geplant.</p>
			{:else}
				<div class="grid gap-3" data-testid="match-list">
					{#each data.matches as match (match.id)}
						<MatchCard {match} showPlayLink={true} tournamentId={data.tournament.id} />
					{/each}
				</div>
			{/if}

			{#if data.assignedClubIds.length >= 2}
				<details class="collapse collapse-arrow bg-base-200 mt-4">
					<summary class="collapse-title font-medium">Spiel manuell planen</summary>
					<div class="collapse-content">
						<form method="POST" action="?/scheduleMatch" class="flex flex-col gap-3 pt-2" data-testid="schedule-match-form">
							<div class="flex gap-4">
								<div class="form-control flex-1">
									<label class="label text-sm" for="home_club_id">Heim</label>
									<select id="home_club_id" name="home_club_id" class="select select-bordered select-sm w-full" data-testid="match-home-select">
										{#each data.standings as s (s.club_id)}
											<option value={s.club_id}>{s.club_name}</option>
										{/each}
									</select>
								</div>
								<div class="form-control flex-1">
									<label class="label text-sm" for="away_club_id">Gast</label>
									<select id="away_club_id" name="away_club_id" class="select select-bordered select-sm w-full" data-testid="match-away-select">
										{#each data.standings as s (s.club_id)}
											<option value={s.club_id}>{s.club_name}</option>
										{/each}
									</select>
								</div>
							</div>
							<div class="form-control">
								<label class="label text-sm" for="scheduled_at">Datum</label>
								<input type="datetime-local" id="scheduled_at" name="scheduled_at" class="input input-bordered input-sm w-full" />
							</div>
							<button type="submit" class="btn btn-primary btn-sm self-end" data-testid="schedule-match-submit">Spiel planen</button>
						</form>
					</div>
				</details>
			{/if}
		</div>
	</div>

	<!-- Club Assignment -->
	<div class="card bg-base-100 shadow-sm">
		<div class="card-body">
			<h2 class="card-title">Vereine verwalten</h2>

			{#if data.assignedClubIds.length > 0}
				<div class="flex flex-wrap gap-2 mb-4" data-testid="assigned-clubs">
					{#each data.standings as standing (standing.club_id)}
						<form method="POST" action="?/removeClub" class="inline">
							<input type="hidden" name="club_id" value={standing.club_id} />
							<button type="submit" class="btn btn-sm btn-outline gap-1" data-testid="remove-club-btn">
								<ClubCrest
									club_id={standing.club_id}
									has_crest={standing.has_crest}
									crest_url={standing.crest_url}
									club_name={standing.club_name}
									primary_color="#666"
									size={20}
								/>
								{standing.short_name}
								<span class="text-error">x</span>
							</button>
						</form>
					{/each}
				</div>
			{/if}

			{#if data.availableClubs.length > 0}
				<form method="POST" action="?/assignClub" class="flex gap-2" data-testid="assign-club-form">
					<select name="club_id" class="select select-bordered select-sm flex-1" data-testid="assign-club-select">
						{#each data.availableClubs as club (club.id)}
							<option value={club.id}>{club.name}</option>
						{/each}
					</select>
					<button type="submit" class="btn btn-sm btn-primary" data-testid="assign-club-submit">Hinzufuegen</button>
				</form>
			{:else}
				<p class="text-sm text-base-content/60">Alle Vereine sind bereits zugeordnet.</p>
			{/if}
		</div>
	</div>
</div>
