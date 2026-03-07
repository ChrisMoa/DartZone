import type { PageServerLoad, Actions } from './$types.js';
import { error, fail, redirect } from '@sveltejs/kit';
import { clubSchema } from '$lib/utils/validation.js';
import { clubRepo } from '$lib/server/db.js';

export const load: PageServerLoad = async ({ params }) => {
	const club = await clubRepo.getById(params.id);
	if (!club) throw error(404, 'Verein nicht gefunden');
	return { club };
};

export const actions: Actions = {
	default: async ({ request, params }) => {
		const formData = await request.formData();
		const raw = {
			name: formData.get('name') as string,
			short_name: formData.get('short_name') as string,
			primary_color: (formData.get('primary_color') as string) || '#1a5276',
			secondary_color: (formData.get('secondary_color') as string) || '#ffffff',
			contact_email: (formData.get('contact_email') as string) || null,
			crest_url: null
		};

		const result = clubSchema.safeParse(raw);
		if (!result.success) {
			const errors: Record<string, string> = {};
			for (const issue of result.error.issues) {
				const key = issue.path[0]?.toString();
				if (key) errors[key] = issue.message;
			}
			return fail(400, { errors, values: raw });
		}

		const updated = await clubRepo.update(params.id, result.data);
		if (!updated) throw error(404, 'Verein nicht gefunden');

		const crestFile = formData.get('crest') as File | null;
		if (crestFile && crestFile.size > 0) {
			const buffer = Buffer.from(await crestFile.arrayBuffer());
			await clubRepo.setCrestData(params.id, buffer, crestFile.type);
		}

		throw redirect(303, `/clubs/${params.id}`);
	}
};
