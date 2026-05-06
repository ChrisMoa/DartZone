import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { SCHEMA_SQL } from '$lib/server/schema.js';
import {
	SqliteTournamentRepository,
	SqliteMatchRepository,
	SqliteClubRepository
} from '$lib/server/sqlite-repository.js';
import { autoFinalizeIfDone } from '$lib/server/tournament-lifecycle.js';

function setup() {
	const db = new Database(':memory:');
	db.pragma('foreign_keys = ON');
	db.exec(SCHEMA_SQL);
	db.exec(`
		INSERT INTO clubs (id, name, short_name, primary_color, secondary_color, created_at, updated_at)
		VALUES ('c1', 'A', 'A', '#000', '#fff', '', ''), ('c2', 'B', 'B', '#000', '#fff', '', '');
		INSERT INTO tournaments (id, name, game_mode, format, legs_per_set, sets_per_match, status)
		VALUES ('t1', 'T1', '501', 'knockout', 3, 5, 'running');
	`);
	const clubRepo = new SqliteClubRepository(db);
	const tournamentRepo = new SqliteTournamentRepository(db);
	const matchRepo = new SqliteMatchRepository(db, clubRepo);
	return { db, tournamentRepo, matchRepo };
}

describe('autoFinalizeIfDone', () => {
	let env: ReturnType<typeof setup>;
	beforeEach(() => {
		env = setup();
	});

	it('keeps running when no matches yet', async () => {
		const t = (await env.tournamentRepo.getById('t1'))!;
		const after = await autoFinalizeIfDone(t, env.tournamentRepo, env.matchRepo);
		expect(after.status).toBe('running');
	});

	it('keeps running when some matches still scheduled', async () => {
		env.db.exec(
			"INSERT INTO matches (id, tournament_id, home_club_id, away_club_id, status, home_legs_won, away_legs_won) VALUES ('m1', 't1', 'c1', 'c2', 'completed', 3, 1), ('m2', 't1', 'c2', 'c1', 'scheduled', 0, 0)"
		);
		const t = (await env.tournamentRepo.getById('t1'))!;
		const after = await autoFinalizeIfDone(t, env.tournamentRepo, env.matchRepo);
		expect(after.status).toBe('running');
	});

	it('flips to finished when every match is completed', async () => {
		env.db.exec(
			"INSERT INTO matches (id, tournament_id, home_club_id, away_club_id, status, home_legs_won, away_legs_won) VALUES ('m1', 't1', 'c1', 'c2', 'completed', 3, 1)"
		);
		const t = (await env.tournamentRepo.getById('t1'))!;
		const after = await autoFinalizeIfDone(t, env.tournamentRepo, env.matchRepo);
		expect(after.status).toBe('finished');
		const reloaded = (await env.tournamentRepo.getById('t1'))!;
		expect(reloaded.status).toBe('finished');
	});

	it('does not change a manually-aborted tournament', async () => {
		env.db.exec("UPDATE tournaments SET status = 'aborted' WHERE id = 't1'");
		env.db.exec(
			"INSERT INTO matches (id, tournament_id, home_club_id, away_club_id, status, home_legs_won, away_legs_won) VALUES ('m1', 't1', 'c1', 'c2', 'completed', 3, 1)"
		);
		const t = (await env.tournamentRepo.getById('t1'))!;
		const after = await autoFinalizeIfDone(t, env.tournamentRepo, env.matchRepo);
		expect(after.status).toBe('aborted');
	});
});
