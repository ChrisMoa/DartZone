<script lang="ts">
	import type { Match } from '$lib/types/league.js';
	import ClubCrest from '$lib/components/clubs/ClubCrest.svelte';

	interface Props {
		matches: Match[];
		tournamentId: string;
	}

	let { matches, tournamentId }: Props = $props();

	/** Round name → ordering index (lower = earlier round). */
	const ROUND_ORDER: Record<string, number> = {
		'Runde 1': 0,
		'Achtelfinale': 1,
		'Viertelfinale': 2,
		'Halbfinale': 3,
		'Finale': 4
	};

	const ROUND_SEQUENCE = ['Runde 1', 'Achtelfinale', 'Viertelfinale', 'Halbfinale', 'Finale'];

	interface BracketSlot {
		match: Match | null;
		roundName: string;
	}

	/** Build the bracket rounds from real matches + TBD placeholders for future rounds. */
	const bracketRounds = $derived.by((): { name: string; slots: BracketSlot[] }[] => {
		// Group matches by round
		const byRound = new Map<string, Match[]>();
		for (const m of matches) {
			const round = m.round ?? 'Unbekannt';
			if (!byRound.has(round)) byRound.set(round, []);
			byRound.get(round)!.push(m);
		}

		// Find the earliest round (most matches)
		const roundNames = [...byRound.keys()].sort(
			(a, b) => (ROUND_ORDER[a] ?? -1) - (ROUND_ORDER[b] ?? -1)
		);

		if (roundNames.length === 0) return [];

		const firstRoundName = roundNames[0];
		const firstRoundMatches = byRound.get(firstRoundName)!;
		const firstRoundIdx = ROUND_SEQUENCE.indexOf(firstRoundName);

		// Calculate total rounds needed: from first round to Finale
		const finaleIdx = ROUND_SEQUENCE.indexOf('Finale');
		const startIdx = firstRoundIdx >= 0 ? firstRoundIdx : 0;

		const rounds: { name: string; slots: BracketSlot[] }[] = [];
		let slotsInRound = firstRoundMatches.length;

		for (let i = startIdx; i <= finaleIdx; i++) {
			const roundName = ROUND_SEQUENCE[i];
			const existingMatches = byRound.get(roundName) ?? [];

			const slots: BracketSlot[] = [];
			for (let s = 0; s < slotsInRound; s++) {
				slots.push({
					match: existingMatches[s] ?? null,
					roundName
				});
			}

			rounds.push({ name: roundName, slots });
			slotsInRound = Math.max(1, Math.ceil(slotsInRound / 2));
		}

		return rounds;
	});

	function getWinnerId(match: Match): string | null {
		if (match.status !== 'completed') return null;
		return match.home_legs_won > match.away_legs_won
			? match.home_club.id
			: match.away_legs_won > match.home_legs_won
				? match.away_club.id
				: null;
	}

	/** The tournament winner (finale completed). */
	const finaleWinner = $derived.by(() => {
		const finale = bracketRounds.at(-1)?.slots[0]?.match;
		if (!finale || finale.status !== 'completed') return null;
		const winnerId = getWinnerId(finale);
		if (!winnerId) return null;
		return winnerId === finale.home_club.id ? finale.home_club : finale.away_club;
	});
</script>

<div class="overflow-x-auto" data-testid="knockout-bracket">
	<div class="bracket">
		{#each bracketRounds as round, roundIdx}
			<div class="bracket-round">
				<div class="bracket-round-title">{round.name}</div>
				<div class="bracket-round-matches">
					{#each round.slots as slot, slotIdx}
						{@const match = slot.match}
						{@const winnerId = match ? getWinnerId(match) : null}
						{@const isLast = roundIdx === bracketRounds.length - 1}

						<div class="bracket-match-wrapper">
							<!-- Connector lines (not on first round) -->
							{#if roundIdx > 0}
								<div class="bracket-connector-in"></div>
							{/if}

							<div
								class="bracket-match"
								class:bracket-match--completed={match?.status === 'completed'}
								class:bracket-match--live={match?.status === 'in_progress'}
								class:bracket-match--tbd={!match}
								data-testid="bracket-match"
							>
								{#if match}
									{@const homeIsWinner = winnerId === match.home_club.id}
									{@const awayIsWinner = winnerId === match.away_club.id}

									<!-- Home team row -->
									<div
										class="bracket-team"
										class:bracket-team--winner={homeIsWinner}
										class:bracket-team--loser={winnerId && !homeIsWinner}
									>
										<ClubCrest
											club_id={match.home_club.id}
											has_crest={match.home_club.has_crest}
											crest_url={match.home_club.crest_url}
											club_name={match.home_club.name}
											primary_color={match.home_club.primary_color}
											size={20}
										/>
										<span class="bracket-team-name">{match.home_club.short_name}</span>
										<span class="bracket-team-score">{match.home_legs_won}</span>
									</div>

									<div class="bracket-divider"></div>

									<!-- Away team row -->
									<div
										class="bracket-team"
										class:bracket-team--winner={awayIsWinner}
										class:bracket-team--loser={winnerId && !awayIsWinner}
									>
										<ClubCrest
											club_id={match.away_club.id}
											has_crest={match.away_club.has_crest}
											crest_url={match.away_club.crest_url}
											club_name={match.away_club.name}
											primary_color={match.away_club.primary_color}
											size={20}
										/>
										<span class="bracket-team-name">{match.away_club.short_name}</span>
										<span class="bracket-team-score">{match.away_legs_won}</span>
									</div>

									<!-- Status / play link -->
									{#if match.status === 'in_progress'}
										<a
											href="/tournaments/{tournamentId}/matches/{match.id}/play"
											class="bracket-status bracket-status--live"
										>Live</a>
									{:else if match.status === 'scheduled'}
										<a
											href="/tournaments/{tournamentId}/matches/{match.id}/play"
											class="bracket-status bracket-status--scheduled"
										>Spielen</a>
									{/if}
								{:else}
									<!-- TBD slot -->
									<div class="bracket-team bracket-team--tbd">
										<span class="bracket-team-name text-base-content/30">TBD</span>
									</div>
									<div class="bracket-divider"></div>
									<div class="bracket-team bracket-team--tbd">
										<span class="bracket-team-name text-base-content/30">TBD</span>
									</div>
								{/if}
							</div>

							<!-- Connector lines (not on last round) -->
							{#if !isLast}
								<div class="bracket-connector-out"></div>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		{/each}

		<!-- Trophy for the winner of the finale -->
		{#if finaleWinner}
			<div class="bracket-round">
				<div class="bracket-round-title">&nbsp;</div>
				<div class="bracket-round-matches">
					<div class="bracket-match-wrapper">
						<div class="bracket-connector-in"></div>
						<div class="bracket-trophy" data-testid="bracket-winner">
							<ClubCrest
								club_id={finaleWinner.id}
								has_crest={finaleWinner.has_crest}
								crest_url={finaleWinner.crest_url}
								club_name={finaleWinner.name}
								primary_color={finaleWinner.primary_color}
								size={36}
							/>
							<span class="text-2xl">🏆</span>
						</div>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	.bracket {
		display: flex;
		gap: 0;
		padding: 1rem 0;
		min-width: max-content;
	}

	.bracket-round {
		display: flex;
		flex-direction: column;
		min-width: 180px;
	}

	.bracket-round-title {
		text-align: center;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		opacity: 0.5;
		padding-bottom: 0.75rem;
	}

	.bracket-round-matches {
		display: flex;
		flex-direction: column;
		flex: 1;
		justify-content: space-around;
	}

	.bracket-match-wrapper {
		display: flex;
		align-items: center;
		padding: 0.25rem 0;
	}

	.bracket-connector-in,
	.bracket-connector-out {
		width: 20px;
		min-width: 20px;
		align-self: stretch;
		position: relative;
	}

	.bracket-connector-in::before {
		content: '';
		position: absolute;
		right: 0;
		top: 50%;
		width: 100%;
		height: 0;
		border-top: 2px solid oklch(var(--bc) / 0.15);
	}

	.bracket-connector-out::before {
		content: '';
		position: absolute;
		left: 0;
		top: 50%;
		width: 100%;
		height: 0;
		border-top: 2px solid oklch(var(--bc) / 0.15);
	}

	/* Vertical connectors: connect pairs of matches to next round */
	.bracket-round-matches > .bracket-match-wrapper:nth-child(odd) .bracket-connector-out::after {
		content: '';
		position: absolute;
		right: 0;
		top: 50%;
		bottom: 0;
		width: 0;
		border-right: 2px solid oklch(var(--bc) / 0.15);
	}

	.bracket-round-matches > .bracket-match-wrapper:nth-child(even) .bracket-connector-out::after {
		content: '';
		position: absolute;
		right: 0;
		top: 0;
		bottom: 50%;
		width: 0;
		border-right: 2px solid oklch(var(--bc) / 0.15);
	}

	.bracket-match {
		flex: 1;
		border: 1px solid oklch(var(--bc) / 0.1);
		border-radius: 0.5rem;
		background: oklch(var(--b1));
		padding: 0.25rem;
		min-width: 140px;
		position: relative;
	}

	.bracket-match--completed {
		border-color: oklch(var(--su) / 0.3);
	}

	.bracket-match--live {
		border-color: oklch(var(--su) / 0.6);
		box-shadow: 0 0 0 1px oklch(var(--su) / 0.2);
	}

	.bracket-match--tbd {
		border-style: dashed;
		opacity: 0.5;
	}

	.bracket-team {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.25rem 0.375rem;
		border-radius: 0.25rem;
	}

	.bracket-team--winner {
		font-weight: 700;
		background: oklch(var(--su) / 0.08);
	}

	.bracket-team--loser {
		opacity: 0.45;
	}

	.bracket-team--tbd {
		min-height: 1.75rem;
	}

	.bracket-team-name {
		flex: 1;
		font-size: 0.8rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.bracket-team-score {
		font-size: 0.8rem;
		font-variant-numeric: tabular-nums;
		min-width: 1rem;
		text-align: right;
	}

	.bracket-divider {
		height: 1px;
		background: oklch(var(--bc) / 0.08);
		margin: 0 0.375rem;
	}

	.bracket-status {
		display: block;
		text-align: center;
		font-size: 0.65rem;
		padding: 0.125rem 0;
		border-radius: 0 0 0.375rem 0.375rem;
		text-decoration: none;
	}

	.bracket-status--live {
		color: oklch(var(--su));
		font-weight: 600;
	}

	.bracket-status--scheduled {
		color: oklch(var(--in));
	}

	.bracket-status--scheduled:hover {
		text-decoration: underline;
	}

	.bracket-trophy {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
		padding: 0.5rem;
	}
</style>
