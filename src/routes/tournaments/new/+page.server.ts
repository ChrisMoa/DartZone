import type { Actions } from './$types.js';
import { fail, redirect } from '@sveltejs/kit';
import { tournamentSchema } from '$lib/utils/validation.js';
import { tournamentRepo } from '$lib/server/db.js';

export const actions: Actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const raw = {
			name: formData.get('name') as string,
			game_mode: formData.get('game_mode') as string,
			format: formData.get('format') as string,
			legs_per_set: Number(formData.get('legs_per_set')),
			sets_per_match: Number(formData.get('sets_per_match')),
			start_date: (formData.get('start_date') as string) || null,
			end_date: (formData.get('end_date') as string) || null,
			status: (formData.get('status') as string) || 'planned',
			organizer_name: (formData.get('organizer_name') as string) || null,
			organizer_contact: (formData.get('organizer_contact') as string) || null,
			organizer_note: (formData.get('organizer_note') as string) || null
		};

		const result = tournamentSchema.safeParse(raw);
		if (!result.success) {
			const errors: Record<string, string> = {};
			for (const issue of result.error.issues) {
				const key = issue.path[0]?.toString();
				if (key) errors[key] = issue.message;
			}
			return fail(400, { errors, values: raw });
		}

		const tournament = await tournamentRepo.create({
			...result.data,
			organizer_name: raw.organizer_name,
			organizer_contact: raw.organizer_contact,
			organizer_note: raw.organizer_note
		});

		// Handle logo upload
		const logoFile = formData.get('organizer_logo') as File | null;
		if (logoFile && logoFile.size > 0) {
			const buffer = Buffer.from(await logoFile.arrayBuffer());
			await tournamentRepo.setLogoData(tournament.id, buffer, logoFile.type);
		}

		throw redirect(303, `/tournaments/${tournament.id}`);
	}
};
