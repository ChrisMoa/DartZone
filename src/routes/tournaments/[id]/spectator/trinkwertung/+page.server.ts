import type { PageServerLoad } from './$types.js';
import { error } from '@sveltejs/kit';
import { tournamentRepo, drinkingGameRepo } from '$lib/server/db.js';

export const load: PageServerLoad = async ({ params }) => {
	const tournament = await tournamentRepo.getById(params.id);
	if (!tournament) throw error(404, 'Turnier nicht gefunden');

	const drinkingGame = await drinkingGameRepo.getByTournament(params.id);
	const scores = drinkingGame ? await drinkingGameRepo.getScores(drinkingGame.id) : [];

	return { tournament, drinkingGame, scores };
};
