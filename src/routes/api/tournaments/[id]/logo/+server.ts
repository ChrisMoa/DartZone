import type { RequestHandler } from './$types.js';
import { error } from '@sveltejs/kit';
import { tournamentRepo } from '$lib/server/db.js';

export const GET: RequestHandler = async ({ params }) => {
	const logo = await tournamentRepo.getLogoData(params.id);
	if (!logo) throw error(404, 'Kein Logo vorhanden');

	return new Response(logo.data, {
		headers: {
			'Content-Type': logo.mime,
			'Cache-Control': 'public, max-age=3600'
		}
	});
};
