import { describe, it, expect } from 'vitest';
import {
	SECTOR_ORDER,
	sectorAtAngle,
	getMultiplierForDistance,
	isInRing,
	hitFromCoordinates,
	detectSpecialHit,
	RINGS
} from '$lib/components/dartboard/dartboard.utils.js';
import type { DartThrow } from '$lib/types/game.js';

describe('SECTOR_ORDER', () => {
	it('has 20 sectors', () => {
		expect(SECTOR_ORDER).toHaveLength(20);
	});

	it('starts with 20 at the top', () => {
		expect(SECTOR_ORDER[0]).toBe(20);
	});

	it('contains all numbers 1-20', () => {
		const sorted = [...SECTOR_ORDER].sort((a, b) => a - b);
		expect(sorted).toEqual(Array.from({ length: 20 }, (_, i) => i + 1));
	});
});

describe('sectorAtAngle', () => {
	it('returns 20 at 0 degrees (top)', () => {
		expect(sectorAtAngle(0)).toBe(20);
	});

	it('returns 20 at 360 degrees (full rotation)', () => {
		expect(sectorAtAngle(360)).toBe(20);
	});

	it('returns correct sectors at sector centers (18° intervals)', () => {
		// Each sector is 18° wide, centered at i * 18°
		for (let i = 0; i < 20; i++) {
			const centerAngle = i * 18;
			expect(sectorAtAngle(centerAngle)).toBe(SECTOR_ORDER[i]);
		}
	});

	it('handles negative angles', () => {
		expect(sectorAtAngle(-18)).toBe(SECTOR_ORDER[19]); // 5 (last sector)
	});

	it('handles angles > 360', () => {
		expect(sectorAtAngle(378)).toBe(sectorAtAngle(18)); // 1
	});

	it('returns correct sector at boundary angles', () => {
		// At 9° we should be at the boundary between sector 20 and sector 1
		// At exactly 9° it should fall into sector 1 (next sector)
		expect(sectorAtAngle(9)).toBe(SECTOR_ORDER[1]); // 1
	});
});

describe('getMultiplierForDistance', () => {
	it('returns 2 for bullseye distance', () => {
		expect(getMultiplierForDistance(0)).toBe(2);
		expect(getMultiplierForDistance(RINGS.BULLSEYE_OUTER * 0.5)).toBe(2);
		expect(getMultiplierForDistance(RINGS.BULLSEYE_OUTER)).toBe(2);
	});

	it('returns 1 for bull distance', () => {
		expect(getMultiplierForDistance(RINGS.BULLSEYE_OUTER + 0.01)).toBe(1);
		expect(getMultiplierForDistance(RINGS.BULL_OUTER)).toBe(1);
	});

	it('returns 1 for inner single distance', () => {
		expect(getMultiplierForDistance(RINGS.BULL_OUTER + 0.01)).toBe(1);
		expect(getMultiplierForDistance(RINGS.TRIPLE_INNER)).toBe(1);
	});

	it('returns 3 for triple distance', () => {
		expect(getMultiplierForDistance(RINGS.TRIPLE_INNER + 0.01)).toBe(3);
		expect(getMultiplierForDistance(RINGS.TRIPLE_OUTER)).toBe(3);
	});

	it('returns 1 for outer single distance', () => {
		expect(getMultiplierForDistance(RINGS.TRIPLE_OUTER + 0.01)).toBe(1);
		expect(getMultiplierForDistance(RINGS.DOUBLE_INNER)).toBe(1);
	});

	it('returns 2 for double distance', () => {
		expect(getMultiplierForDistance(RINGS.DOUBLE_INNER + 0.01)).toBe(2);
		expect(getMultiplierForDistance(RINGS.DOUBLE_OUTER)).toBe(2);
	});

	it('returns 0 for outside board', () => {
		expect(getMultiplierForDistance(RINGS.DOUBLE_OUTER + 0.01)).toBe(0);
		expect(getMultiplierForDistance(1.5)).toBe(0);
	});
});

describe('isInRing', () => {
	it('correctly identifies bullseye', () => {
		expect(isInRing(0, 'bullseye')).toBe(true);
		expect(isInRing(RINGS.BULLSEYE_OUTER, 'bullseye')).toBe(true);
		expect(isInRing(RINGS.BULLSEYE_OUTER + 0.01, 'bullseye')).toBe(false);
	});

	it('correctly identifies bull', () => {
		expect(isInRing(RINGS.BULLSEYE_OUTER + 0.01, 'bull')).toBe(true);
		expect(isInRing(RINGS.BULL_OUTER, 'bull')).toBe(true);
		expect(isInRing(0, 'bull')).toBe(false);
	});

	it('correctly identifies triple', () => {
		expect(isInRing(RINGS.TRIPLE_INNER + 0.01, 'triple')).toBe(true);
		expect(isInRing(RINGS.TRIPLE_OUTER, 'triple')).toBe(true);
		expect(isInRing(RINGS.BULL_OUTER + 0.01, 'triple')).toBe(false);
	});

	it('correctly identifies double', () => {
		expect(isInRing(RINGS.DOUBLE_INNER + 0.01, 'double')).toBe(true);
		expect(isInRing(RINGS.DOUBLE_OUTER, 'double')).toBe(true);
		expect(isInRing(RINGS.TRIPLE_OUTER + 0.01, 'double')).toBe(false);
	});
});

describe('hitFromCoordinates', () => {
	it('returns bullseye for center hit', () => {
		const hit = hitFromCoordinates(0, 0);
		expect(hit.sector).toBe(25);
		expect(hit.multiplier).toBe(2);
		expect(hit.score).toBe(50);
	});

	it('returns miss for outside board', () => {
		const hit = hitFromCoordinates(1.5, 0);
		expect(hit.sector).toBe(0);
		expect(hit.multiplier).toBe(0);
		expect(hit.score).toBe(0);
	});

	it('returns sector 20 for hit at top of board', () => {
		// A point directly above center in the inner single area
		const hit = hitFromCoordinates(0, -0.5);
		expect(hit.sector).toBe(20);
		expect(hit.multiplier).toBe(1);
	});
});

describe('detectSpecialHit', () => {
	const makeThrow = (
		sector: number,
		multiplier: number,
		remaining: number
	): DartThrow => ({
		game_id: '1',
		player_id: '1',
		turn_number: 1,
		dart_number: 1,
		sector: sector as any,
		multiplier: multiplier as any,
		score: sector * multiplier,
		remaining_score: remaining,
		is_bust: false
	});

	it('returns null for empty throws', () => {
		expect(detectSpecialHit([])).toBeNull();
	});

	it('detects bullseye', () => {
		expect(detectSpecialHit([makeThrow(25, 2, 100)])).toBe('bullseye');
	});

	it('detects triple twenty', () => {
		expect(detectSpecialHit([makeThrow(20, 3, 100)])).toBe('triple_twenty');
	});

	it('detects 180 (three T20s)', () => {
		const throws = [
			makeThrow(20, 3, 381),
			makeThrow(20, 3, 321),
			makeThrow(20, 3, 261)
		];
		expect(detectSpecialHit(throws)).toBe('one_eighty');
	});

	it('detects checkout', () => {
		expect(detectSpecialHit([makeThrow(20, 2, 0)])).toBe('checkout');
	});

	it('prioritizes checkout over bullseye', () => {
		// D25 checkout
		expect(detectSpecialHit([makeThrow(25, 2, 0)])).toBe('checkout');
	});

	it('prioritizes 180 over triple_twenty', () => {
		const throws = [
			makeThrow(20, 3, 441),
			makeThrow(20, 3, 381),
			makeThrow(20, 3, 321)
		];
		expect(detectSpecialHit(throws)).toBe('one_eighty');
	});

	it('returns null for regular throws', () => {
		expect(detectSpecialHit([makeThrow(5, 1, 400)])).toBeNull();
	});
});
