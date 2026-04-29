#!/usr/bin/env node
/**
 * One-shot import of Mannschaften.xlsx (Tabelle2) into a fresh DartZone database.
 * - Each row in Tabelle2 = one team (club).
 * - Players are created using their Dartname (column "Dartname 1" / "Dartname 2"),
 *   not their real (Kandidat) name.
 * - Teams without any Dartname still get created as a club (no players).
 *
 * Usage:  node scripts/import-mannschaften.mjs
 */
import XLSX from 'xlsx';
import Database from 'better-sqlite3';
import { randomUUID } from 'node:crypto';
import { mkdirSync, existsSync, readFileSync } from 'node:fs';
import { dirname } from 'node:path';

const DB_PATH = process.env.DARTZONE_DB_PATH ?? 'data/dartzone.db';
const XLSX_PATH = 'Mannschaften.xlsx';
const SHEET = 'Tabelle2';

// Inline schema (copied from src/lib/server/schema.ts) — keep in sync if schema changes.
const SCHEMA_SQL = readFileSync('src/lib/server/schema.ts', 'utf8')
	.replace(/^[\s\S]*?export const SCHEMA_SQL\s*=\s*`/, '')
	.replace(/`;[\s\S]*$/, '');

// ─── Helpers ─────────────────────────────────────────────────────────

function shortName(name) {
	const cleaned = name
		.replace(/[^A-Za-zÄÖÜäöüß\s-]/g, '')
		.trim();
	const words = cleaned.split(/\s+/).filter(Boolean);
	if (words.length >= 2) {
		return words.map((w) => w[0].toUpperCase()).join('').slice(0, 4);
	}
	const word = (words[0] ?? cleaned).replace(/[äöüß]/gi, (c) => ({ ä: 'ae', ö: 'oe', ü: 'ue', ß: 'ss', Ä: 'AE', Ö: 'OE', Ü: 'UE' })[c] ?? c);
	return word.slice(0, 4).toUpperCase();
}

function splitDartname(dartname) {
	const cleaned = String(dartname).trim().replace(/\s+/g, ' ');
	if (!cleaned) return null;
	const parts = cleaned.split(' ');
	if (parts.length === 1) return { first_name: parts[0], last_name: '' };
	return { first_name: parts[0], last_name: parts.slice(1).join(' ') };
}

function uniqueShort(base, used) {
	let candidate = base || 'CLB';
	let n = 2;
	while (used.has(candidate)) {
		candidate = `${(base || 'CLB').slice(0, 3)}${n}`;
		n++;
	}
	used.add(candidate);
	return candidate;
}

// Predictable pastel-ish primary colors per team (so each card looks distinct).
const PALETTE = [
	'#0a3d2a', '#1d3557', '#9b2226', '#6b4226', '#5a189a', '#0d6e6e',
	'#b08968', '#3c096c', '#bc4749', '#386641', '#02394a', '#7f4f24',
	'#1b4332', '#283618', '#264653', '#6a040f', '#3a0ca3', '#43291f',
	'#2b2d42', '#403d39', '#0f4c5c', '#5f0f40', '#0b3954', '#2a9d8f'
];

// ─── Read Excel ──────────────────────────────────────────────────────

const wb = XLSX.readFile(XLSX_PATH);
const sheet = wb.Sheets[SHEET];
if (!sheet) {
	console.error(`Sheet "${SHEET}" not found. Available: ${wb.SheetNames.join(', ')}`);
	process.exit(1);
}
const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true });

// Header row is index 1; team rows start at index 2.
const teamRows = rows
	.slice(2)
	.filter((r) => Array.isArray(r) && r[1] && String(r[1]).trim().length > 0)
	.map((r) => ({
		number: r[0],
		team: String(r[1]).trim(),
		dartname1: r[4] ? String(r[4]).trim() : '',
		dartname2: r[7] ? String(r[7]).trim() : ''
	}));

console.log(`Found ${teamRows.length} teams in ${SHEET}.`);

// ─── Init DB ─────────────────────────────────────────────────────────

if (!existsSync(dirname(DB_PATH))) mkdirSync(dirname(DB_PATH), { recursive: true });
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.exec(SCHEMA_SQL);

const insertClub = db.prepare(
	`INSERT INTO clubs (id, name, short_name, crest_url, primary_color, secondary_color, contact_email, created_at, updated_at)
	 VALUES (@id, @name, @short_name, @crest_url, @primary_color, @secondary_color, @contact_email, @created_at, @updated_at)`
);
const insertPlayer = db.prepare(
	`INSERT INTO players (id, club_id, first_name, last_name, nickname, created_at)
	 VALUES (@id, @club_id, @first_name, @last_name, @nickname, @created_at)`
);

const now = new Date().toISOString();
const usedShortNames = new Set();
let clubCount = 0;
let playerCount = 0;

const importAll = db.transaction(() => {
	teamRows.forEach((row, idx) => {
		const club = {
			id: randomUUID(),
			name: row.team,
			short_name: uniqueShort(shortName(row.team), usedShortNames),
			crest_url: null,
			primary_color: PALETTE[idx % PALETTE.length],
			secondary_color: '#ffffff',
			contact_email: null,
			created_at: now,
			updated_at: now
		};
		insertClub.run(club);
		clubCount++;

		for (const dartname of [row.dartname1, row.dartname2]) {
			const split = splitDartname(dartname);
			if (!split) continue;
			insertPlayer.run({
				id: randomUUID(),
				club_id: club.id,
				first_name: split.first_name,
				last_name: split.last_name,
				nickname: dartname,
				created_at: now
			});
			playerCount++;
		}
	});
});

importAll();

console.log(`✓ Imported ${clubCount} clubs and ${playerCount} players into ${DB_PATH}`);

// ─── Sanity print ────────────────────────────────────────────────────

const clubs = db.prepare('SELECT short_name, name FROM clubs ORDER BY name').all();
console.log('\nClubs:');
for (const c of clubs) console.log(`  ${c.short_name.padEnd(5)}  ${c.name}`);

const players = db.prepare(`
	SELECT p.first_name, p.last_name, p.nickname, c.name AS club
	FROM players p LEFT JOIN clubs c ON c.id = p.club_id
	ORDER BY c.name, p.nickname
`).all();
console.log(`\nPlayers (${players.length}):`);
for (const p of players) {
	const dartname = [p.first_name, p.last_name].filter(Boolean).join(' ');
	console.log(`  ${dartname.padEnd(28)} → ${p.club}`);
}

db.close();
