import type { PageServerLoad } from './$types.js';
import { tournamentRepo } from '$lib/server/db.js';

export const load: PageServerLoad = async () => {
	const tournaments = await tournamentRepo.getAll();
	return { tournaments };
};
