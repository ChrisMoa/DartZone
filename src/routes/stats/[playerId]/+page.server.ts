import type { PageServerLoad } from './$types.js';
import { playerRepo, clubRepo, throwRepo } from '$lib/server/db.js';
import { error } from '@sveltejs/kit';
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

export const load: PageServerLoad = async ({ params }) => {
	const player = await playerRepo.getById(params.playerId);
	if (!player) {
		throw error(404, 'Spieler nicht gefunden');
	}

	const club = player.club_id ? await clubRepo.getById(player.club_id) : null;

	const throws = await throwRepo.getByPlayer(params.playerId);

	let stats: PlayerOverallStats;
	const matchAverages: { match_id: string; label: string; average: number }[] = [];

	if (throws.length === 0) {
		stats = {
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
	} else {
		// Group by match
		const matchMap = new Map<string, typeof throws>();
		for (const t of throws) {
			const key = t.game_id;
			const arr = matchMap.get(key) ?? [];
			arr.push(t);
			matchMap.set(key, arr);
		}

		const perMatchAvgs: number[] = [];
		const perMatchHighests: number[] = [];
		let matchIdx = 1;
		for (const [matchId, matchThrows] of matchMap.entries()) {
			const avg = calcAverage(matchThrows);
			perMatchAvgs.push(avg);
			perMatchHighests.push(calcHighestTurnScore(matchThrows));
			matchAverages.push({
				match_id: matchId,
				label: `Spiel ${matchIdx}`,
				average: Math.round(avg * 10) / 10
			});
			matchIdx++;
		}

		const checkoutAttempts = countCheckoutAttempts(throws);
		const checkoutSuccesses = countCheckoutSuccesses(throws);

		stats = {
			player_id: player.id,
			player_name: `${player.first_name} ${player.last_name}`,
			matches_played: matchMap.size,
			total_darts: throws.length,
			overall_average: calcAverage(throws),
			best_average: Math.max(...perMatchAvgs, 0),
			highest_score: Math.max(...perMatchHighests, 0),
			total_180s: count180s(throws),
			total_ton_plus: countTonPlus(throws),
			checkout_percentage: calcCheckoutPercentage(checkoutAttempts, checkoutSuccesses),
			total_checkout_attempts: checkoutAttempts,
			total_checkout_successes: checkoutSuccesses,
			sector_counts: buildSectorCounts(throws)
		};
	}

	return {
		player,
		club,
		stats,
		matchAverages
	};
};
