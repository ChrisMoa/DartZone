import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { writeFileSync, copyFileSync, existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { getDefaultDbPath } from '$lib/server/database.js';

export const POST: RequestHandler = async ({ request }) => {
	const formData = await request.formData();
	const file = formData.get('file') as File | null;
	const format = formData.get('format') as string;

	if (!file) throw error(400, 'Keine Datei hochgeladen');

	if (format === 'db') {
		return await importDatabase(file);
	} else if (format === 'json') {
		return await importJson(file);
	}

	throw error(400, 'Unbekanntes Format');
};

async function importDatabase(file: File) {
	const buffer = Buffer.from(await file.arrayBuffer());

	// Validate it's a SQLite file (magic bytes: "SQLite format 3\0")
	const header = buffer.toString('ascii', 0, 16);
	if (!header.startsWith('SQLite format 3')) {
		throw error(400, 'Ungueltige SQLite-Datei');
	}

	const dbPath = getDefaultDbPath();
	const dir = dirname(dbPath);
	if (!existsSync(dir)) {
		mkdirSync(dir, { recursive: true });
	}

	// Create backup of current database
	if (existsSync(dbPath)) {
		const backupPath = `${dbPath}.backup-${Date.now()}`;
		copyFileSync(dbPath, backupPath);
	}

	// Write new database file
	writeFileSync(dbPath, buffer);

	return json({
		success: true,
		message: 'Datenbank wurde wiederhergestellt. Bitte Seite neu laden.'
	});
}

async function importJson(file: File) {
	const text = await file.text();
	let data: any;

	try {
		data = JSON.parse(text);
	} catch {
		throw error(400, 'Ungueltige JSON-Datei');
	}

	if (!data.clubs || !data.tournaments) {
		throw error(400, 'JSON-Datei hat kein gueltiges DartZone-Format');
	}

	// Dynamic import to avoid circular dependency issues
	const { getDatabase } = await import('$lib/server/database.js');
	const db = getDatabase();

	const now = new Date().toISOString();

	const importTransaction = db.transaction(() => {
		// Import clubs
		const insertClub = db.prepare(
			`INSERT OR IGNORE INTO clubs (id, name, short_name, crest_url, primary_color, secondary_color, contact_email, created_at, updated_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
		);
		for (const club of data.clubs) {
			insertClub.run(
				club.id,
				club.name,
				club.short_name,
				club.crest_url ?? null,
				club.primary_color ?? '#333333',
				club.secondary_color ?? '#ffffff',
				club.contact_email ?? null,
				club.created_at ?? now,
				club.updated_at ?? now
			);

			// Import players for this club
			if (club.players) {
				const insertPlayer = db.prepare(
					`INSERT OR IGNORE INTO players (id, club_id, first_name, last_name, nickname, created_at)
					 VALUES (?, ?, ?, ?, ?, ?)`
				);
				for (const player of club.players) {
					insertPlayer.run(
						player.id,
						player.club_id ?? club.id,
						player.first_name,
						player.last_name,
						player.nickname ?? null,
						player.created_at ?? now
					);
				}
			}
		}

		// Import tournaments
		const insertTournament = db.prepare(
			`INSERT OR IGNORE INTO tournaments (id, name, game_mode, format, legs_per_set, sets_per_match, start_date, end_date, is_active)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
		);
		const insertTournamentClub = db.prepare(
			`INSERT OR IGNORE INTO tournament_clubs (tournament_id, club_id) VALUES (?, ?)`
		);
		const insertMatch = db.prepare(
			`INSERT OR IGNORE INTO matches (id, tournament_id, home_club_id, away_club_id, round, scheduled_at, status, home_legs_won, away_legs_won, completed_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
		);

		for (const tournament of data.tournaments) {
			insertTournament.run(
				tournament.id,
				tournament.name,
				tournament.game_mode ?? '501',
				tournament.format ?? 'round_robin',
				tournament.legs_per_set ?? 3,
				tournament.sets_per_match ?? 5,
				tournament.start_date ?? null,
				tournament.end_date ?? null,
				tournament.is_active ? 1 : 0
			);

			// Assign clubs
			if (tournament.club_ids) {
				for (const clubId of tournament.club_ids) {
					insertTournamentClub.run(tournament.id, clubId);
				}
			}

			// Import matches
			if (tournament.matches) {
				for (const match of tournament.matches) {
					const homeClubId = match.home_club?.id ?? match.home_club_id;
					const awayClubId = match.away_club?.id ?? match.away_club_id;
					insertMatch.run(
						match.id,
						match.tournament_id ?? tournament.id,
						homeClubId,
						awayClubId,
						match.round ?? null,
						match.scheduled_at ?? null,
						match.status ?? 'scheduled',
						match.home_legs_won ?? 0,
						match.away_legs_won ?? 0,
						match.completed_at ?? null
					);
				}
			}
		}
	});

	importTransaction();

	return json({
		success: true,
		message: `Import erfolgreich: ${data.clubs.length} Vereine, ${data.tournaments.length} Turniere`
	});
}
