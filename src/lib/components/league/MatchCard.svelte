<script lang="ts">
	import type { Match } from '$lib/types/league.js';
	import ClubCrest from '$lib/components/clubs/ClubCrest.svelte';

	interface Props {
		match: Match;
		showPlayLink?: boolean;
		seasonId?: string;
	}

	let { match, showPlayLink = false, seasonId }: Props = $props();

	const statusLabel = $derived(
		match.status === 'completed'
			? 'Beendet'
			: match.status === 'in_progress'
				? 'Live'
				: 'Geplant'
	);

	const statusClass = $derived(
		match.status === 'completed'
			? 'badge-ghost'
			: match.status === 'in_progress'
				? 'badge-success'
				: 'badge-info'
	);

	const formattedDate = $derived(
		match.scheduled_at
			? new Date(match.scheduled_at).toLocaleDateString('de-DE', {
					day: '2-digit',
					month: '2-digit',
					year: 'numeric'
				})
			: 'TBD'
	);
</script>

<div class="card card-border bg-base-100 shadow-sm" data-testid="match-card">
	<div class="card-body p-4">
		<div class="flex items-center justify-between gap-4">
			<div class="flex items-center gap-2 flex-1 min-w-0">
				<ClubCrest
					crest_url={match.home_club.crest_url}
					club_name={match.home_club.name}
					primary_color={match.home_club.primary_color}
					size={32}
				/>
				<span class="font-medium truncate" data-testid="match-home-name">{match.home_club.short_name}</span>
			</div>

			<div class="flex items-center gap-2 text-center shrink-0">
				{#if match.status === 'completed' || match.status === 'in_progress'}
					<span class="text-xl font-bold" data-testid="match-score">
						{match.home_legs_won} : {match.away_legs_won}
					</span>
				{:else}
					<span class="text-sm text-base-content/60">{formattedDate}</span>
				{/if}
			</div>

			<div class="flex items-center gap-2 flex-1 min-w-0 justify-end">
				<span class="font-medium truncate" data-testid="match-away-name">{match.away_club.short_name}</span>
				<ClubCrest
					crest_url={match.away_club.crest_url}
					club_name={match.away_club.name}
					primary_color={match.away_club.primary_color}
					size={32}
				/>
			</div>
		</div>

		<div class="text-center mt-1 flex items-center justify-center gap-2">
			<span class="badge badge-sm {statusClass}">{statusLabel}</span>
			{#if showPlayLink && seasonId && match.status !== 'completed'}
				<a
					href="/seasons/{seasonId}/matches/{match.id}/play"
					class="btn btn-xs btn-primary"
					data-testid="play-match-btn"
				>
					Spielen
				</a>
			{/if}
		</div>
	</div>
</div>
