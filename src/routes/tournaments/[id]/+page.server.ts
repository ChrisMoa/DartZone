import type { PageServerLoad } from './$types.js';
import { error } from '@sveltejs/kit';
import { tournamentRepo, matchRepo, standingsService, drinkingGameRepo } from '$lib/server/db.js';

export const load: PageServerLoad = async ({ params }) => {
	const tournament = await tournamentRepo.getById(params.id);
	if (!tournament) throw error(404, 'Turnier nicht gefunden');

	const [standings, matches, drinkingGame] = await Promise.all([
		standingsService.getByTournamentId(params.id),
		matchRepo.getByTournamentId(params.id),
		drinkingGameRepo.getByTournament(params.id)
	]);

	return { tournament, standings, matches, drinkingGame };
};
