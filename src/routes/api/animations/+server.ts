import type { RequestHandler } from './$types.js';
import { json } from '@sveltejs/kit';
import { animationAssetRepo } from '$lib/server/db.js';

export const GET: RequestHandler = async () => {
	const assets = await animationAssetRepo.getAll();
	return json(assets);
};
