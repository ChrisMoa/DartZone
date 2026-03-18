import type { RequestHandler } from './$types.js';
import { json, error } from '@sveltejs/kit';
import { playerRepo, throwRepo } from '$lib/server/db.js';
import {
	calcAverage,
	countCheckoutAttempts,
	countCheckoutSuccesses,
	calcCheckoutPercentage,
	calcHighestTurnScore,
	count180s,
	countTonPlus,
	buildSectorCounts
} from '$lib/utils/statistics.js';
import type { PlayerOverallStats } from '$lib/utils/statistics.js';

export const GET: RequestHandler = async ({ params }) => {
	const player = await playerRepo.getById(params.id);
	if (!player) throw error(404, 'Spieler nicht gefunden');

	const throws = await throwRepo.getByPlayer(params.id);

	if (throws.length === 0) {
		const empty: PlayerOverallStats = {
			player_id: player.id,
			player_name: `${player.first_name} ${player.last_name}`,
			matches_played: 0,
			total_darts: 0,
			overall_average: 0,
			best_average: 0,
			highest_score: 0,
			total_180s: 0,
			total_ton_plus: 0,
			checkout_percentage: 0,
			total_checkout_attempts: 0,
			total_checkout_successes: 0,
			sector_counts: {}
		};
		return json(empty);
	}

	// Group throws by match for per-match averages
	const matchMap = new Map<string, typeof throws>();
	for (const t of throws) {
		const key = t.game_id;
		const arr = matchMap.get(key) ?? [];
		arr.push(t);
		matchMap.set(key, arr);
	}

	const matchAverages: number[] = [];
	const matchHighests: number[] = [];
	for (const matchThrows of matchMap.values()) {
		matchAverages.push(calcAverage(matchThrows));
		matchHighests.push(calcHighestTurnScore(matchThrows));
	}

	const checkoutAttempts = countCheckoutAttempts(throws);
	const checkoutSuccesses = countCheckoutSuccesses(throws);

	const stats: PlayerOverallStats = {
		player_id: player.id,
		player_name: `${player.first_name} ${player.last_name}`,
		matches_played: matchMap.size,
		total_darts: throws.length,
		overall_average: calcAverage(throws),
		best_average: Math.max(...matchAverages, 0),
		highest_score: Math.max(...matchHighests, 0),
		total_180s: count180s(throws),
		total_ton_plus: countTonPlus(throws),
		checkout_percentage: calcCheckoutPercentage(checkoutAttempts, checkoutSuccesses),
		total_checkout_attempts: checkoutAttempts,
		total_checkout_successes: checkoutSuccesses,
		sector_counts: buildSectorCounts(throws)
	};

	return json(stats);
};
