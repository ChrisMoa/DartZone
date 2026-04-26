import type { RequestHandler } from './$types.js';
import { error, json } from '@sveltejs/kit';
import { matchRepo } from '$lib/server/db.js';
import { getLiveState, setLiveState, clearLiveState, type LiveMatchState } from '$lib/server/live-match-state.js';

export const GET: RequestHandler = async ({ params }) => {
	const match = await matchRepo.getById(params.matchId);
	if (!match) throw error(404, 'Spiel nicht gefunden');

	const liveState = getLiveState(params.matchId);

	return json({
		match: {
			id: match.id,
			status: match.status,
			home_legs_won: match.home_legs_won,
			away_legs_won: match.away_legs_won,
			home_club: match.home_club,
			away_club: match.away_club
		},
		live: liveState
	});
};

export const POST: RequestHandler = async ({ params, request }) => {
	const match = await matchRepo.getById(params.matchId);
	if (!match) throw error(404, 'Spiel nicht gefunden');

	const body = (await request.json()) as Partial<LiveMatchState> | { clear: true };

	if ('clear' in body && body.clear) {
		clearLiveState(params.matchId);
		return json({ success: true, cleared: true });
	}

	const required: (keyof LiveMatchState)[] = [
		'leg_number',
		'home_player_name',
		'away_player_name',
		'home_remaining',
		'away_remaining',
		'home_average',
		'away_average',
		'current_player_side',
		'current_dart',
		'current_turn_throws',
		'status',
		'game_mode'
	];

	for (const key of required) {
		if (!(key in body)) {
			return json({ error: `Missing field: ${key}` }, { status: 400 });
		}
	}

	setLiveState(params.matchId, {
		...(body as LiveMatchState),
		match_id: params.matchId,
		updated_at: Date.now()
	});

	return json({ success: true });
};
