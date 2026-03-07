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

	return db;
}

export function getDefaultDbPath(): string {
	return process.env.DARTZONE_DB_PATH ?? 'data/dartzone.db';
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
		DROP TABLE IF EXISTS season_clubs;
		DROP TABLE IF EXISTS matches;
		DROP TABLE IF EXISTS players;
		DROP TABLE IF EXISTS seasons;
		DROP TABLE IF EXISTS clubs;
	`);
	db.exec(SCHEMA_SQL);

	return db;
}
