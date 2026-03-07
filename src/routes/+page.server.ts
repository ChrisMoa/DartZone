import type { PageServerLoad } from './$types.js';
import { tournamentRepo, matchRepo, standingsService } from '$lib/server/db.js';

export const load: PageServerLoad = async () => {
	const activeTournament = await tournamentRepo.getActive();
	if (!activeTournament) return { activeTournament: null, standings: [], recentMatches: [] };

	const [standings, matches] = await Promise.all([
		standingsService.getByTournamentId(activeTournament.id),
		matchRepo.getByTournamentId(activeTournament.id)
	]);

	const recentMatches = matches
		.filter((m) => m.status === 'completed')
		.sort((a, b) => (b.completed_at ?? '').localeCompare(a.completed_at ?? ''))
		.slice(0, 3);

	return { activeTournament, standings, recentMatches };
};
