import type { Actions } from './$types.js';
import { fail, redirect } from '@sveltejs/kit';
import { seasonSchema } from '$lib/utils/validation.js';
import { seasonRepo } from '$lib/server/db.js';

export const actions: Actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const raw = {
			name: formData.get('name') as string,
			game_mode: formData.get('game_mode') as string,
			legs_per_set: Number(formData.get('legs_per_set')),
			sets_per_match: Number(formData.get('sets_per_match')),
			start_date: (formData.get('start_date') as string) || null,
			end_date: (formData.get('end_date') as string) || null,
			is_active: formData.get('is_active') === 'on'
		};

		const result = seasonSchema.safeParse(raw);
		if (!result.success) {
			const errors: Record<string, string> = {};
			for (const issue of result.error.issues) {
				const key = issue.path[0]?.toString();
				if (key) errors[key] = issue.message;
			}
			return fail(400, { errors, values: raw });
		}

		const season = await seasonRepo.create(result.data);
		throw redirect(303, `/seasons/${season.id}`);
	}
};
