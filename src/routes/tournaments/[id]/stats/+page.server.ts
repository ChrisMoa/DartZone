import type { PageServerLoad } from './$types.js';
import { error } from '@sveltejs/kit';
import { tournamentRepo, tournamentStatsService } from '$lib/server/db.js';

export const load: PageServerLoad = async ({ params }) => {
	const tournament = await tournamentRepo.getById(params.id);
	if (!tournament) throw error(404, 'Turnier nicht gefunden');

	const stats = tournamentStatsService.getStats(
		params.id,
		tournament.track_players ? 'player' : 'team'
	);

	return { tournament, stats };
};
