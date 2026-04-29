import type { PageServerLoad } from './$types.js';
import { tournamentRepo, matchRepo, standingsService, clubRepo, playerRepo } from '$lib/server/db.js';

export const load: PageServerLoad = async () => {
	const [activeTournament, allTournaments, allClubs, allPlayers] = await Promise.all([
		tournamentRepo.getActive(),
		tournamentRepo.getAll(),
		clubRepo.getAll(),
		playerRepo.getAll()
	]);

	const stats = {
		tournaments: allTournaments.length,
		runningTournaments: allTournaments.filter((t) => t.status === 'running').length,
		clubs: allClubs.length,
		players: allPlayers.length
	};

	if (!activeTournament) {
		return {
			activeTournament: null,
			standings: [],
			recentMatches: [],
			stats,
			clubs: allClubs
		};
	}

	const [standings, matches] = await Promise.all([
		standingsService.getByTournamentId(activeTournament.id),
		matchRepo.getByTournamentId(activeTournament.id)
	]);

	const recentMatches = matches
		.filter((m) => m.status === 'completed')
		.sort((a, b) => (b.completed_at ?? '').localeCompare(a.completed_at ?? ''))
		.slice(0, 3);

	return { activeTournament, standings, recentMatches, stats, clubs: allClubs };
};
