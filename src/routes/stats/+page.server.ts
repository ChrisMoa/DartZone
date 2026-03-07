import type { PageServerLoad } from './$types.js';
import { playerRepo, clubRepo } from '$lib/server/db.js';

export const load: PageServerLoad = async () => {
	const players = await playerRepo.getAll();
	const clubs = await clubRepo.getAll();

	const playersWithClub = players.map((player) => {
		const club = clubs.find((c) => c.id === player.club_id);
		return {
			...player,
			club_name: club?.name ?? 'Kein Verein',
			club_short_name: club?.short_name ?? '-'
		};
	});

	return { players: playersWithClub };
};
