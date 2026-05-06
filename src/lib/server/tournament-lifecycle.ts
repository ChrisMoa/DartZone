import type { TournamentRepository, MatchRepository } from './repository.js';
import type { Tournament } from '$lib/types/league.js';

/**
 * If a running tournament has at least one match and all matches are completed,
 * flip its status to 'finished'. Returns the (possibly-updated) tournament.
 */
export async function autoFinalizeIfDone(
	tournament: Tournament,
	tournamentRepo: TournamentRepository,
	matchRepo: MatchRepository
): Promise<Tournament> {
	if (tournament.status !== 'running') return tournament;
	const matches = await matchRepo.getByTournamentId(tournament.id);
	if (matches.length === 0) return tournament;
	if (matches.some((m) => m.status !== 'completed')) return tournament;

	const updated = await tournamentRepo.updateStatus(tournament.id, 'finished');
	return updated ?? { ...tournament, status: 'finished' };
}
