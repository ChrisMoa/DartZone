import type { RequestHandler } from './$types.js';
import { json, error } from '@sveltejs/kit';
import { playerRepo } from '$lib/server/db.js';
import { getDatabase } from '$lib/server/database.js';

interface PlayerStats {
	average: number | null;
	checkoutPct: number | null;
	legsPlayed: number;
}

export const GET: RequestHandler = async ({ params }) => {
	const player = await playerRepo.getById(params.id);
	if (!player) throw error(404, 'Spieler nicht gefunden');

	// TODO: replace with real throw data once a dart_throws table is added to the schema
	// Currently the schema has no throws table, so we always return null/zero values.
	const db = getDatabase();
	const hasThrowsTable = db
		.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='dart_throws'")
		.get();

	if (!hasThrowsTable) {
		return json({ average: null, checkoutPct: null, legsPlayed: 0 } satisfies PlayerStats);
	}

	// Aggregate stats from last 5 legs this player participated in
	const rows = db
		.prepare(
			`SELECT
				SUM(score)     AS total_score,
				COUNT(*)       AS total_darts,
				SUM(is_bust=0 AND remaining_score=0 AND multiplier=2) AS checkouts,
				COUNT(DISTINCT turn_number || '-' || game_id) AS total_turns
			FROM dart_throws
			WHERE player_id = ?
			AND game_id IN (
				SELECT DISTINCT game_id FROM dart_throws WHERE player_id = ? ORDER BY thrown_at DESC LIMIT 5
			)`
		)
		.get(params.id, params.id) as {
		total_score: number | null;
		total_darts: number | null;
		checkouts: number | null;
		total_turns: number | null;
	};

	const legsRow = db
		.prepare(
			`SELECT COUNT(DISTINCT game_id) as legs FROM dart_throws WHERE player_id = ?`
		)
		.get(params.id) as { legs: number };

	const legsPlayed = legsRow?.legs ?? 0;

	if (!rows || !rows.total_darts || rows.total_darts === 0) {
		return json({ average: null, checkoutPct: null, legsPlayed } satisfies PlayerStats);
	}

	const average = ((rows.total_score ?? 0) / rows.total_darts) * 3;
	const checkoutPct =
		rows.total_turns && rows.total_turns > 0
			? ((rows.checkouts ?? 0) / rows.total_turns) * 100
			: null;

	return json({
		average: Math.round(average * 10) / 10,
		checkoutPct: checkoutPct !== null ? Math.round(checkoutPct) : null,
		legsPlayed
	} satisfies PlayerStats);
};
