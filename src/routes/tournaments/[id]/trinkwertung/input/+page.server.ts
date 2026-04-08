import type { PageServerLoad, Actions } from './$types.js';
import { error, fail } from '@sveltejs/kit';
import { tournamentRepo, drinkingGameRepo } from '$lib/server/db.js';

export const load: PageServerLoad = async ({ params }) => {
	const tournament = await tournamentRepo.getById(params.id);
	if (!tournament) throw error(404, 'Turnier nicht gefunden');

	const drinkingGame = await drinkingGameRepo.getByTournament(params.id);
	if (!drinkingGame) throw error(404, 'Keine Trinkwertung gefunden');

	const scores = await drinkingGameRepo.getScores(drinkingGame.id);

	return { tournament, drinkingGame, scores };
};

export const actions: Actions = {
	increment: async ({ request, params }) => {
		const formData = await request.formData();
		const clubId = formData.get('club_id') as string;
		if (!clubId) return fail(400, { error: 'Club ID required' });

		const game = await drinkingGameRepo.getByTournament(params.id);
		if (!game) return fail(404, { error: 'Keine Trinkwertung gefunden' });
		if (game.status !== 'running') return fail(400, { error: 'Trinkwertung ist beendet' });

		await drinkingGameRepo.incrementDrink(game.id, clubId);
		return { success: true };
	},

	decrement: async ({ request, params }) => {
		const formData = await request.formData();
		const clubId = formData.get('club_id') as string;
		if (!clubId) return fail(400, { error: 'Club ID required' });

		const game = await drinkingGameRepo.getByTournament(params.id);
		if (!game) return fail(404, { error: 'Keine Trinkwertung gefunden' });
		if (game.status !== 'running') return fail(400, { error: 'Trinkwertung ist beendet' });

		await drinkingGameRepo.decrementDrink(game.id, clubId);
		return { success: true };
	}
};
