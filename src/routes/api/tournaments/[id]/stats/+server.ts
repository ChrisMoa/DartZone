import type { RequestHandler } from './$types.js';
import { error, json } from '@sveltejs/kit';
import { tournamentRepo, tournamentStatsService } from '$lib/server/db.js';

export const GET: RequestHandler = async ({ params }) => {
	const tournament = await tournamentRepo.getById(params.id);
	if (!tournament) throw error(404, 'Turnier nicht gefunden');

	const stats = tournamentStatsService.getStats(
		params.id,
		tournament.track_players ? 'player' : 'team'
	);

	return json({ tournament, stats });
};
