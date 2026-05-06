import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { SCHEMA_SQL } from '$lib/server/schema.js';
import { SqliteTournamentStatsService } from '$lib/server/tournament-stats.js';

function setup(): { db: Database.Database; svc: SqliteTournamentStatsService } {
	const db = new Database(':memory:');
	db.pragma('foreign_keys = ON');
	db.exec(SCHEMA_SQL);
	db.exec(`
		INSERT INTO clubs (id, name, short_name, primary_color, secondary_color, created_at, updated_at)
		VALUES ('c1', 'Alpha', 'ALP', '#f00', '#fff', '', ''),
		       ('c2', 'Beta', 'BET', '#0f0', '#fff', '', '');
		INSERT INTO players (id, club_id, first_name, last_name, nickname, created_at) VALUES
			('p1', 'c1', 'Anna', 'A.', NULL, ''),
			('p2', 'c1', 'Ben', 'B.', NULL, ''),
			('p3', 'c2', 'Cora', 'C.', NULL, ''),
			('p4', 'c2', 'Dan', 'D.', 'Danger Dan', '');
		INSERT INTO tournaments (id, name, game_mode, format, legs_per_set, sets_per_match, status)
		VALUES ('t1', 'T1', '501', 'knockout', 3, 5, 'running');
		INSERT INTO matches (id, tournament_id, home_club_id, away_club_id, status, home_legs_won, away_legs_won)
		VALUES ('m1', 't1', 'c1', 'c2', 'completed', 3, 1);
	`);

	const svc = new SqliteTournamentStatsService(db);
	return { db, svc };
}

function insertTurn(
	db: Database.Database,
	matchId: string,
	playerId: string,
	leg: number,
	turn: number,
	throws: { sector: number; multiplier: number; score: number; remaining: number; bust?: boolean }[]
) {
	const stmt = db.prepare(
		`INSERT INTO dart_throws (id, match_id, leg_number, player_id, turn_number, dart_number, sector, multiplier, score, remaining_score, is_bust, thrown_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
	);
	for (let i = 0; i < throws.length; i++) {
		const t = throws[i];
		stmt.run(
			`${matchId}-${leg}-${turn}-${i}-${playerId}`,
			matchId, leg, playerId, turn, i + 1,
			t.sector, t.multiplier, t.score, t.remaining, t.bust ? 1 : 0
		);
	}
}

describe('SqliteTournamentStatsService', () => {
	let db: Database.Database;
	let svc: SqliteTournamentStatsService;

	beforeEach(() => {
		const fresh = setup();
		db = fresh.db;
		svc = fresh.svc;
	});

	it('returns empty entries when no throws exist', () => {
		const stats = svc.getStats('t1', 'player');
		expect(stats.entries).toEqual([]);
		expect(stats.mode).toBe('player');
	});

	it('aggregates per-player averages and 180s', () => {
		// p1 throws T20, T20, T20 in turn 1 = 180
		insertTurn(db, 'm1', 'p1', 1, 1, [
			{ sector: 20, multiplier: 3, score: 60, remaining: 441 },
			{ sector: 20, multiplier: 3, score: 60, remaining: 381 },
			{ sector: 20, multiplier: 3, score: 60, remaining: 321 }
		]);
		// p1 turn 2: 60+57+50 = 167 (ton+, not 180)
		insertTurn(db, 'm1', 'p1', 1, 2, [
			{ sector: 20, multiplier: 3, score: 60, remaining: 261 },
			{ sector: 19, multiplier: 3, score: 57, remaining: 204 },
			{ sector: 25, multiplier: 2, score: 50, remaining: 154 }
		]);
		// p3 turn 1: 20+20+20 = 60 (no ton+)
		insertTurn(db, 'm1', 'p3', 1, 1, [
			{ sector: 20, multiplier: 1, score: 20, remaining: 481 },
			{ sector: 20, multiplier: 1, score: 20, remaining: 461 },
			{ sector: 20, multiplier: 1, score: 20, remaining: 441 }
		]);

		const stats = svc.getStats('t1', 'player');
		expect(stats.entries).toHaveLength(2);

		const anna = stats.entries.find((e) => e.id === 'p1')!;
		expect(anna.name).toBe('Anna A.');
		expect(anna.one_eighties).toBe(1);
		expect(anna.ton_plus).toBe(2); // 180 + 167
		expect(anna.highest_turn).toBe(180);
		expect(anna.average).toBeCloseTo((180 + 167) / 6 * 3, 0);

		const cora = stats.entries.find((e) => e.id === 'p3')!;
		expect(cora.one_eighties).toBe(0);
		expect(cora.ton_plus).toBe(0);
		expect(cora.highest_turn).toBe(60);
	});

	it('uses nickname when present', () => {
		insertTurn(db, 'm1', 'p4', 1, 1, [
			{ sector: 20, multiplier: 1, score: 20, remaining: 481 },
			{ sector: 0, multiplier: 0, score: 0, remaining: 481 },
			{ sector: 0, multiplier: 0, score: 0, remaining: 481 }
		]);
		const stats = svc.getStats('t1', 'player');
		const dan = stats.entries.find((e) => e.id === 'p4');
		expect(dan?.name).toBe('Danger Dan');
	});

	it('aggregates per-club in team mode (sums teammates)', () => {
		insertTurn(db, 'm1', 'p1', 1, 1, [
			{ sector: 20, multiplier: 1, score: 20, remaining: 481 },
			{ sector: 20, multiplier: 1, score: 20, remaining: 461 },
			{ sector: 20, multiplier: 1, score: 20, remaining: 441 }
		]);
		insertTurn(db, 'm1', 'p2', 1, 2, [
			{ sector: 20, multiplier: 3, score: 60, remaining: 381 },
			{ sector: 20, multiplier: 3, score: 60, remaining: 321 },
			{ sector: 20, multiplier: 3, score: 60, remaining: 261 }
		]);

		const stats = svc.getStats('t1', 'team');
		expect(stats.mode).toBe('team');
		const alpha = stats.entries.find((e) => e.id === 'c1')!;
		expect(alpha).toBeDefined();
		expect(alpha.name).toBe('Alpha');
		expect(alpha.one_eighties).toBe(1);
		expect(alpha.total_darts).toBe(6);
	});

	it('records highest finish only on remaining=0 non-bust', () => {
		insertTurn(db, 'm1', 'p1', 1, 1, [
			{ sector: 20, multiplier: 3, score: 60, remaining: 100 },
			{ sector: 20, multiplier: 3, score: 60, remaining: 40 },
			{ sector: 20, multiplier: 2, score: 40, remaining: 0 }
		]);
		const stats = svc.getStats('t1', 'player');
		expect(stats.entries[0].highest_finish).toBe(40);
	});

	it('ignores busted throws in average and turn aggregation', () => {
		insertTurn(db, 'm1', 'p1', 1, 1, [
			{ sector: 20, multiplier: 3, score: 60, remaining: 441 },
			{ sector: 20, multiplier: 3, score: 60, remaining: 381 },
			{ sector: 20, multiplier: 1, score: 20, remaining: 381, bust: true }
		]);
		const stats = svc.getStats('t1', 'player');
		const anna = stats.entries[0];
		// Only 2 scoring darts × 3 = average of 6 for one valid turn, but turn was bust so 180-trip not counted
		expect(anna.one_eighties).toBe(0);
		expect(anna.ton_plus).toBe(0);
		expect(anna.average).toBeCloseTo((60 + 60) / 2 * 3, 0);
	});
});
