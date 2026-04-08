import type { RequestHandler } from './$types.js';
import { error, json } from '@sveltejs/kit';
import { drinkingGameRepo } from '$lib/server/db.js';

export const GET: RequestHandler = async ({ params }) => {
	const game = await drinkingGameRepo.getByTournament(params.id);
	if (!game) throw error(404, 'Keine Trinkwertung gefunden');

	const scores = await drinkingGameRepo.getScores(game.id);
	return json({ game, scores });
};

export const POST: RequestHandler = async ({ params, request }) => {
	const game = await drinkingGameRepo.getByTournament(params.id);
	if (!game) throw error(404, 'Keine Trinkwertung gefunden');
	if (game.status !== 'running') throw error(400, 'Trinkwertung ist beendet');

	const body = await request.json();
	const { clubId, amount } = body as { clubId: string; amount: number };

	if (!clubId || typeof amount !== 'number' || amount === 0) {
		throw error(400, 'clubId und amount erforderlich');
	}

	await drinkingGameRepo.addDrinks(game.id, clubId, amount);

	const scores = await drinkingGameRepo.getScores(game.id);
	return json({ game, scores });
};
