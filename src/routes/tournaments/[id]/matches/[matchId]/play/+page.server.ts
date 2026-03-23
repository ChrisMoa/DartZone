import type { PageServerLoad, Actions } from './$types.js';
import { error, fail } from '@sveltejs/kit';
import { matchRepo, playerRepo, tournamentRepo, standingsService, throwRepo } from '$lib/server/db.js';

const ROUND_SEQUENCE = ['Runde 1', 'Achtelfinale', 'Viertelfinale', 'Halbfinale', 'Finale'];

function getNextRoundName(currentRound: string): string | null {
	const idx = ROUND_SEQUENCE.indexOf(currentRound);
	if (idx < 0 || idx >= ROUND_SEQUENCE.length - 1) return null;
	return ROUND_SEQUENCE[idx + 1];
}

/**
 * After a knockout match completes, check if all matches in the same round are done.
 * If so, generate next-round matches by pairing consecutive winners.
 */
async function advanceKnockoutRound(tournamentId: string, completedMatchRound: string | null) {
	if (!completedMatchRound) return;

	const tournament = await tournamentRepo.getById(tournamentId);
	if (!tournament || tournament.format !== 'knockout') return;

	// Already at the finale — nothing to advance
	if (completedMatchRound === 'Finale') return;

	const allMatches = await matchRepo.getByTournamentId(tournamentId);
	const roundMatches = allMatches.filter((m) => m.round === completedMatchRound);

	// Check if ALL matches in this round are completed
	if (roundMatches.some((m) => m.status !== 'completed')) return;

	// Check if next-round matches already exist
	const nextRoundName = getNextRoundName(completedMatchRound);
	if (!nextRoundName) return;

	const existingNextRound = allMatches.filter((m) => m.round === nextRoundName);
	if (existingNextRound.length > 0) return;

	// Collect winners in order
	const winners = roundMatches.map((m) => {
		return m.home_legs_won > m.away_legs_won ? m.home_club : m.away_club;
	});

	if (winners.length < 2) return;

	// Determine correct round name based on remaining teams
	const actualRoundName = winners.length <= 2
		? 'Finale'
		: winners.length <= 4
			? 'Halbfinale'
			: winners.length <= 8
				? 'Viertelfinale'
				: winners.length <= 16
					? 'Achtelfinale'
					: 'Runde 1';

	// Pair consecutive winners
	for (let i = 0; i < winners.length - 1; i += 2) {
		await matchRepo.create({
			tournament_id: tournamentId,
			home_club: winners[i],
			away_club: winners[i + 1],
			round: actualRoundName,
			scheduled_at: null,
			status: 'scheduled',
			home_legs_won: 0,
			away_legs_won: 0,
			completed_at: null
		});
	}
}

export const load: PageServerLoad = async ({ params }) => {
	const match = await matchRepo.getById(params.matchId);
	if (!match) throw error(404, 'Spiel nicht gefunden');

	const tournament = await tournamentRepo.getById(params.id);
	if (!tournament) throw error(404, 'Turnier nicht gefunden');

	const [homePlayers, awayPlayers] = await Promise.all([
		playerRepo.getByClubId(match.home_club.id),
		playerRepo.getByClubId(match.away_club.id)
	]);

	return {
		match,
		tournament,
		homePlayers,
		awayPlayers
	};
};

export const actions: Actions = {
	startGame: async ({ params }) => {
		const match = await matchRepo.getById(params.matchId);
		if (!match) return fail(404, { error: 'Match not found' });

		if (match.status === 'in_progress') {
			return fail(409, { error: 'Match is already in progress' });
		}
		if (match.status === 'completed') {
			return fail(409, { error: 'Match is already completed' });
		}

		await matchRepo.update(params.matchId, { status: 'in_progress' });
		return { success: true };
	},

	completeLeg: async ({ request, params }) => {
		const formData = await request.formData();
		const winnerSide = formData.get('winner_side') as 'home' | 'away';
		if (!winnerSide) return fail(400, { error: 'Winner side required' });

		// Persist dart throws if provided
		const throwsJson = formData.get('throws') as string | null;
		if (throwsJson) {
			try {
				const throws = JSON.parse(throwsJson);
				if (Array.isArray(throws) && throws.length > 0) {
					await throwRepo.saveBatch(throws);
				}
			} catch {
				// Non-critical: log but don't fail the leg completion
				console.error('Failed to parse/save throws data');
			}
		}

		const match = await matchRepo.getById(params.matchId);
		if (!match) return fail(404, { error: 'Match not found' });

		const update: { home_legs_won?: number; away_legs_won?: number; status?: 'in_progress' | 'completed'; completed_at?: string } = {
			status: 'in_progress'
		};

		if (winnerSide === 'home') {
			update.home_legs_won = match.home_legs_won + 1;
		} else {
			update.away_legs_won = match.away_legs_won + 1;
		}

		const tournament = await tournamentRepo.getById(params.id);
		const legsToWin = tournament ? Math.ceil(tournament.sets_per_match / 2) : 3;

		const newHomeLegs = update.home_legs_won ?? match.home_legs_won;
		const newAwayLegs = update.away_legs_won ?? match.away_legs_won;

		if (newHomeLegs >= legsToWin || newAwayLegs >= legsToWin) {
			update.status = 'completed';
			update.completed_at = new Date().toISOString();
		}

		await matchRepo.update(params.matchId, update);

		if (update.status === 'completed') {
			await standingsService.recalculate(params.id);
			const updatedMatch = await matchRepo.getById(params.matchId);
			await advanceKnockoutRound(params.id, updatedMatch?.round ?? null);
		}

		return { success: true, matchCompleted: update.status === 'completed' };
	},

	forfeitLeg: async ({ request, params }) => {
		const formData = await request.formData();
		const forfeitSide = formData.get('forfeit_side') as 'home' | 'away';
		if (!forfeitSide) return fail(400, { error: 'Forfeit side required' });

		const match = await matchRepo.getById(params.matchId);
		if (!match) return fail(404, { error: 'Match not found' });

		// Award leg to opponent
		const winnerSide = forfeitSide === 'home' ? 'away' : 'home';
		const update: { home_legs_won?: number; away_legs_won?: number; status?: 'in_progress' | 'completed'; completed_at?: string } = {
			status: 'in_progress'
		};

		if (winnerSide === 'home') {
			update.home_legs_won = match.home_legs_won + 1;
		} else {
			update.away_legs_won = match.away_legs_won + 1;
		}

		const tournament = await tournamentRepo.getById(params.id);
		const legsToWin = tournament ? Math.ceil(tournament.sets_per_match / 2) : 3;
		const newHomeLegs = update.home_legs_won ?? match.home_legs_won;
		const newAwayLegs = update.away_legs_won ?? match.away_legs_won;

		if (newHomeLegs >= legsToWin || newAwayLegs >= legsToWin) {
			update.status = 'completed';
			update.completed_at = new Date().toISOString();
		}

		await matchRepo.update(params.matchId, update);

		if (update.status === 'completed') {
			await standingsService.recalculate(params.id);
			const updatedMatch = await matchRepo.getById(params.matchId);
			await advanceKnockoutRound(params.id, updatedMatch?.round ?? null);
		}

		return { success: true, matchCompleted: update.status === 'completed', winnerSide };
	},

	concedeMatch: async ({ request, params }) => {
		const formData = await request.formData();
		const forfeitSide = formData.get('forfeit_side') as 'home' | 'away';
		if (!forfeitSide) return fail(400, { error: 'Forfeit side required' });

		const match = await matchRepo.getById(params.matchId);
		if (!match) return fail(404, { error: 'Match not found' });

		const tournament = await tournamentRepo.getById(params.id);
		const legsToWin = tournament ? Math.ceil(tournament.sets_per_match / 2) : 3;

		// Award all remaining legs to opponent
		const winnerSide = forfeitSide === 'home' ? 'away' : 'home';
		const update: { home_legs_won: number; away_legs_won: number; status: 'completed'; completed_at: string } = {
			home_legs_won: winnerSide === 'home' ? legsToWin : match.home_legs_won,
			away_legs_won: winnerSide === 'away' ? legsToWin : match.away_legs_won,
			status: 'completed',
			completed_at: new Date().toISOString()
		};

		await matchRepo.update(params.matchId, update);
		await standingsService.recalculate(params.id);
		const updatedMatch = await matchRepo.getById(params.matchId);
		await advanceKnockoutRound(params.id, updatedMatch?.round ?? null);

		return { success: true, matchCompleted: true };
	}
};
