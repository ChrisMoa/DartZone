import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { SCHEMA_SQL } from '$lib/server/schema.js';
import { SqliteAnimationAssetRepository } from '$lib/server/sqlite-repository.js';

function createTestDb(): Database.Database {
	const db = new Database(':memory:');
	db.pragma('foreign_keys = ON');
	db.exec(SCHEMA_SQL);
	return db;
}

describe('SqliteAnimationAssetRepository', () => {
	let db: Database.Database;
	let repo: SqliteAnimationAssetRepository;

	beforeEach(() => {
		db = createTestDb();
		repo = new SqliteAnimationAssetRepository(db);
	});

	it('returns empty list when no assets exist', async () => {
		const assets = await repo.getAll();
		expect(assets).toEqual([]);
	});

	it('returns null for non-existent event', async () => {
		const asset = await repo.getByEvent('bullseye');
		expect(asset).toBeNull();
	});

	it('returns null data for non-existent event', async () => {
		const data = await repo.getData('bullseye');
		expect(data).toBeNull();
	});

	it('upserts a new animation asset', async () => {
		const buffer = Buffer.from('test-gif-data');
		const asset = await repo.upsert('bullseye', buffer, 'image/gif', 2000, 'center');

		expect(asset.event).toBe('bullseye');
		expect(asset.mime).toBe('image/gif');
		expect(asset.duration_ms).toBe(2000);
		expect(asset.position).toBe('center');
		expect(asset.created_at).toBeTruthy();
	});

	it('retrieves asset metadata after upsert', async () => {
		const buffer = Buffer.from('test-gif-data');
		await repo.upsert('bullseye', buffer, 'image/gif', 3000, 'top');

		const asset = await repo.getByEvent('bullseye');
		expect(asset).not.toBeNull();
		expect(asset!.event).toBe('bullseye');
		expect(asset!.mime).toBe('image/gif');
		expect(asset!.duration_ms).toBe(3000);
		expect(asset!.position).toBe('top');
	});

	it('retrieves asset binary data', async () => {
		const buffer = Buffer.from('test-gif-binary');
		await repo.upsert('triple_twenty', buffer, 'image/webp', 2000, 'center');

		const data = await repo.getData('triple_twenty');
		expect(data).not.toBeNull();
		expect(data!.mime).toBe('image/webp');
		expect(Buffer.from(data!.data).toString()).toBe('test-gif-binary');
	});

	it('updates existing asset on upsert (same event key)', async () => {
		const buffer1 = Buffer.from('original');
		await repo.upsert('checkout', buffer1, 'image/gif', 2000, 'center');

		const buffer2 = Buffer.from('updated');
		await repo.upsert('checkout', buffer2, 'video/mp4', 4000, 'bottom');

		const asset = await repo.getByEvent('checkout');
		expect(asset!.mime).toBe('video/mp4');
		expect(asset!.duration_ms).toBe(4000);
		expect(asset!.position).toBe('bottom');

		const data = await repo.getData('checkout');
		expect(Buffer.from(data!.data).toString()).toBe('updated');
	});

	it('lists all assets', async () => {
		await repo.upsert('bullseye', Buffer.from('a'), 'image/gif', 2000, 'center');
		await repo.upsert('one_eighty', Buffer.from('b'), 'video/webm', 3000, 'top');

		const assets = await repo.getAll();
		expect(assets).toHaveLength(2);
		const events = assets.map((a) => a.event);
		expect(events).toContain('bullseye');
		expect(events).toContain('one_eighty');
	});

	it('deletes an existing asset', async () => {
		await repo.upsert('bullseye', Buffer.from('data'), 'image/gif', 2000, 'center');

		const deleted = await repo.delete('bullseye');
		expect(deleted).toBe(true);

		const asset = await repo.getByEvent('bullseye');
		expect(asset).toBeNull();
	});

	it('returns false when deleting non-existent asset', async () => {
		const deleted = await repo.delete('bullseye');
		expect(deleted).toBe(false);
	});

	it('does not include BLOB data in getAll or getByEvent', async () => {
		await repo.upsert('bullseye', Buffer.from('large-data'), 'image/gif', 2000, 'center');

		const assets = await repo.getAll();
		expect(assets[0]).not.toHaveProperty('data');

		const asset = await repo.getByEvent('bullseye');
		expect(asset).not.toHaveProperty('data');
	});
});
