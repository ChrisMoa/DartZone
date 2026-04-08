import type { RequestHandler } from './$types.js';
import { error, json } from '@sveltejs/kit';
import { tournamentRepo, matchRepo, standingsService, drinkingGameRepo } from '$lib/server/db.js';

export const GET: RequestHandler = async ({ params }) => {
	const tournament = await tournamentRepo.getById(params.id);
	if (!tournament) throw error(404, 'Turnier nicht gefunden');

	const [standings, matches, drinkingGame] = await Promise.all([
		standingsService.getByTournamentId(params.id),
		matchRepo.getByTournamentId(params.id),
		drinkingGameRepo.getByTournament(params.id)
	]);

	return json({ tournament, standings, matches, drinkingGame });
};
