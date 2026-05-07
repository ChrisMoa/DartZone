import type { RequestHandler } from './$types.js';
import { json } from '@sveltejs/kit';
import { tournamentRepo } from '$lib/server/db.js';

export const GET: RequestHandler = async () => {
	const tournaments = await tournamentRepo.getAll();
	return json(
		tournaments.map((t) => ({
			id: t.id,
			name: t.name,
			game_mode: t.game_mode,
			format: t.format,
			status: t.status,
			legs_per_set: t.legs_per_set,
			sets_per_match: t.sets_per_match,
			start_date: t.start_date
		}))
	);
};
