import { describe, it, expect } from 'vitest';
import type { DartThrow } from '$lib/types/game.js';
import {
	calcAverage,
	calcCheckoutPercentage,
	calcHighestTurnScore,
	count180s,
	countTonPlus,
	countCheckoutAttempts,
	countCheckoutSuccesses,
	buildSectorCounts,
	calcPlayerMatchStats,
	calcPlayerOverallStats
} from '$lib/utils/statistics.js';

function makeThrow(overrides: Partial<DartThrow> = {}): DartThrow {
	return {
		game_id: 'game-1',
		player_id: 'player-1',
		turn_number: 1,
		dart_number: 1,
		sector: 20,
		multiplier: 1,
		score: 20,
		remaining_score: 481,
		is_bust: false,
		...overrides
	};
}

describe('calcAverage', () => {
	it('returns 0 for empty throws array', () => {
		expect(calcAverage([])).toBe(0);
	});

	it('calculates 3-dart average from single throws', () => {
		const throws = [
			makeThrow({ score: 20 }),
			makeThrow({ score: 20 }),
			makeThrow({ score: 20 })
		];
		// Total 60, 3 throws -> avg = (60/3)*3 = 60
		expect(calcAverage(throws)).toBe(60);
	});

	it('excludes bust throws from average', () => {
		const throws = [
			makeThrow({ score: 60 }),
			makeThrow({ score: 0, is_bust: true }),
			makeThrow({ score: 60 })
		];
		// Only 2 valid throws, total 120 -> avg = (120/2)*3 = 180
		expect(calcAverage(throws)).toBe(180);
	});

	it('returns 0 when all throws are busts', () => {
		const throws = [
			makeThrow({ score: 0, is_bust: true }),
			makeThrow({ score: 0, is_bust: true })
		];
		expect(calcAverage(throws)).toBe(0);
	});

	it('calculates perfect 9-darter average', () => {
		// 9 darts to finish 501: average per dart = 501/9 = 55.67
		// 3-dart avg = 501/9 * 3 = 167
		const throws = Array.from({ length: 9 }, () => makeThrow({ score: 501 / 9 }));
		expect(calcAverage(throws)).toBeCloseTo(167, 0);
	});
});

describe('calcCheckoutPercentage', () => {
	it('returns 0 for 0 attempts', () => {
		expect(calcCheckoutPercentage(0, 0)).toBe(0);
	});

	it('calculates correct percentage', () => {
		expect(calcCheckoutPercentage(10, 3)).toBe(30);
	});

	it('returns 100 for perfect checkout rate', () => {
		expect(calcCheckoutPercentage(5, 5)).toBe(100);
	});
});

describe('calcHighestTurnScore', () => {
	it('returns 0 for empty throws', () => {
		expect(calcHighestTurnScore([])).toBe(0);
	});

	it('finds highest turn score', () => {
		const throws = [
			makeThrow({ turn_number: 1, dart_number: 1, score: 60 }),
			makeThrow({ turn_number: 1, dart_number: 2, score: 60 }),
			makeThrow({ turn_number: 1, dart_number: 3, score: 60 }),
			makeThrow({ turn_number: 2, dart_number: 1, score: 20 }),
			makeThrow({ turn_number: 2, dart_number: 2, score: 20 }),
			makeThrow({ turn_number: 2, dart_number: 3, score: 20 })
		];
		expect(calcHighestTurnScore(throws)).toBe(180);
	});

	it('excludes bust turns', () => {
		const throws = [
			makeThrow({ turn_number: 1, dart_number: 1, score: 60 }),
			makeThrow({ turn_number: 1, dart_number: 2, score: 0, is_bust: true }),
			makeThrow({ turn_number: 2, dart_number: 1, score: 20 }),
			makeThrow({ turn_number: 2, dart_number: 2, score: 20 }),
			makeThrow({ turn_number: 2, dart_number: 3, score: 20 })
		];
		// Turn 1: only 60 (bust excluded), Turn 2: 60
		expect(calcHighestTurnScore(throws)).toBe(60);
	});
});

describe('count180s', () => {
	it('returns 0 for empty throws', () => {
		expect(count180s([])).toBe(0);
	});

	it('counts a single 180', () => {
		const throws = [
			makeThrow({ turn_number: 1, dart_number: 1, sector: 20, multiplier: 3, score: 60 }),
			makeThrow({ turn_number: 1, dart_number: 2, sector: 20, multiplier: 3, score: 60 }),
			makeThrow({ turn_number: 1, dart_number: 3, sector: 20, multiplier: 3, score: 60 })
		];
		expect(count180s(throws)).toBe(1);
	});

	it('does not count incomplete T20 turns', () => {
		const throws = [
			makeThrow({ turn_number: 1, dart_number: 1, sector: 20, multiplier: 3, score: 60 }),
			makeThrow({ turn_number: 1, dart_number: 2, sector: 20, multiplier: 3, score: 60 }),
			makeThrow({ turn_number: 1, dart_number: 3, sector: 20, multiplier: 1, score: 20 })
		];
		expect(count180s(throws)).toBe(0);
	});

	it('counts multiple 180s across turns', () => {
		const throws = [
			makeThrow({ turn_number: 1, dart_number: 1, sector: 20, multiplier: 3, score: 60 }),
			makeThrow({ turn_number: 1, dart_number: 2, sector: 20, multiplier: 3, score: 60 }),
			makeThrow({ turn_number: 1, dart_number: 3, sector: 20, multiplier: 3, score: 60 }),
			makeThrow({ turn_number: 3, dart_number: 1, sector: 20, multiplier: 3, score: 60 }),
			makeThrow({ turn_number: 3, dart_number: 2, sector: 20, multiplier: 3, score: 60 }),
			makeThrow({ turn_number: 3, dart_number: 3, sector: 20, multiplier: 3, score: 60 })
		];
		expect(count180s(throws)).toBe(2);
	});
});

describe('countTonPlus', () => {
	it('returns 0 for empty throws', () => {
		expect(countTonPlus([])).toBe(0);
	});

	it('counts turns with 100+ score', () => {
		const throws = [
			makeThrow({ turn_number: 1, dart_number: 1, score: 60 }),
			makeThrow({ turn_number: 1, dart_number: 2, score: 60 }),
			makeThrow({ turn_number: 1, dart_number: 3, score: 20 }),
			makeThrow({ turn_number: 2, dart_number: 1, score: 20 }),
			makeThrow({ turn_number: 2, dart_number: 2, score: 20 }),
			makeThrow({ turn_number: 2, dart_number: 3, score: 20 })
		];
		// Turn 1: 140 (ton+), Turn 2: 60
		expect(countTonPlus(throws)).toBe(1);
	});

	it('counts exactly 100 as ton+', () => {
		const throws = [
			makeThrow({ turn_number: 1, dart_number: 1, score: 40 }),
			makeThrow({ turn_number: 1, dart_number: 2, score: 40 }),
			makeThrow({ turn_number: 1, dart_number: 3, score: 20 })
		];
		expect(countTonPlus(throws)).toBe(1);
	});
});

describe('countCheckoutAttempts', () => {
	it('returns 0 for empty throws', () => {
		expect(countCheckoutAttempts([])).toBe(0);
	});

	it('counts doubles thrown when remaining was checkable', () => {
		const throws = [
			makeThrow({ multiplier: 2, remaining_score: 0, score: 40 }),
			makeThrow({ multiplier: 2, remaining_score: 80, score: 40 }),
			makeThrow({ multiplier: 1, remaining_score: 100, score: 20 })
		];
		// First: remaining 0 + score 40 = 40 <= 170, double -> attempt
		// Second: remaining 80 + score 40 = 120 <= 170, double -> attempt
		// Third: not a double -> not an attempt
		expect(countCheckoutAttempts(throws)).toBe(2);
	});
});

describe('countCheckoutSuccesses', () => {
	it('returns 0 for empty throws', () => {
		expect(countCheckoutSuccesses([])).toBe(0);
	});

	it('counts throws where remaining reached 0', () => {
		const throws = [
			makeThrow({ remaining_score: 0, is_bust: false }),
			makeThrow({ remaining_score: 0, is_bust: true }),
			makeThrow({ remaining_score: 40, is_bust: false })
		];
		expect(countCheckoutSuccesses(throws)).toBe(1);
	});
});

describe('buildSectorCounts', () => {
	it('returns empty object for empty throws', () => {
		expect(buildSectorCounts([])).toEqual({});
	});

	it('counts hits per sector', () => {
		const throws = [
			makeThrow({ sector: 20 }),
			makeThrow({ sector: 20 }),
			makeThrow({ sector: 19 }),
			makeThrow({ sector: 25 })
		];
		expect(buildSectorCounts(throws)).toEqual({ 20: 2, 19: 1, 25: 1 });
	});

	it('ignores sector 0 and bust throws', () => {
		const throws = [
			makeThrow({ sector: 0, score: 0 }),
			makeThrow({ sector: 20, is_bust: true }),
			makeThrow({ sector: 19 })
		];
		expect(buildSectorCounts(throws)).toEqual({ 19: 1 });
	});
});

describe('calcPlayerMatchStats', () => {
	it('calculates stats for a player in a match', () => {
		const throws: DartThrow[] = [
			makeThrow({ player_id: 'p1', turn_number: 1, dart_number: 1, sector: 20, multiplier: 3, score: 60, remaining_score: 441 }),
			makeThrow({ player_id: 'p1', turn_number: 1, dart_number: 2, sector: 20, multiplier: 3, score: 60, remaining_score: 381 }),
			makeThrow({ player_id: 'p1', turn_number: 1, dart_number: 3, sector: 20, multiplier: 3, score: 60, remaining_score: 321 }),
			makeThrow({ player_id: 'p2', turn_number: 2, dart_number: 1, sector: 19, multiplier: 1, score: 19, remaining_score: 482 })
		];

		const stats = calcPlayerMatchStats('p1', 'Max Mueller', 'match-1', throws);
		expect(stats.player_id).toBe('p1');
		expect(stats.darts_thrown).toBe(3);
		expect(stats.average).toBe(180);
		expect(stats.highest_score).toBe(180);
		expect(stats.one_eighties).toBe(1);
		expect(stats.ton_plus).toBe(1);
	});
});

describe('calcPlayerOverallStats', () => {
	it('returns empty stats for no match data', () => {
		const stats = calcPlayerOverallStats('p1', 'Max Mueller', []);
		expect(stats.matches_played).toBe(0);
		expect(stats.overall_average).toBe(0);
		expect(stats.total_180s).toBe(0);
	});

	it('aggregates stats across matches', () => {
		const match1Throws: DartThrow[] = [
			makeThrow({ player_id: 'p1', turn_number: 1, dart_number: 1, score: 60, remaining_score: 441 }),
			makeThrow({ player_id: 'p1', turn_number: 1, dart_number: 2, score: 60, remaining_score: 381 }),
			makeThrow({ player_id: 'p1', turn_number: 1, dart_number: 3, score: 60, remaining_score: 321 })
		];
		const match2Throws: DartThrow[] = [
			makeThrow({ player_id: 'p1', turn_number: 1, dart_number: 1, score: 20, remaining_score: 481 }),
			makeThrow({ player_id: 'p1', turn_number: 1, dart_number: 2, score: 20, remaining_score: 461 }),
			makeThrow({ player_id: 'p1', turn_number: 1, dart_number: 3, score: 20, remaining_score: 441 })
		];

		const matchStats = [
			calcPlayerMatchStats('p1', 'Max Mueller', 'match-1', match1Throws),
			calcPlayerMatchStats('p1', 'Max Mueller', 'match-2', match2Throws)
		];

		const overall = calcPlayerOverallStats('p1', 'Max Mueller', matchStats);
		expect(overall.matches_played).toBe(2);
		expect(overall.total_darts).toBe(6);
		// Overall: (360/6)*3 = 180... wait (60+60+60+20+20+20=240)/6*3 = 120
		expect(overall.overall_average).toBe(120);
		expect(overall.best_average).toBe(180);
		expect(overall.highest_score).toBe(180);
	});
});
