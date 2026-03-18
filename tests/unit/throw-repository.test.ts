import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { SCHEMA_SQL } from '$lib/server/schema.js';
import { SqliteThrowRepository } from '$lib/server/sqlite-repository.js';
import type { DartThrow } from '$lib/types/game.js';

function createTestDb(): Database.Database {
	const db = new Database(':memory:');
	db.pragma('foreign_keys = ON');
	// Need clubs, players, matches tables for FK constraints
	db.exec(SCHEMA_SQL);
	// Insert test data for FK references
	db.exec(`
		INSERT INTO clubs (id, name, short_name, primary_color, secondary_color, created_at, updated_at)
		VALUES ('club1', 'Test Club', 'TC', '#000', '#fff', '2024-01-01', '2024-01-01');
		INSERT INTO players (id, club_id, first_name, last_name, created_at)
		VALUES ('player1', 'club1', 'Max', 'Mustermann', '2024-01-01');
		INSERT INTO players (id, club_id, first_name, last_name, created_at)
		VALUES ('player2', 'club1', 'Anna', 'Schmidt', '2024-01-01');
		INSERT INTO tournaments (id, name, game_mode, format, legs_per_set, sets_per_match, status)
		VALUES ('t1', 'Test Tournament', '501', 'round_robin', 3, 5, 'running');
		INSERT INTO matches (id, tournament_id, home_club_id, away_club_id, status)
		VALUES ('match1', 't1', 'club1', 'club1', 'in_progress');
		INSERT INTO matches (id, tournament_id, home_club_id, away_club_id, status)
		VALUES ('match2', 't1', 'club1', 'club1', 'in_progress');
	`);
	return db;
}

function makeThrow(overrides: Partial<DartThrow> & { leg_number?: number } = {}): DartThrow & { leg_number: number } {
	return {
		id: crypto.randomUUID(),
		game_id: 'match1',
		player_id: 'player1',
		turn_number: 1,
		dart_number: 1 as 1 | 2 | 3,
		sector: 20,
		multiplier: 1,
		score: 20,
		remaining_score: 481,
		is_bust: false,
		thrown_at: '2024-01-01T12:00:00Z',
		leg_number: 1,
		...overrides
	} as DartThrow & { leg_number: number };
}

describe('SqliteThrowRepository', () => {
	let db: Database.Database;
	let repo: SqliteThrowRepository;

	beforeEach(() => {
		db = createTestDb();
		repo = new SqliteThrowRepository(db);
	});

	it('returns empty array when no throws exist', async () => {
		const throws = await repo.getByMatch('match1');
		expect(throws).toEqual([]);
	});

	it('saves a batch of throws', async () => {
		const throws = [
			makeThrow({ dart_number: 1, score: 20, remaining_score: 481 }),
			makeThrow({ dart_number: 2, score: 60, remaining_score: 421, sector: 20, multiplier: 3 }),
			makeThrow({ dart_number: 3, score: 20, remaining_score: 401 })
		];

		await repo.saveBatch(throws);

		const saved = await repo.getByMatch('match1');
		expect(saved).toHaveLength(3);
		expect(saved[0].score).toBe(20);
		expect(saved[1].score).toBe(60);
		expect(saved[2].score).toBe(20);
	});

	it('retrieves throws by player', async () => {
		const throws = [
			makeThrow({ player_id: 'player1', score: 20 }),
			makeThrow({ player_id: 'player2', score: 40 }),
			makeThrow({ player_id: 'player1', dart_number: 2, score: 60 })
		];

		await repo.saveBatch(throws);

		const player1Throws = await repo.getByPlayer('player1');
		expect(player1Throws).toHaveLength(2);

		const player2Throws = await repo.getByPlayer('player2');
		expect(player2Throws).toHaveLength(1);
	});

	it('retrieves throws by match and leg', async () => {
		const throws = [
			makeThrow({ leg_number: 1, score: 20 }),
			makeThrow({ leg_number: 1, dart_number: 2, score: 40 }),
			makeThrow({ leg_number: 2, score: 60 })
		];

		await repo.saveBatch(throws);

		const leg1 = await repo.getByMatchAndLeg('match1', 1);
		expect(leg1).toHaveLength(2);

		const leg2 = await repo.getByMatchAndLeg('match1', 2);
		expect(leg2).toHaveLength(1);
	});

	it('correctly maps is_bust boolean', async () => {
		const throws = [
			makeThrow({ is_bust: true, score: 0, remaining_score: 2 }),
			makeThrow({ dart_number: 2, is_bust: false, score: 20, remaining_score: 481 })
		];

		await repo.saveBatch(throws);

		const saved = await repo.getByMatch('match1');
		expect(saved[0].is_bust).toBe(true);
		expect(saved[1].is_bust).toBe(false);
	});

	it('saves throws across different matches', async () => {
		const throws = [
			makeThrow({ game_id: 'match1', score: 20 }),
			makeThrow({ game_id: 'match2', score: 40 })
		];

		await repo.saveBatch(throws);

		const match1Throws = await repo.getByMatch('match1');
		expect(match1Throws).toHaveLength(1);

		const match2Throws = await repo.getByMatch('match2');
		expect(match2Throws).toHaveLength(1);
	});

	it('handles empty batch gracefully', async () => {
		await repo.saveBatch([]);
		const throws = await repo.getByMatch('match1');
		expect(throws).toEqual([]);
	});

	it('returns throws ordered by turn and dart number', async () => {
		const throws = [
			makeThrow({ turn_number: 2, dart_number: 1, score: 60 }),
			makeThrow({ turn_number: 1, dart_number: 3, score: 20 }),
			makeThrow({ turn_number: 1, dart_number: 1, score: 40 }),
			makeThrow({ turn_number: 1, dart_number: 2, score: 18 })
		];

		await repo.saveBatch(throws);

		const saved = await repo.getByMatch('match1');
		expect(saved.map((t) => t.score)).toEqual([40, 18, 20, 60]);
	});

	it('preserves sector and multiplier values', async () => {
		const throws = [
			makeThrow({ sector: 25, multiplier: 2, score: 50 }),
			makeThrow({ dart_number: 2, sector: 20, multiplier: 3, score: 60 }),
			makeThrow({ dart_number: 3, sector: 0, multiplier: 0, score: 0 })
		];

		await repo.saveBatch(throws);

		const saved = await repo.getByMatch('match1');
		expect(saved[0].sector).toBe(25);
		expect(saved[0].multiplier).toBe(2);
		expect(saved[1].sector).toBe(20);
		expect(saved[1].multiplier).toBe(3);
		expect(saved[2].sector).toBe(0);
		expect(saved[2].multiplier).toBe(0);
	});
});
