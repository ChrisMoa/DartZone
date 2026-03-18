import Database from 'better-sqlite3';
import { existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { SCHEMA_SQL } from './schema.js';

let db: Database.Database | null = null;

export function getDatabase(dbPath?: string): Database.Database {
	if (db) return db;

	const path = dbPath ?? getDefaultDbPath();
	const dir = dirname(path);
	if (!existsSync(dir)) {
		mkdirSync(dir, { recursive: true });
	}

	db = new Database(path);
	db.pragma('journal_mode = WAL');
	db.pragma('foreign_keys = ON');
	db.exec(SCHEMA_SQL);
	runMigrations(db);

	return db;
}

export function getDefaultDbPath(): string {
	return process.env.DARTZONE_DB_PATH ?? 'data/dartzone.db';
}

/** Add columns that may not exist in older databases. */
function runMigrations(database: Database.Database): void {
	const cols = database.prepare("PRAGMA table_info('tournaments')").all() as Array<{ name: string }>;
	const colNames = new Set(cols.map((c) => c.name));

	const migrations: [string, string][] = [
		['organizer_name', 'ALTER TABLE tournaments ADD COLUMN organizer_name TEXT'],
		['organizer_logo', 'ALTER TABLE tournaments ADD COLUMN organizer_logo BLOB'],
		['organizer_logo_mime', 'ALTER TABLE tournaments ADD COLUMN organizer_logo_mime TEXT'],
		['organizer_contact', 'ALTER TABLE tournaments ADD COLUMN organizer_contact TEXT'],
		['organizer_note', 'ALTER TABLE tournaments ADD COLUMN organizer_note TEXT'],
		['status', 'ALTER TABLE tournaments ADD COLUMN status TEXT NOT NULL DEFAULT \'planned\'']
	];

	for (const [col, sql] of migrations) {
		if (!colNames.has(col)) {
			database.exec(sql);
		}
	}

	// Migrate is_active → status
	if (colNames.has('is_active') && colNames.has('status')) {
		database.exec(`UPDATE tournaments SET status = 'running' WHERE is_active = 1 AND status = 'planned'`);
	} else if (colNames.has('is_active') && !colNames.has('status')) {
		// status column was just added above — migrate values
		database.exec(`UPDATE tournaments SET status = 'running' WHERE is_active = 1`);
	}
}

export function closeDatabase(): void {
	if (db) {
		db.close();
		db = null;
	}
}

export function resetDatabase(dbPath?: string): Database.Database {
	closeDatabase();
	const path = dbPath ?? getDefaultDbPath();
	const dir = dirname(path);
	if (!existsSync(dir)) {
		mkdirSync(dir, { recursive: true });
	}

	db = new Database(path);
	db.pragma('journal_mode = WAL');
	db.pragma('foreign_keys = ON');

	// Drop all tables and recreate
	db.exec(`
		DROP TABLE IF EXISTS animation_assets;
		DROP TABLE IF EXISTS tournament_clubs;
		DROP TABLE IF EXISTS matches;
		DROP TABLE IF EXISTS players;
		DROP TABLE IF EXISTS tournaments;
		DROP TABLE IF EXISTS clubs;
	`);
	db.exec(SCHEMA_SQL);

	return db;
}
