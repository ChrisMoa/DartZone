import type { DartThrow, SectorValue } from '$lib/types/game.js';

export interface PlayerMatchStats {
	player_id: string;
	player_name: string;
	match_id: string;
	throws: DartThrow[];
	average: number;
	highest_score: number;
	checkout_attempts: number;
	checkout_successes: number;
	checkout_percentage: number;
	darts_thrown: number;
	one_eighties: number;
	ton_plus: number;
}

export interface PlayerOverallStats {
	player_id: string;
	player_name: string;
	matches_played: number;
	total_darts: number;
	overall_average: number;
	best_average: number;
	highest_score: number;
	total_180s: number;
	total_ton_plus: number;
	checkout_percentage: number;
	total_checkout_attempts: number;
	total_checkout_successes: number;
	sector_counts: Record<number, number>;
}

/**
 * Calculate the 3-dart average from an array of throws.
 * Only counts non-bust throws.
 */
export function calcAverage(throws: DartThrow[]): number {
	const valid = throws.filter((t) => !t.is_bust);
	if (valid.length === 0) return 0;
	const totalScore = valid.reduce((sum, t) => sum + t.score, 0);
	return (totalScore / valid.length) * 3;
}

/**
 * Calculate checkout percentage from attempts and successes.
 */
export function calcCheckoutPercentage(attempts: number, successes: number): number {
	if (attempts === 0) return 0;
	return (successes / attempts) * 100;
}

/**
 * Find the highest single-turn score from throws.
 * A turn is 3 consecutive darts by the same player.
 */
export function calcHighestTurnScore(throws: DartThrow[]): number {
	if (throws.length === 0) return 0;

	const turns = new Map<string, number>();
	for (const t of throws) {
		if (t.is_bust) continue;
		const key = `${t.player_id}-${t.turn_number}`;
		turns.set(key, (turns.get(key) ?? 0) + t.score);
	}

	let max = 0;
	for (const score of turns.values()) {
		if (score > max) max = score;
	}
	return max;
}

/**
 * Count the number of 180s (three triple-20s in a single turn).
 */
export function count180s(throws: DartThrow[]): number {
	const turns = new Map<string, DartThrow[]>();
	for (const t of throws) {
		const key = `${t.player_id}-${t.turn_number}`;
		const arr = turns.get(key) ?? [];
		arr.push(t);
		turns.set(key, arr);
	}

	let count = 0;
	for (const turnThrows of turns.values()) {
		if (
			turnThrows.length === 3 &&
			turnThrows.every((t) => t.sector === 20 && t.multiplier === 3 && !t.is_bust)
		) {
			count++;
		}
	}
	return count;
}

/**
 * Count turns with a score of 100 or more (ton+).
 */
export function countTonPlus(throws: DartThrow[]): number {
	const turns = new Map<string, number>();
	for (const t of throws) {
		if (t.is_bust) continue;
		const key = `${t.player_id}-${t.turn_number}`;
		turns.set(key, (turns.get(key) ?? 0) + t.score);
	}

	let count = 0;
	for (const score of turns.values()) {
		if (score >= 100) count++;
	}
	return count;
}

/**
 * Count checkout attempts (throws where remaining <= 170 and it's the
 * last dart of a turn or the dart that could finish).
 * Simplified: count doubles thrown when remaining was checkable.
 */
export function countCheckoutAttempts(throws: DartThrow[]): number {
	return throws.filter(
		(t) => t.multiplier === 2 && t.remaining_score + t.score <= 170
	).length;
}

/**
 * Count successful checkouts (remaining reached 0).
 */
export function countCheckoutSuccesses(throws: DartThrow[]): number {
	return throws.filter((t) => t.remaining_score === 0 && !t.is_bust).length;
}

/**
 * Build a sector hit count map for heatmap visualization.
 * Returns counts per sector (1-20, 25) regardless of multiplier.
 */
export function buildSectorCounts(throws: DartThrow[]): Record<number, number> {
	const counts: Record<number, number> = {};
	for (const t of throws) {
		if (t.sector === 0 || t.is_bust) continue;
		counts[t.sector] = (counts[t.sector] ?? 0) + 1;
	}
	return counts;
}

/**
 * Calculate per-match stats for a player from their throws.
 */
export function calcPlayerMatchStats(
	playerId: string,
	playerName: string,
	matchId: string,
	throws: DartThrow[]
): PlayerMatchStats {
	const playerThrows = throws.filter((t) => t.player_id === playerId);
	const checkoutAttempts = countCheckoutAttempts(playerThrows);
	const checkoutSuccesses = countCheckoutSuccesses(playerThrows);

	return {
		player_id: playerId,
		player_name: playerName,
		match_id: matchId,
		throws: playerThrows,
		average: calcAverage(playerThrows),
		highest_score: calcHighestTurnScore(playerThrows),
		checkout_attempts: checkoutAttempts,
		checkout_successes: checkoutSuccesses,
		checkout_percentage: calcCheckoutPercentage(checkoutAttempts, checkoutSuccesses),
		darts_thrown: playerThrows.length,
		one_eighties: count180s(playerThrows),
		ton_plus: countTonPlus(playerThrows)
	};
}

/**
 * Aggregate multiple match stats into overall player stats.
 */
export function calcPlayerOverallStats(
	playerId: string,
	playerName: string,
	matchStats: PlayerMatchStats[]
): PlayerOverallStats {
	if (matchStats.length === 0) {
		return {
			player_id: playerId,
			player_name: playerName,
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
	}

	const allThrows = matchStats.flatMap((m) => m.throws);
	const totalCheckoutAttempts = matchStats.reduce((sum, m) => sum + m.checkout_attempts, 0);
	const totalCheckoutSuccesses = matchStats.reduce((sum, m) => sum + m.checkout_successes, 0);

	return {
		player_id: playerId,
		player_name: playerName,
		matches_played: matchStats.length,
		total_darts: allThrows.length,
		overall_average: calcAverage(allThrows),
		best_average: Math.max(...matchStats.map((m) => m.average)),
		highest_score: Math.max(...matchStats.map((m) => m.highest_score)),
		total_180s: matchStats.reduce((sum, m) => sum + m.one_eighties, 0),
		total_ton_plus: matchStats.reduce((sum, m) => sum + m.ton_plus, 0),
		checkout_percentage: calcCheckoutPercentage(totalCheckoutAttempts, totalCheckoutSuccesses),
		total_checkout_attempts: totalCheckoutAttempts,
		total_checkout_successes: totalCheckoutSuccesses,
		sector_counts: buildSectorCounts(allThrows)
	};
}
