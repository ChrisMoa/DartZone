import * as XLSX from 'xlsx';
import type { ClubRepository, PlayerRepository } from './repository.js';

export interface ClubImportRow {
	name: string;
	short_name: string;
	primary_color?: string;
	secondary_color?: string;
	contact_email?: string;
}

export interface PlayerImportRow {
	first_name: string;
	last_name: string;
	nickname?: string;
	club_short_name: string;
}

export interface ImportResult {
	clubs_imported: number;
	players_imported: number;
	errors: string[];
}

/**
 * Import clubs and players from an Excel file (.xlsx).
 *
 * Expected sheets:
 * - "Vereine" (Clubs): columns name, short_name, primary_color, secondary_color, contact_email
 * - "Spieler" (Players): columns first_name, last_name, nickname, club_short_name
 *
 * If a club with the same short_name already exists, it is skipped.
 * Players are linked to clubs via club_short_name.
 */
export async function importFromExcel(
	filePath: string,
	clubRepo: ClubRepository,
	playerRepo: PlayerRepository
): Promise<ImportResult> {
	const workbook = XLSX.readFile(filePath);
	const result: ImportResult = { clubs_imported: 0, players_imported: 0, errors: [] };

	// Import clubs
	const clubSheet = workbook.Sheets['Vereine'];
	if (clubSheet) {
		const rows = XLSX.utils.sheet_to_json<ClubImportRow>(clubSheet);
		const existingClubs = await clubRepo.getAll();
		const existingShortNames = new Set(existingClubs.map((c) => c.short_name.toLowerCase()));

		for (const row of rows) {
			if (!row.name || !row.short_name) {
				result.errors.push(`Verein uebersprungen: Name oder Kurzname fehlt`);
				continue;
			}
			if (existingShortNames.has(row.short_name.toLowerCase())) {
				result.errors.push(`Verein "${row.short_name}" existiert bereits, uebersprungen`);
				continue;
			}
			await clubRepo.create({
				name: row.name,
				short_name: row.short_name,
				crest_url: null,
				primary_color: row.primary_color ?? '#333333',
				secondary_color: row.secondary_color ?? '#ffffff',
				contact_email: row.contact_email ?? null
			});
			existingShortNames.add(row.short_name.toLowerCase());
			result.clubs_imported++;
		}
	}

	// Import players
	const playerSheet = workbook.Sheets['Spieler'];
	if (playerSheet) {
		const rows = XLSX.utils.sheet_to_json<PlayerImportRow>(playerSheet);
		const allClubs = await clubRepo.getAll();
		const clubByShortName = new Map(allClubs.map((c) => [c.short_name.toLowerCase(), c]));

		for (const row of rows) {
			if (!row.first_name || !row.last_name) {
				result.errors.push(`Spieler uebersprungen: Vor- oder Nachname fehlt`);
				continue;
			}
			const club = clubByShortName.get((row.club_short_name ?? '').toLowerCase());
			if (!club) {
				result.errors.push(
					`Spieler "${row.first_name} ${row.last_name}" uebersprungen: Verein "${row.club_short_name}" nicht gefunden`
				);
				continue;
			}
			await playerRepo.create({
				club_id: club.id,
				first_name: row.first_name,
				last_name: row.last_name,
				nickname: row.nickname ?? null
			});
			result.players_imported++;
		}
	}

	return result;
}

/**
 * Import from an ArrayBuffer (e.g. from file upload).
 */
export async function importFromBuffer(
	buffer: ArrayBuffer,
	clubRepo: ClubRepository,
	playerRepo: PlayerRepository
): Promise<ImportResult> {
	const workbook = XLSX.read(buffer, { type: 'array' });
	const result: ImportResult = { clubs_imported: 0, players_imported: 0, errors: [] };

	// Import clubs
	const clubSheet = workbook.Sheets['Vereine'];
	if (clubSheet) {
		const rows = XLSX.utils.sheet_to_json<ClubImportRow>(clubSheet);
		const existingClubs = await clubRepo.getAll();
		const existingShortNames = new Set(existingClubs.map((c) => c.short_name.toLowerCase()));

		for (const row of rows) {
			if (!row.name || !row.short_name) {
				result.errors.push(`Verein uebersprungen: Name oder Kurzname fehlt`);
				continue;
			}
			if (existingShortNames.has(row.short_name.toLowerCase())) {
				result.errors.push(`Verein "${row.short_name}" existiert bereits, uebersprungen`);
				continue;
			}
			await clubRepo.create({
				name: row.name,
				short_name: row.short_name,
				crest_url: null,
				primary_color: row.primary_color ?? '#333333',
				secondary_color: row.secondary_color ?? '#ffffff',
				contact_email: row.contact_email ?? null
			});
			existingShortNames.add(row.short_name.toLowerCase());
			result.clubs_imported++;
		}
	}

	// Import players
	const playerSheet = workbook.Sheets['Spieler'];
	if (playerSheet) {
		const rows = XLSX.utils.sheet_to_json<PlayerImportRow>(playerSheet);
		const allClubs = await clubRepo.getAll();
		const clubByShortName = new Map(allClubs.map((c) => [c.short_name.toLowerCase(), c]));

		for (const row of rows) {
			if (!row.first_name || !row.last_name) {
				result.errors.push(`Spieler uebersprungen: Vor- oder Nachname fehlt`);
				continue;
			}
			const club = clubByShortName.get((row.club_short_name ?? '').toLowerCase());
			if (!club) {
				result.errors.push(
					`Spieler "${row.first_name} ${row.last_name}" uebersprungen: Verein "${row.club_short_name}" nicht gefunden`
				);
				continue;
			}
			await playerRepo.create({
				club_id: club.id,
				first_name: row.first_name,
				last_name: row.last_name,
				nickname: row.nickname ?? null
			});
			result.players_imported++;
		}
	}

	return result;
}
