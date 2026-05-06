<script lang="ts">
	import type { Match } from '$lib/types/league.js';
	import ClubCrest from '$lib/components/clubs/ClubCrest.svelte';

	interface Props {
		matches: Match[];
		tournamentId: string;
	}

	let { matches, tournamentId }: Props = $props();

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

	const bracketRounds = $derived.by((): { name: string; slots: BracketSlot[] }[] => {
		const byRound = new Map<string, Match[]>();
		for (const m of matches) {
			const round = m.round ?? 'Unbekannt';
			if (!byRound.has(round)) byRound.set(round, []);
			byRound.get(round)!.push(m);
		}

		const roundNames = [...byRound.keys()].sort(
			(a, b) => (ROUND_ORDER[a] ?? -1) - (ROUND_ORDER[b] ?? -1)
		);

		if (roundNames.length === 0) return [];

		const firstRoundName = roundNames[0];
		const firstRoundMatches = byRound.get(firstRoundName)!;
		const firstRoundIdx = ROUND_SEQUENCE.indexOf(firstRoundName);

		const finaleIdx = ROUND_SEQUENCE.indexOf('Finale');
		const startIdx = firstRoundIdx >= 0 ? firstRoundIdx : 0;

		const rounds: { name: string; slots: BracketSlot[] }[] = [];
		let slotsInRound = firstRoundMatches.length;

		for (let i = startIdx; i <= finaleIdx; i++) {
			const roundName = ROUND_SEQUENCE[i];
			const existingMatches = byRound.get(roundName) ?? [];

			const slots: BracketSlot[] = [];
			for (let s = 0; s < slotsInRound; s++) {
				slots.push({ match: existingMatches[s] ?? null, roundName });
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

	const finaleWinner = $derived.by(() => {
		const finale = bracketRounds.at(-1)?.slots[0]?.match;
		if (!finale || finale.status !== 'completed') return null;
		const winnerId = getWinnerId(finale);
		if (!winnerId) return null;
		return winnerId === finale.home_club.id ? finale.home_club : finale.away_club;
	});
</script>

<div class="overflow-x-auto pb-2" data-testid="knockout-bracket">
	<div class="bracket">
		{#each bracketRounds as round, roundIdx}
			{@const isLastRound = roundIdx === bracketRounds.length - 1}
			<div class="bracket-round">
				<div class="bracket-round-title">{round.name}</div>
				<div class="bracket-round-matches">
					{#each round.slots as slot, slotIdx}
						{@const match = slot.match}
						{@const winnerId = match ? getWinnerId(match) : null}
						{@const homeIsWinner = match && winnerId === match.home_club.id}
						{@const awayIsWinner = match && winnerId === match.away_club.id}
						{@const isOdd = slotIdx % 2 === 0}

						<div class="bracket-cell">
							<!-- in-connector from previous round -->
							{#if roundIdx > 0}
								<div class="bracket-conn-in"
									class:bracket-conn-in--winner={!!winnerId}
								></div>
							{/if}

							<!-- match card (fixed-size rectangle) -->
							<div
								class="bracket-card"
								class:bracket-card--scheduled={match?.status === 'scheduled'}
								class:bracket-card--live={match?.status === 'in_progress'}
								class:bracket-card--completed={match?.status === 'completed'}
								class:bracket-card--tbd={!match}
								data-testid="bracket-match"
							>
								{#if match}
									<!-- Home -->
									<div
										class="bracket-row"
										class:bracket-row--winner={homeIsWinner}
										class:bracket-row--loser={winnerId && !homeIsWinner}
									>
										<ClubCrest
											club_id={match.home_club.id}
											has_crest={match.home_club.has_crest}
											crest_url={match.home_club.crest_url}
											club_name={match.home_club.name}
											primary_color={match.home_club.primary_color}
											size={22}
										/>
										<span class="bracket-name">{match.home_club.short_name}</span>
										{#if homeIsWinner}<span class="bracket-pin">▶</span>{/if}
										<span class="bracket-score">{match.home_legs_won}</span>
									</div>

									<div class="bracket-vs">vs</div>

									<!-- Away -->
									<div
										class="bracket-row"
										class:bracket-row--winner={awayIsWinner}
										class:bracket-row--loser={winnerId && !awayIsWinner}
									>
										<ClubCrest
											club_id={match.away_club.id}
											has_crest={match.away_club.has_crest}
											crest_url={match.away_club.crest_url}
											club_name={match.away_club.name}
											primary_color={match.away_club.primary_color}
											size={22}
										/>
										<span class="bracket-name">{match.away_club.short_name}</span>
										{#if awayIsWinner}<span class="bracket-pin">▶</span>{/if}
										<span class="bracket-score">{match.away_legs_won}</span>
									</div>

									<!-- Status footer -->
									{#if match.status === 'in_progress'}
										<a
											href="/tournaments/{tournamentId}/matches/{match.id}/view"
											class="bracket-foot bracket-foot--live"
										>
											<span class="bracket-live-dot"></span>
											Live
										</a>
									{:else if match.status === 'scheduled'}
										<a
											href="/tournaments/{tournamentId}/matches/{match.id}/play"
											class="bracket-foot bracket-foot--scheduled"
										>Spielen</a>
									{:else if match.status === 'completed'}
										<div class="bracket-foot bracket-foot--done">Beendet</div>
									{/if}
								{:else}
									<!-- TBD -->
									<div class="bracket-row bracket-row--tbd">
										<span class="bracket-name">TBD</span>
									</div>
									<div class="bracket-vs">vs</div>
									<div class="bracket-row bracket-row--tbd">
										<span class="bracket-name">TBD</span>
									</div>
									<div class="bracket-foot bracket-foot--tbd">Wartet</div>
								{/if}
							</div>

							<!-- out-connector to next round -->
							{#if !isLastRound}
								<div class="bracket-conn-out"
									class:bracket-conn-out--winner={!!winnerId}
									class:bracket-conn-out--top={isOdd}
									class:bracket-conn-out--bot={!isOdd}
								></div>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		{/each}

		{#if finaleWinner}
			<div class="bracket-round bracket-round--trophy">
				<div class="bracket-round-title">Sieger</div>
				<div class="bracket-round-matches">
					<div class="bracket-cell">
						<div class="bracket-conn-in bracket-conn-in--winner"></div>
						<div class="bracket-trophy" data-testid="bracket-winner">
							<span class="bracket-trophy-icon">🏆</span>
							<ClubCrest
								club_id={finaleWinner.id}
								has_crest={finaleWinner.has_crest}
								crest_url={finaleWinner.crest_url}
								club_name={finaleWinner.name}
								primary_color={finaleWinner.primary_color}
								size={48}
							/>
							<span class="bracket-trophy-name">{finaleWinner.name}</span>
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
		padding: 0.5rem 0;
		min-width: max-content;
	}

	.bracket-round {
		display: flex;
		flex-direction: column;
		min-width: 220px;
	}

	.bracket-round--trophy {
		min-width: 200px;
	}

	.bracket-round-title {
		text-align: center;
		font-size: 0.75rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: oklch(var(--bc) / 0.55);
		padding-bottom: 0.75rem;
	}

	.bracket-round-matches {
		display: flex;
		flex-direction: column;
		flex: 1;
		justify-content: space-around;
		gap: 0.5rem;
	}

	.bracket-cell {
		display: flex;
		align-items: center;
		flex: 1;
	}

	/* Connector geometry — connectors are fixed width and stretch vertically */
	.bracket-conn-in,
	.bracket-conn-out {
		width: 18px;
		min-width: 18px;
		align-self: stretch;
		position: relative;
	}

	.bracket-conn-in::before {
		content: '';
		position: absolute;
		right: 0;
		top: 50%;
		width: 100%;
		height: 0;
		border-top: 2px solid oklch(var(--bc) / 0.2);
	}

	/* outgoing horizontal stub */
	.bracket-conn-out::before {
		content: '';
		position: absolute;
		left: 0;
		top: 50%;
		width: 100%;
		height: 0;
		border-top: 2px solid oklch(var(--bc) / 0.2);
	}

	/* outgoing vertical stub joins pair into next round */
	.bracket-conn-out--top::after,
	.bracket-conn-out--bot::after {
		content: '';
		position: absolute;
		right: 0;
		width: 0;
		border-right: 2px solid oklch(var(--bc) / 0.2);
	}

	.bracket-conn-out--top::after {
		top: 50%;
		bottom: -0.5rem;
	}

	.bracket-conn-out--bot::after {
		top: -0.5rem;
		bottom: 50%;
	}

	/* Winner-line accent: the connector leaving a completed match shines accent */
	.bracket-conn-out--winner::before,
	.bracket-conn-in--winner::before {
		border-top-color: oklch(var(--p) / 0.7);
		border-top-width: 2.5px;
	}

	.bracket-conn-out--winner::after {
		border-right-color: oklch(var(--p) / 0.7);
		border-right-width: 2.5px;
	}

	/* The match card — fixed size rectangle, same shape for TBD/scheduled/live/completed */
	.bracket-card {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		border: 1.5px solid oklch(var(--bc) / 0.12);
		border-radius: 0.625rem;
		background: oklch(var(--b1));
		padding: 0.5rem 0.625rem 0.375rem 0.625rem;
		min-width: 170px;
		min-height: 92px;
		position: relative;
		transition: box-shadow 120ms ease, border-color 120ms ease;
	}

	.bracket-card--tbd {
		border-style: dashed;
		opacity: 0.55;
	}

	.bracket-card--scheduled {
		border-color: oklch(var(--in) / 0.45);
	}

	.bracket-card--live {
		border-color: oklch(var(--su) / 0.65);
		box-shadow: 0 0 0 2px oklch(var(--su) / 0.18);
	}

	.bracket-card--completed {
		border-color: oklch(var(--p) / 0.4);
		background: linear-gradient(180deg, oklch(var(--b1)) 0%, oklch(var(--p) / 0.05) 100%);
	}

	.bracket-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.25rem 0.375rem;
		border-radius: 0.375rem;
		font-size: 0.85rem;
	}

	.bracket-row--winner {
		font-weight: 800;
		color: oklch(var(--pc));
		background: oklch(var(--p) / 0.85);
		box-shadow: inset 0 0 0 1px oklch(var(--p));
	}

	.bracket-row--loser {
		color: oklch(var(--bc) / 0.5);
	}

	.bracket-row--tbd {
		color: oklch(var(--bc) / 0.35);
		min-height: 1.875rem;
	}

	.bracket-name {
		flex: 1;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		letter-spacing: 0.02em;
	}

	.bracket-pin {
		font-size: 0.65rem;
		opacity: 0.85;
	}

	.bracket-score {
		font-variant-numeric: tabular-nums;
		min-width: 1.25rem;
		text-align: right;
		font-weight: 700;
		font-size: 0.95rem;
	}

	.bracket-vs {
		text-align: center;
		font-size: 0.6rem;
		font-weight: 600;
		letter-spacing: 0.15em;
		color: oklch(var(--bc) / 0.35);
		text-transform: uppercase;
	}

	.bracket-foot {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.375rem;
		text-align: center;
		font-size: 0.65rem;
		font-weight: 600;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		padding: 0.125rem 0;
		border-top: 1px dashed oklch(var(--bc) / 0.1);
		margin-top: 0.125rem;
		text-decoration: none;
	}

	.bracket-foot--live {
		color: oklch(var(--su));
	}

	.bracket-foot--scheduled {
		color: oklch(var(--in));
	}

	.bracket-foot--scheduled:hover {
		text-decoration: underline;
	}

	.bracket-foot--done {
		color: oklch(var(--p) / 0.7);
	}

	.bracket-foot--tbd {
		color: oklch(var(--bc) / 0.3);
	}

	.bracket-live-dot {
		width: 0.5rem;
		height: 0.5rem;
		border-radius: 9999px;
		background: oklch(var(--su));
		box-shadow: 0 0 0 0 oklch(var(--su) / 0.7);
		animation: bracket-pulse 1.5s infinite;
	}

	@keyframes bracket-pulse {
		0% {
			box-shadow: 0 0 0 0 oklch(var(--su) / 0.7);
		}
		70% {
			box-shadow: 0 0 0 6px oklch(var(--su) / 0);
		}
		100% {
			box-shadow: 0 0 0 0 oklch(var(--su) / 0);
		}
	}

	.bracket-trophy {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		padding: 1rem 0.75rem;
		border-radius: 0.75rem;
		background: linear-gradient(180deg, oklch(var(--p) / 0.18) 0%, oklch(var(--p) / 0.06) 100%);
		border: 1.5px solid oklch(var(--p) / 0.5);
		flex: 1;
	}

	.bracket-trophy-icon {
		font-size: 1.75rem;
		filter: drop-shadow(0 0 8px oklch(var(--p) / 0.4));
	}

	.bracket-trophy-name {
		font-weight: 700;
		font-size: 0.95rem;
		text-align: center;
		color: oklch(var(--bc));
	}
</style>
