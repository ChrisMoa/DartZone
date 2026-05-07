import type { RequestHandler } from './$types.js';
import { error, json } from '@sveltejs/kit';
import { randomUUID } from 'crypto';
import { tournamentRepo } from '$lib/server/db.js';
import { getDatabase } from '$lib/server/database.js';

const ROUND_ORDER = ['Runde 1', 'Achtelfinale', 'Viertelfinale', 'Halbfinale', 'Finale'];

interface MatchRow {
	id: string;
	home_club_id: string;
	away_club_id: string;
	round: string | null;
	scheduled_at: string | null;
}

/**
 * POST /api/tournaments/[id]/clone
 *
 * Creates a fresh copy of the tournament:
 * - Same metadata (name + " (Kopie)" suffix), status='planned'
 * - Same assigned clubs (tournament_clubs)
 * - Only the *first* round of matches copied, status='scheduled', legs=0
 *   (later rounds will auto-generate as the bracket plays out)
 * Body (optional): { name?: string }
 */
export const POST: RequestHandler = async ({ params, request }) => {
	const original = await tournamentRepo.getById(params.id);
	if (!original) throw error(404, 'Turnier nicht gefunden');

	let newName = `${original.name} (Kopie)`;
	try {
		const body = (await request.json().catch(() => ({}))) as { name?: unknown };
		if (typeof body.name === 'string' && body.name.trim()) newName = body.name.trim();
	} catch {
		/* ignore */
	}

	const db = getDatabase();

	const result = db.transaction(() => {
		const newId = randomUUID();

		// Copy tournament row (status='running' so the bracket is immediately playable;
		// matches start as 'scheduled' below)
		db.prepare(
			`INSERT INTO tournaments (id, name, game_mode, format, legs_per_set, sets_per_match,
				start_date, end_date, status, organizer_name, organizer_logo, organizer_logo_mime,
				organizer_contact, organizer_note, track_players)
			 SELECT ?, ?, game_mode, format, legs_per_set, sets_per_match,
				start_date, end_date, 'running', organizer_name, organizer_logo, organizer_logo_mime,
				organizer_contact, organizer_note, track_players
			 FROM tournaments WHERE id = ?`
		).run(newId, newName, params.id);

		// Copy tournament_clubs
		db.prepare(
			`INSERT INTO tournament_clubs (tournament_id, club_id)
			 SELECT ?, club_id FROM tournament_clubs WHERE tournament_id = ?`
		).run(newId, params.id);

		// Determine first round (lowest in ROUND_ORDER that exists in the original)
		const presentRounds = (
			db
				.prepare('SELECT DISTINCT round FROM matches WHERE tournament_id = ?')
				.all(params.id) as Array<{ round: string | null }>
		)
			.map((r) => r.round)
			.filter((r): r is string => r !== null);
		const present = new Set(presentRounds);
		let firstRound: string | null = null;
		for (const r of ROUND_ORDER) {
			if (present.has(r)) {
				firstRound = r;
				break;
			}
		}
		if (!firstRound && presentRounds.length > 0) firstRound = presentRounds[0];

		// Copy first-round matches with new IDs and reset state
		const insertMatch = db.prepare(
			`INSERT INTO matches (id, tournament_id, home_club_id, away_club_id, round,
				scheduled_at, status, home_legs_won, away_legs_won, completed_at)
			 VALUES (?, ?, ?, ?, ?, ?, 'scheduled', 0, 0, NULL)`
		);

		const matchesToCopy = (
			firstRound
				? (db
						.prepare(
							'SELECT id, home_club_id, away_club_id, round, scheduled_at FROM matches WHERE tournament_id = ? AND round = ?'
						)
						.all(params.id, firstRound) as MatchRow[])
				: []
		) as MatchRow[];

		const matchIdMap: Record<string, string> = {};
		for (const m of matchesToCopy) {
			const newMid = randomUUID();
			matchIdMap[m.id] = newMid;
			insertMatch.run(newMid, newId, m.home_club_id, m.away_club_id, m.round, m.scheduled_at);
		}

		return { newId, firstRound, matchIdMap };
	})();

	const tournament = await tournamentRepo.getById(result.newId);
	return json({
		tournament,
		firstRound: result.firstRound,
		matchCount: Object.keys(result.matchIdMap).length,
		matchIdMap: result.matchIdMap
	});
};
