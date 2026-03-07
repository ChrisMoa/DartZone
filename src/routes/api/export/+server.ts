import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { clubRepo, playerRepo, tournamentRepo, matchRepo, standingsService } from '$lib/server/db.js';

export const GET: RequestHandler = async ({ url }) => {
	const format = url.searchParams.get('format') ?? 'json';

	if (format === 'db') {
		return exportDatabase();
	}

	return exportJson();
};

async function exportJson() {
	const clubs = await clubRepo.getAll();
	const allPlayers: Record<string, Awaited<ReturnType<typeof playerRepo.getByClubId>>> = {};
	for (const club of clubs) {
		allPlayers[club.id] = await playerRepo.getByClubId(club.id);
	}

	const tournaments = await tournamentRepo.getAll();
	const tournamentData = [];
	for (const tournament of tournaments) {
		const matches = await matchRepo.getByTournamentId(tournament.id);
		const standings = await standingsService.getByTournamentId(tournament.id);
		const clubIds = await tournamentRepo.getClubIds(tournament.id);
		tournamentData.push({
			...tournament,
			club_ids: clubIds,
			matches,
			standings
		});
	}

	const exportData = {
		exported_at: new Date().toISOString(),
		version: '1.0',
		clubs: clubs.map((club) => ({
			...club,
			players: allPlayers[club.id] ?? []
		})),
		tournaments: tournamentData
	};

	return json(exportData, {
		headers: {
			'Content-Disposition': `attachment; filename="dartzone-export-${new Date().toISOString().slice(0, 10)}.json"`
		}
	});
}

async function exportDatabase() {
	const { readFileSync } = await import('fs');
	const { getDefaultDbPath } = await import('$lib/server/database.js');

	const dbPath = getDefaultDbPath();
	const buffer = readFileSync(dbPath);

	return new Response(buffer, {
		headers: {
			'Content-Type': 'application/octet-stream',
			'Content-Disposition': `attachment; filename="dartzone-${new Date().toISOString().slice(0, 10)}.db"`
		}
	});
}
