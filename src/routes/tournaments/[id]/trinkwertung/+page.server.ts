import type { PageServerLoad, Actions } from './$types.js';
import { error, fail } from '@sveltejs/kit';
import { tournamentRepo, drinkingGameRepo } from '$lib/server/db.js';

export const load: PageServerLoad = async ({ params }) => {
	const tournament = await tournamentRepo.getById(params.id);
	if (!tournament) throw error(404, 'Turnier nicht gefunden');

	const drinkingGame = await drinkingGameRepo.getByTournament(params.id);
	const scores = drinkingGame ? await drinkingGameRepo.getScores(drinkingGame.id) : [];

	return { tournament, drinkingGame, scores };
};

export const actions: Actions = {
	create: async ({ params }) => {
		const existing = await drinkingGameRepo.getByTournament(params.id);
		if (existing) return fail(400, { error: 'Trinkwertung existiert bereits' });

		await drinkingGameRepo.create(params.id);
		return { success: true };
	},

	finish: async ({ params }) => {
		const game = await drinkingGameRepo.getByTournament(params.id);
		if (!game) return fail(404, { error: 'Keine Trinkwertung gefunden' });

		await drinkingGameRepo.finish(game.id);
		return { success: true };
	}
};
