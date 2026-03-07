import type { PageServerLoad, Actions } from './$types.js';
import { error, fail } from '@sveltejs/kit';
import { tournamentRepo, clubRepo, matchRepo, standingsService } from '$lib/server/db.js';

export const load: PageServerLoad = async ({ params }) => {
	const tournament = await tournamentRepo.getById(params.id);
	if (!tournament) throw error(404, 'Turnier nicht gefunden');

	const [standings, matches, allClubs, assignedClubIds] = await Promise.all([
		standingsService.getByTournamentId(params.id),
		matchRepo.getByTournamentId(params.id),
		clubRepo.getAll(),
		tournamentRepo.getClubIds(params.id)
	]);

	const availableClubs = allClubs.filter((c) => !assignedClubIds.includes(c.id));

	return { tournament, standings, matches, availableClubs, assignedClubIds };
};

export const actions: Actions = {
	assignClub: async ({ request, params }) => {
		const formData = await request.formData();
		const clubId = formData.get('club_id') as string;
		if (!clubId) return fail(400, { error: 'Club ID required' });

		await tournamentRepo.assignClub(params.id, clubId);
		return { success: true };
	},

	removeClub: async ({ request, params }) => {
		const formData = await request.formData();
		const clubId = formData.get('club_id') as string;
		if (!clubId) return fail(400, { error: 'Club ID required' });

		await tournamentRepo.removeClub(params.id, clubId);
		return { success: true };
	},

	scheduleMatch: async ({ request, params }) => {
		const formData = await request.formData();
		const homeClubId = formData.get('home_club_id') as string;
		const awayClubId = formData.get('away_club_id') as string;
		const scheduledAt = (formData.get('scheduled_at') as string) || null;

		if (!homeClubId || !awayClubId) return fail(400, { error: 'Both clubs required' });
		if (homeClubId === awayClubId) return fail(400, { error: 'Clubs must be different' });

		const [homeClub, awayClub] = await Promise.all([
			clubRepo.getById(homeClubId),
			clubRepo.getById(awayClubId)
		]);

		if (!homeClub || !awayClub) return fail(400, { error: 'Club not found' });

		await matchRepo.create({
			tournament_id: params.id,
			home_club: homeClub,
			away_club: awayClub,
			round: null,
			scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
			status: 'scheduled',
			home_legs_won: 0,
			away_legs_won: 0,
			completed_at: null
		});

		return { success: true };
	},

	generatePairings: async ({ params }) => {
		const tournament = await tournamentRepo.getById(params.id);
		if (!tournament) return fail(404, { error: 'Turnier nicht gefunden' });

		const clubIds = await tournamentRepo.getClubIds(params.id);
		if (clubIds.length < 2) return fail(400, { error: 'Mindestens 2 Vereine erforderlich' });

		const existingMatches = await matchRepo.getByTournamentId(params.id);
		if (existingMatches.length > 0) return fail(400, { error: 'Es existieren bereits Spiele' });

		const clubs = await Promise.all(clubIds.map((id) => clubRepo.getById(id)));
		const validClubs = clubs.filter((c) => c !== null);

		if (tournament.format === 'round_robin') {
			for (let i = 0; i < validClubs.length; i++) {
				for (let j = i + 1; j < validClubs.length; j++) {
					await matchRepo.create({
						tournament_id: params.id,
						home_club: validClubs[i],
						away_club: validClubs[j],
						round: null,
						scheduled_at: null,
						status: 'scheduled',
						home_legs_won: 0,
						away_legs_won: 0,
						completed_at: null
					});
				}
			}
		} else {
			// Knockout: shuffle and pair up
			const shuffled = [...validClubs].sort(() => Math.random() - 0.5);
			const roundNames = getRoundName(shuffled.length);

			for (let i = 0; i < shuffled.length - 1; i += 2) {
				await matchRepo.create({
					tournament_id: params.id,
					home_club: shuffled[i],
					away_club: shuffled[i + 1],
					round: roundNames,
					scheduled_at: null,
					status: 'scheduled',
					home_legs_won: 0,
					away_legs_won: 0,
					completed_at: null
				});
			}
		}

		return { success: true };
	}
};

function getRoundName(teamCount: number): string {
	if (teamCount <= 2) return 'Finale';
	if (teamCount <= 4) return 'Halbfinale';
	if (teamCount <= 8) return 'Viertelfinale';
	if (teamCount <= 16) return 'Achtelfinale';
	return 'Runde 1';
}
