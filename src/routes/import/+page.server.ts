import type { Actions } from './$types.js';
import { clubRepo, playerRepo } from '$lib/server/db.js';
import { importFromBuffer } from '$lib/server/excel-import.js';
import { fail } from '@sveltejs/kit';

export const actions: Actions = {
	upload: async ({ request }) => {
		const formData = await request.formData();
		const file = formData.get('file') as File | null;

		if (!file || file.size === 0) {
			return fail(400, { error: 'Keine Datei ausgewaehlt' });
		}

		if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
			return fail(400, { error: 'Nur Excel-Dateien (.xlsx, .xls) werden unterstuetzt' });
		}

		const buffer = await file.arrayBuffer();
		const result = await importFromBuffer(buffer, clubRepo, playerRepo);

		return {
			success: true,
			clubs_imported: result.clubs_imported,
			players_imported: result.players_imported,
			errors: result.errors
		};
	}
};
