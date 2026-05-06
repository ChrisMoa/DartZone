<script lang="ts">
	import type { Match } from '$lib/types/league.js';
	import ClubCrest from '$lib/components/clubs/ClubCrest.svelte';

	interface Props {
		match: Match;
		showPlayLink?: boolean;
		tournamentId?: string;
		size?: 'sm' | 'lg';
	}

	let { match, showPlayLink = false, tournamentId, size = 'sm' }: Props = $props();

	const isLarge = $derived(size === 'lg');

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

	const crestSize = $derived(isLarge ? 64 : 32);
</script>

<div
	class="card card-border bg-base-100 shadow-sm {match.status === 'in_progress' ? 'ring-2 ring-success/40' : ''}"
	data-testid="match-card"
>
	<div class="card-body {isLarge ? 'p-5 md:p-6' : 'p-4'}">
		<div class="flex items-center justify-between gap-3 md:gap-6">
			<!-- Home -->
			<div class="flex items-center gap-3 md:gap-4 flex-1 min-w-0 {isLarge ? 'justify-end text-right' : ''}">
				{#if !isLarge}
					<ClubCrest
						club_id={match.home_club.id}
						has_crest={match.home_club.has_crest}
						crest_url={match.home_club.crest_url}
						club_name={match.home_club.name}
						primary_color={match.home_club.primary_color}
						size={crestSize}
					/>
					<span class="font-medium truncate" data-testid="match-home-name">{match.home_club.short_name}</span>
				{:else}
					<div class="flex flex-col items-end min-w-0">
						<span class="text-xl md:text-2xl font-bold truncate max-w-full" data-testid="match-home-name">
							{match.home_club.name}
						</span>
						<span class="text-xs md:text-sm text-base-content/60 uppercase tracking-wide">
							{match.home_club.short_name}
						</span>
					</div>
					<ClubCrest
						club_id={match.home_club.id}
						has_crest={match.home_club.has_crest}
						crest_url={match.home_club.crest_url}
						club_name={match.home_club.name}
						primary_color={match.home_club.primary_color}
						size={crestSize}
					/>
				{/if}
			</div>

			<!-- Center: score / vs / date -->
			<div class="flex flex-col items-center gap-1 shrink-0 {isLarge ? 'min-w-[5rem] md:min-w-[7rem]' : ''}">
				{#if match.status === 'completed' || match.status === 'in_progress'}
					<span
						class="font-bold tabular-nums {isLarge ? 'text-3xl md:text-5xl' : 'text-xl'}"
						data-testid="match-score"
					>
						{match.home_legs_won} : {match.away_legs_won}
					</span>
					{#if isLarge}
						<span class="badge badge-sm {statusClass}">{statusLabel}</span>
					{/if}
				{:else}
					<span class="text-base-content/40 font-light {isLarge ? 'text-2xl md:text-3xl' : 'text-base'}">vs</span>
					<span class="text-xs md:text-sm text-base-content/60">{formattedDate}</span>
					{#if isLarge}
						<span class="badge badge-sm {statusClass}">{statusLabel}</span>
					{/if}
				{/if}
			</div>

			<!-- Away -->
			<div class="flex items-center gap-3 md:gap-4 flex-1 min-w-0 justify-end {isLarge ? 'justify-start text-left' : ''}">
				{#if !isLarge}
					<span class="font-medium truncate" data-testid="match-away-name">{match.away_club.short_name}</span>
					<ClubCrest
						club_id={match.away_club.id}
						has_crest={match.away_club.has_crest}
						crest_url={match.away_club.crest_url}
						club_name={match.away_club.name}
						primary_color={match.away_club.primary_color}
						size={crestSize}
					/>
				{:else}
					<ClubCrest
						club_id={match.away_club.id}
						has_crest={match.away_club.has_crest}
						crest_url={match.away_club.crest_url}
						club_name={match.away_club.name}
						primary_color={match.away_club.primary_color}
						size={crestSize}
					/>
					<div class="flex flex-col items-start min-w-0">
						<span class="text-xl md:text-2xl font-bold truncate max-w-full" data-testid="match-away-name">
							{match.away_club.name}
						</span>
						<span class="text-xs md:text-sm text-base-content/60 uppercase tracking-wide">
							{match.away_club.short_name}
						</span>
					</div>
				{/if}
			</div>
		</div>

		<!-- Footer actions -->
		<div class="text-center mt-2 flex items-center justify-center gap-2 flex-wrap">
			{#if !isLarge}
				<span class="badge badge-sm {statusClass}">{statusLabel}</span>
			{/if}
			{#if match.scheduled_at && (match.status === 'completed' || match.status === 'in_progress') && isLarge}
				<span class="text-xs text-base-content/50">{formattedDate}</span>
			{/if}
			{#if showPlayLink && tournamentId && match.status !== 'completed'}
				<a
					href="/tournaments/{tournamentId}/matches/{match.id}/play"
					class="btn {isLarge ? 'btn-sm md:btn-md' : 'btn-xs'} btn-primary"
					data-testid="play-match-btn"
				>
					Spielen
				</a>
			{/if}
			{#if tournamentId && match.status === 'in_progress'}
				<a
					href="/tournaments/{tournamentId}/matches/{match.id}/view"
					target="_blank"
					rel="noopener"
					class="btn {isLarge ? 'btn-sm' : 'btn-xs'} btn-outline"
					data-testid="view-match-btn"
				>
					Zuschauer
				</a>
			{/if}
		</div>
	</div>
</div>
