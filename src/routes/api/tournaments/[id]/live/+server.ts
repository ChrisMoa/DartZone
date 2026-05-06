import type { RequestHandler } from './$types.js';
import { error, json } from '@sveltejs/kit';
import {
	tournamentRepo,
	matchRepo,
	standingsService,
	drinkingGameRepo
} from '$lib/server/db.js';
import { autoFinalizeIfDone } from '$lib/server/tournament-lifecycle.js';

export const GET: RequestHandler = async ({ params }) => {
	let tournament = await tournamentRepo.getById(params.id);
	if (!tournament) throw error(404, 'Turnier nicht gefunden');

	const [standings, matches, drinkingGame] = await Promise.all([
		standingsService.getByTournamentId(params.id),
		matchRepo.getByTournamentId(params.id),
		drinkingGameRepo.getByTournament(params.id)
	]);

	tournament = await autoFinalizeIfDone(tournament, tournamentRepo, matchRepo);

	return json({ tournament, standings, matches, drinkingGame });
};
