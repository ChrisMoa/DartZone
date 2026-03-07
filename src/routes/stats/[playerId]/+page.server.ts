import type { PageServerLoad } from './$types.js';
import { playerRepo, clubRepo } from '$lib/server/db.js';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params }) => {
	const player = await playerRepo.getById(params.playerId);
	if (!player) {
		throw error(404, 'Spieler nicht gefunden');
	}

	const club = player.club_id ? await clubRepo.getById(player.club_id) : null;

	return {
		player,
		club
	};
};
