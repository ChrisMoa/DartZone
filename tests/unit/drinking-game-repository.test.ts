import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { SCHEMA_SQL } from '$lib/server/schema.js';
import { SqliteDrinkingGameRepository } from '$lib/server/sqlite-repository.js';

function createTestDb(): Database.Database {
	const db = new Database(':memory:');
	db.pragma('foreign_keys = ON');
	db.exec(SCHEMA_SQL);
	db.exec(`
		INSERT INTO clubs (id, name, short_name, primary_color, secondary_color, created_at, updated_at)
		VALUES ('club1', 'Dart Club Alpha', 'DCA', '#e11d48', '#ffffff', '2024-01-01', '2024-01-01');
		INSERT INTO clubs (id, name, short_name, primary_color, secondary_color, created_at, updated_at)
		VALUES ('club2', 'Dart Club Beta', 'DCB', '#0052cc', '#ffffff', '2024-01-01', '2024-01-01');
		INSERT INTO clubs (id, name, short_name, primary_color, secondary_color, created_at, updated_at)
		VALUES ('club3', 'Dart Club Gamma', 'DCG', '#059669', '#ffffff', '2024-01-01', '2024-01-01');
		INSERT INTO tournaments (id, name, game_mode, format, legs_per_set, sets_per_match, status)
		VALUES ('t1', 'Test Tournament', '501', 'round_robin', 3, 5, 'running');
		INSERT INTO tournament_clubs (tournament_id, club_id) VALUES ('t1', 'club1');
		INSERT INTO tournament_clubs (tournament_id, club_id) VALUES ('t1', 'club2');
		INSERT INTO tournament_clubs (tournament_id, club_id) VALUES ('t1', 'club3');
	`);
	return db;
}

describe('SqliteDrinkingGameRepository', () => {
	let db: Database.Database;
	let repo: SqliteDrinkingGameRepository;

	beforeEach(() => {
		db = createTestDb();
		repo = new SqliteDrinkingGameRepository(db);
	});

	describe('create', () => {
		it('creates a drinking game for a tournament', async () => {
			const game = await repo.create('t1');
			expect(game.tournament_id).toBe('t1');
			expect(game.status).toBe('running');
			expect(game.id).toBeTruthy();
		});

		it('initializes scores for all assigned clubs', async () => {
			const game = await repo.create('t1');
			const scores = await repo.getScores(game.id);
			expect(scores).toHaveLength(3);
			expect(scores.every((s) => s.drink_count === 0)).toBe(true);
		});

		it('sets correct club data on scores', async () => {
			const game = await repo.create('t1');
			const scores = await repo.getScores(game.id);
			const alpha = scores.find((s) => s.club_id === 'club1');
			expect(alpha).toBeDefined();
			expect(alpha!.club_name).toBe('Dart Club Alpha');
			expect(alpha!.short_name).toBe('DCA');
			expect(alpha!.primary_color).toBe('#e11d48');
		});
	});

	describe('getByTournament', () => {
		it('returns null when no drinking game exists', async () => {
			const result = await repo.getByTournament('t1');
			expect(result).toBeNull();
		});

		it('returns the drinking game for a tournament', async () => {
			await repo.create('t1');
			const result = await repo.getByTournament('t1');
			expect(result).not.toBeNull();
			expect(result!.tournament_id).toBe('t1');
			expect(result!.status).toBe('running');
		});
	});

	describe('incrementDrink', () => {
		it('increments the drink count for a club', async () => {
			const game = await repo.create('t1');
			await repo.incrementDrink(game.id, 'club1');
			await repo.incrementDrink(game.id, 'club1');
			await repo.incrementDrink(game.id, 'club2');

			const scores = await repo.getScores(game.id);
			const club1 = scores.find((s) => s.club_id === 'club1');
			const club2 = scores.find((s) => s.club_id === 'club2');
			const club3 = scores.find((s) => s.club_id === 'club3');

			expect(club1!.drink_count).toBe(2);
			expect(club2!.drink_count).toBe(1);
			expect(club3!.drink_count).toBe(0);
		});
	});

	describe('decrementDrink', () => {
		it('decrements the drink count for a club', async () => {
			const game = await repo.create('t1');
			await repo.incrementDrink(game.id, 'club1');
			await repo.incrementDrink(game.id, 'club1');
			await repo.decrementDrink(game.id, 'club1');

			const scores = await repo.getScores(game.id);
			const club1 = scores.find((s) => s.club_id === 'club1');
			expect(club1!.drink_count).toBe(1);
		});

		it('does not go below zero', async () => {
			const game = await repo.create('t1');
			await repo.decrementDrink(game.id, 'club1');

			const scores = await repo.getScores(game.id);
			const club1 = scores.find((s) => s.club_id === 'club1');
			expect(club1!.drink_count).toBe(0);
		});
	});

	describe('getScores', () => {
		it('returns scores sorted by drink_count descending', async () => {
			const game = await repo.create('t1');
			await repo.incrementDrink(game.id, 'club2');
			await repo.incrementDrink(game.id, 'club2');
			await repo.incrementDrink(game.id, 'club2');
			await repo.incrementDrink(game.id, 'club1');

			const scores = await repo.getScores(game.id);
			expect(scores[0].club_id).toBe('club2');
			expect(scores[0].drink_count).toBe(3);
			expect(scores[1].club_id).toBe('club1');
			expect(scores[1].drink_count).toBe(1);
			expect(scores[2].drink_count).toBe(0);
		});
	});

	describe('finish', () => {
		it('sets the game status to finished', async () => {
			const game = await repo.create('t1');
			await repo.finish(game.id);

			const result = await repo.getByTournament('t1');
			expect(result!.status).toBe('finished');
		});
	});
});
