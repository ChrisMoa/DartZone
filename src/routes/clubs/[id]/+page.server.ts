import type { PageServerLoad, Actions } from './$types.js';
import { error, redirect } from '@sveltejs/kit';
import { clubRepo, playerRepo } from '$lib/server/db.js';

export const load: PageServerLoad = async ({ params }) => {
	const club = await clubRepo.getById(params.id);
	if (!club) throw error(404, 'Verein nicht gefunden');

	const players = await playerRepo.getByClubId(params.id);
	return { club, players };
};

export const actions: Actions = {
	delete: async ({ params }) => {
		const deleted = await clubRepo.delete(params.id);
		if (!deleted) throw error(404, 'Verein nicht gefunden');
		throw redirect(303, '/clubs');
	}
};
