import type { PageServerLoad, Actions } from './$types.js';
import { error, fail } from '@sveltejs/kit';
import { matchRepo, playerRepo, tournamentRepo, standingsService, throwRepo } from '$lib/server/db.js';

const ROUND_SEQUENCE = ['Runde 1', 'Achtelfinale', 'Viertelfinale', 'Halbfinale', 'Finale'];

function getNextRoundName(currentRound: string): string | null {
	const idx = ROUND_SEQUENCE.indexOf(currentRound);
	if (idx < 0 || idx >= ROUND_SEQUENCE.length - 1) return null;
	return ROUND_SEQUENCE[idx + 1];
}

async function advanceKnockoutRound(tournamentId: string, completedMatchRound: string | null) {
	if (!completedMatchRound) return;

	const tournament = await tournamentRepo.getById(tournamentId);
	if (!tournament || tournament.format !== 'knockout') return;
	if (completedMatchRound === 'Finale') return;

	const allMatches = await matchRepo.getByTournamentId(tournamentId);
	const roundMatches = allMatches.filter((m) => m.round === completedMatchRound);
	if (roundMatches.some((m) => m.status !== 'completed')) return;

	const nextRoundName = getNextRoundName(completedMatchRound);
	if (!nextRoundName) return;

	const existingNextRound = allMatches.filter((m) => m.round === nextRoundName);
	if (existingNextRound.length > 0) return;

	const winners = roundMatches.map((m) => {
		return m.home_legs_won > m.away_legs_won ? m.home_club : m.away_club;
	});

	if (winners.length < 2) return;

	const actualRoundName =
		winners.length <= 2
			? 'Finale'
			: winners.length <= 4
				? 'Halbfinale'
				: winners.length <= 8
					? 'Viertelfinale'
					: winners.length <= 16
						? 'Achtelfinale'
						: 'Runde 1';

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
	const tournament = await tournamentRepo.getById(params.id);
	if (!tournament) throw error(404, 'Turnier nicht gefunden');

	const allMatches = await matchRepo.getByTournamentId(params.id);

	// Get playable matches (scheduled or in_progress), limit to 4
	const playableMatches = allMatches
		.filter((m) => m.status !== 'completed')
		.slice(0, 4);

	// Load players for each match's clubs
	const matchesWithPlayers = await Promise.all(
		playableMatches.map(async (match) => {
			const [homePlayers, awayPlayers] = await Promise.all([
				playerRepo.getByClubId(match.home_club.id),
				playerRepo.getByClubId(match.away_club.id)
			]);
			return { match, homePlayers, awayPlayers };
		})
	);

	return {
		tournament,
		matchesWithPlayers
	};
};

export const actions: Actions = {
	startGame: async ({ request }) => {
		const formData = await request.formData();
		const matchId = formData.get('match_id') as string;
		if (!matchId) return fail(400, { error: 'Match ID required' });

		const match = await matchRepo.getById(matchId);
		if (!match) return fail(404, { error: 'Match not found' });

		if (match.status === 'in_progress') {
			return fail(409, { error: 'Spiel wird bereits gespielt' });
		}
		if (match.status === 'completed') {
			return fail(409, { error: 'Spiel ist bereits beendet' });
		}

		await matchRepo.update(matchId, { status: 'in_progress' });
		return { success: true, matchId };
	},

	refreshMatches: async ({ params }) => {
		const allMatches = await matchRepo.getByTournamentId(params.id);
		const playableMatches = allMatches
			.filter((m) => m.status !== 'completed')
			.slice(0, 4);

		const statuses = playableMatches.map((m) => ({
			id: m.id,
			status: m.status,
			home_legs_won: m.home_legs_won,
			away_legs_won: m.away_legs_won
		}));

		return { success: true, statuses };
	},

	completeLeg: async ({ request, params }) => {
		const formData = await request.formData();
		const matchId = formData.get('match_id') as string;
		const winnerSide = formData.get('winner_side') as 'home' | 'away';
		if (!matchId || !winnerSide) return fail(400, { error: 'Match ID and winner side required' });

		const throwsJson = formData.get('throws') as string | null;
		if (throwsJson) {
			try {
				const throws = JSON.parse(throwsJson);
				if (Array.isArray(throws) && throws.length > 0) {
					await throwRepo.saveBatch(throws);
				}
			} catch {
				console.error('Failed to parse/save throws data');
			}
		}

		const match = await matchRepo.getById(matchId);
		if (!match) return fail(404, { error: 'Match not found' });

		const update: {
			home_legs_won?: number;
			away_legs_won?: number;
			status?: 'in_progress' | 'completed';
			completed_at?: string;
		} = { status: 'in_progress' };

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

		await matchRepo.update(matchId, update);

		if (update.status === 'completed') {
			await standingsService.recalculate(params.id);
			const updatedMatch = await matchRepo.getById(matchId);
			await advanceKnockoutRound(params.id, updatedMatch?.round ?? null);
		}

		return { success: true, matchId, matchCompleted: update.status === 'completed' };
	},

	forfeitLeg: async ({ request, params }) => {
		const formData = await request.formData();
		const matchId = formData.get('match_id') as string;
		const forfeitSide = formData.get('forfeit_side') as 'home' | 'away';
		if (!matchId || !forfeitSide) return fail(400, { error: 'Match ID and forfeit side required' });

		const match = await matchRepo.getById(matchId);
		if (!match) return fail(404, { error: 'Match not found' });

		const winnerSide = forfeitSide === 'home' ? 'away' : 'home';
		const update: {
			home_legs_won?: number;
			away_legs_won?: number;
			status?: 'in_progress' | 'completed';
			completed_at?: string;
		} = { status: 'in_progress' };

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

		await matchRepo.update(matchId, update);

		if (update.status === 'completed') {
			await standingsService.recalculate(params.id);
			const updatedMatch = await matchRepo.getById(matchId);
			await advanceKnockoutRound(params.id, updatedMatch?.round ?? null);
		}

		return { success: true, matchId, matchCompleted: update.status === 'completed', winnerSide };
	},

	concedeMatch: async ({ request, params }) => {
		const formData = await request.formData();
		const matchId = formData.get('match_id') as string;
		const forfeitSide = formData.get('forfeit_side') as 'home' | 'away';
		if (!matchId || !forfeitSide) return fail(400, { error: 'Match ID and forfeit side required' });

		const match = await matchRepo.getById(matchId);
		if (!match) return fail(404, { error: 'Match not found' });

		const tournament = await tournamentRepo.getById(params.id);
		const legsToWin = tournament ? Math.ceil(tournament.sets_per_match / 2) : 3;

		const winnerSide = forfeitSide === 'home' ? 'away' : 'home';
		const update = {
			home_legs_won: winnerSide === 'home' ? legsToWin : match.home_legs_won,
			away_legs_won: winnerSide === 'away' ? legsToWin : match.away_legs_won,
			status: 'completed' as const,
			completed_at: new Date().toISOString()
		};

		await matchRepo.update(matchId, update);
		await standingsService.recalculate(params.id);
		const updatedMatch = await matchRepo.getById(matchId);
		await advanceKnockoutRound(params.id, updatedMatch?.round ?? null);

		return { success: true, matchId, matchCompleted: true };
	}
};
