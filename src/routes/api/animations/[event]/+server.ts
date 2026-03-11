import type { RequestHandler } from './$types.js';
import { error, json } from '@sveltejs/kit';
import { animationAssetRepo } from '$lib/server/db.js';

const VALID_EVENTS = ['bullseye', 'triple_twenty', 'one_eighty', 'checkout'];
const VALID_MIMES = [
	'image/gif',
	'image/webp',
	'video/mp4',
	'video/webm',
	'application/json'
];
const MAX_SIZE = 2 * 1024 * 1024; // 2 MB

export const GET: RequestHandler = async ({ params }) => {
	const { event } = params;
	if (!VALID_EVENTS.includes(event)) throw error(400, 'Ungueltiges Event');

	const asset = await animationAssetRepo.getData(event);
	if (!asset) throw error(404, 'Keine benutzerdefinierte Animation vorhanden');

	return new Response(asset.data, {
		headers: {
			'Content-Type': asset.mime,
			'Cache-Control': 'public, max-age=3600'
		}
	});
};

export const POST: RequestHandler = async ({ params, request }) => {
	const { event } = params;
	if (!VALID_EVENTS.includes(event)) throw error(400, 'Ungueltiges Event');

	const formData = await request.formData();
	const file = formData.get('file') as File | null;
	if (!file) throw error(400, 'Keine Datei hochgeladen');

	if (file.size > MAX_SIZE) throw error(400, 'Datei zu gross (max. 2 MB)');
	if (!VALID_MIMES.includes(file.type)) {
		throw error(400, 'Ungueltiges Dateiformat. Erlaubt: GIF, WebP, MP4, WebM, Lottie JSON');
	}

	const duration_ms = parseInt(formData.get('duration_ms') as string) || 2000;
	const position = (formData.get('position') as string) || 'center';

	if (duration_ms < 1000 || duration_ms > 5000) throw error(400, 'Dauer muss zwischen 1 und 5 Sekunden liegen');
	if (!['center', 'top', 'bottom'].includes(position)) throw error(400, 'Ungueltige Position');

	const buffer = Buffer.from(await file.arrayBuffer());
	const asset = await animationAssetRepo.upsert(event, buffer, file.type, duration_ms, position);

	return json(asset, { status: 201 });
};

export const DELETE: RequestHandler = async ({ params }) => {
	const { event } = params;
	if (!VALID_EVENTS.includes(event)) throw error(400, 'Ungueltiges Event');

	const deleted = await animationAssetRepo.delete(event);
	if (!deleted) throw error(404, 'Keine benutzerdefinierte Animation vorhanden');

	return json({ success: true });
};
