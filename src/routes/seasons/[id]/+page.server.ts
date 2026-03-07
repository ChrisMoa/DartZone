import type { PageServerLoad, Actions } from './$types.js';
import { error, fail } from '@sveltejs/kit';
import { seasonRepo, clubRepo, matchRepo, standingsService } from '$lib/server/db.js';

export const load: PageServerLoad = async ({ params }) => {
	const season = await seasonRepo.getById(params.id);
	if (!season) throw error(404, 'Saison nicht gefunden');

	const [standings, matches, allClubs, assignedClubIds] = await Promise.all([
		standingsService.getBySeasonId(params.id),
		matchRepo.getBySeasonId(params.id),
		clubRepo.getAll(),
		seasonRepo.getClubIds(params.id)
	]);

	const availableClubs = allClubs.filter((c) => !assignedClubIds.includes(c.id));

	return { season, standings, matches, availableClubs, assignedClubIds };
};

export const actions: Actions = {
	assignClub: async ({ request, params }) => {
		const formData = await request.formData();
		const clubId = formData.get('club_id') as string;
		if (!clubId) return fail(400, { error: 'Club ID required' });

		await seasonRepo.assignClub(params.id, clubId);
		return { success: true };
	},

	removeClub: async ({ request, params }) => {
		const formData = await request.formData();
		const clubId = formData.get('club_id') as string;
		if (!clubId) return fail(400, { error: 'Club ID required' });

		await seasonRepo.removeClub(params.id, clubId);
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
			season_id: params.id,
			home_club: homeClub,
			away_club: awayClub,
			scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
			status: 'scheduled',
			home_legs_won: 0,
			away_legs_won: 0,
			completed_at: null
		});

		return { success: true };
	}
};
