import type { PageServerLoad } from './$types.js';
import { seasonRepo } from '$lib/server/db.js';

export const load: PageServerLoad = async () => {
	const seasons = await seasonRepo.getAll();
	return { seasons };
};
