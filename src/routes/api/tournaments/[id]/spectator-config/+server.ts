import type { RequestHandler } from './$types.js';
import { error, json } from '@sveltejs/kit';
import { spectatorConfigRepo, tournamentRepo } from '$lib/server/db.js';

export const GET: RequestHandler = async ({ params }) => {
	const tournament = await tournamentRepo.getById(params.id);
	if (!tournament) throw error(404, 'Turnier nicht gefunden');

	const config = spectatorConfigRepo.get(params.id);
	return json(config ?? { layout: '2x2', matchIds: [], updated_at: 0 });
};

export const PUT: RequestHandler = async ({ params, request }) => {
	const tournament = await tournamentRepo.getById(params.id);
	if (!tournament) throw error(404, 'Turnier nicht gefunden');

	let body: { layout?: unknown; matchIds?: unknown };
	try {
		body = await request.json();
	} catch {
		throw error(400, 'Invalid JSON');
	}

	const layout = typeof body.layout === 'string' ? body.layout : '2x2';
	const matchIds = Array.isArray(body.matchIds)
		? body.matchIds.filter((x): x is string => typeof x === 'string')
		: [];

	const saved = spectatorConfigRepo.set(params.id, layout, matchIds);
	return json(saved);
};
