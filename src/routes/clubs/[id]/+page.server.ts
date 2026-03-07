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
	},
	addPlayer: async ({ params, request }) => {
		const formData = await request.formData();
		const first_name = formData.get('first_name')?.toString().trim() ?? '';
		const last_name = formData.get('last_name')?.toString().trim() ?? '';
		const nickname = formData.get('nickname')?.toString().trim() || null;

		if (!first_name || !last_name) {
			return { error: 'Vor- und Nachname sind erforderlich' };
		}

		await playerRepo.create({
			club_id: params.id,
			first_name,
			last_name,
			nickname
		});
	},
	deletePlayer: async ({ request }) => {
		const formData = await request.formData();
		const playerId = formData.get('player_id')?.toString() ?? '';
		if (playerId) {
			await playerRepo.delete(playerId);
		}
	}
};
