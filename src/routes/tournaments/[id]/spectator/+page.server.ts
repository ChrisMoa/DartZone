import type { PageServerLoad } from './$types.js';
import { error } from '@sveltejs/kit';
import { tournamentRepo, matchRepo, playerRepo } from '$lib/server/db.js';

export const load: PageServerLoad = async ({ params }) => {
	const tournament = await tournamentRepo.getById(params.id);
	if (!tournament) throw error(404, 'Turnier nicht gefunden');

	const matches = await matchRepo.getByTournamentId(params.id);

	// Pre-load each club's roster once and key by club_id so tiles can
	// render the full team without extra round-trips.
	const clubIds = new Set<string>();
	for (const m of matches) {
		clubIds.add(m.home_club.id);
		clubIds.add(m.away_club.id);
	}
	const rosterEntries = await Promise.all(
		[...clubIds].map(async (cid) => [cid, await playerRepo.getByClubId(cid)] as const)
	);
	const rosters: Record<string, Awaited<ReturnType<typeof playerRepo.getByClubId>>> = {};
	for (const [cid, players] of rosterEntries) rosters[cid] = players;

	return { tournament, matches, rosters };
};
