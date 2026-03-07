import type { RequestHandler } from './$types.js';
import { error } from '@sveltejs/kit';
import { clubRepo } from '$lib/server/db.js';

export const GET: RequestHandler = async ({ params }) => {
	const crest = await clubRepo.getCrestData(params.id);
	if (!crest) throw error(404, 'Kein Wappen vorhanden');

	return new Response(crest.data, {
		headers: {
			'Content-Type': crest.mime,
			'Cache-Control': 'public, max-age=3600'
		}
	});
};
