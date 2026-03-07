import type { PageServerLoad, Actions } from './$types.js';
import { error, fail } from '@sveltejs/kit';
import { matchRepo, playerRepo, seasonRepo, standingsService } from '$lib/server/db.js';

export const load: PageServerLoad = async ({ params }) => {
	const match = await matchRepo.getById(params.matchId);
	if (!match) throw error(404, 'Spiel nicht gefunden');

	const season = await seasonRepo.getById(params.id);
	if (!season) throw error(404, 'Saison nicht gefunden');

	const [homePlayers, awayPlayers] = await Promise.all([
		playerRepo.getByClubId(match.home_club.id),
		playerRepo.getByClubId(match.away_club.id)
	]);

	return {
		match,
		season,
		homePlayers,
		awayPlayers
	};
};

export const actions: Actions = {
	completeLeg: async ({ request, params }) => {
		const formData = await request.formData();
		const winnerSide = formData.get('winner_side') as 'home' | 'away';
		if (!winnerSide) return fail(400, { error: 'Winner side required' });

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

		// Check if match is complete based on season config
		const season = await seasonRepo.getById(params.id);
		const legsToWin = season ? Math.ceil(season.sets_per_match / 2) : 3;

		const newHomeLegs = update.home_legs_won ?? match.home_legs_won;
		const newAwayLegs = update.away_legs_won ?? match.away_legs_won;

		if (newHomeLegs >= legsToWin || newAwayLegs >= legsToWin) {
			update.status = 'completed';
			update.completed_at = new Date().toISOString();
		}

		await matchRepo.update(params.matchId, update);

		if (update.status === 'completed') {
			await standingsService.recalculate(params.id);
		}

		return { success: true, matchCompleted: update.status === 'completed' };
	}
};
