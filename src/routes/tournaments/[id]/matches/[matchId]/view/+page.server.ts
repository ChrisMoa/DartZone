import type { PageServerLoad } from './$types.js';
import { error } from '@sveltejs/kit';
import { matchRepo, tournamentRepo, playerRepo } from '$lib/server/db.js';

export const load: PageServerLoad = async ({ params }) => {
	const match = await matchRepo.getById(params.matchId);
	if (!match) throw error(404, 'Spiel nicht gefunden');

	const tournament = await tournamentRepo.getById(params.id);
	if (!tournament) throw error(404, 'Turnier nicht gefunden');

	const [homePlayers, awayPlayers] = await Promise.all([
		playerRepo.getByClubId(match.home_club.id),
		playerRepo.getByClubId(match.away_club.id)
	]);

	return { match, tournament, homePlayers, awayPlayers };
};
