import type { PageServerLoad } from './$types.js';
import { seasonRepo, matchRepo, standingsService } from '$lib/server/db.js';

export const load: PageServerLoad = async () => {
	const activeSeason = await seasonRepo.getActive();
	if (!activeSeason) return { activeSeason: null, standings: [], recentMatches: [] };

	const [standings, matches] = await Promise.all([
		standingsService.getBySeasonId(activeSeason.id),
		matchRepo.getBySeasonId(activeSeason.id)
	]);

	const recentMatches = matches
		.filter((m) => m.status === 'completed')
		.sort((a, b) => (b.completed_at ?? '').localeCompare(a.completed_at ?? ''))
		.slice(0, 3);

	return { activeSeason, standings, recentMatches };
};
