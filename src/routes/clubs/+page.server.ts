import type { PageServerLoad } from './$types.js';
import { clubRepo } from '$lib/server/db.js';

export const load: PageServerLoad = async ({ url }) => {
	const query = url.searchParams.get('q') ?? '';
	const clubs = query ? await clubRepo.search(query) : await clubRepo.getAll();
	return { clubs, query };
};
