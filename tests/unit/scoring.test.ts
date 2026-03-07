import { describe, it, expect } from 'vitest';
import { calcScore, isBust, isCheckout, isCheckoutPossible } from '$lib/utils/scoring.js';

describe('calcScore', () => {
	it('returns correct single scores for all sectors', () => {
		for (let i = 1; i <= 20; i++) {
			expect(calcScore(i as any, 1)).toBe(i);
		}
	});

	it('returns correct double scores', () => {
		expect(calcScore(20, 2)).toBe(40);
		expect(calcScore(16, 2)).toBe(32);
		expect(calcScore(1, 2)).toBe(2);
	});

	it('returns correct triple scores', () => {
		expect(calcScore(20, 3)).toBe(60);
		expect(calcScore(19, 3)).toBe(57);
		expect(calcScore(1, 3)).toBe(3);
	});

	it('returns 25 for single bull', () => {
		expect(calcScore(25, 1)).toBe(25);
	});

	it('returns 50 for bullseye (double bull)', () => {
		expect(calcScore(25, 2)).toBe(50);
	});

	it('returns 0 for triple bull (invalid)', () => {
		expect(calcScore(25, 3)).toBe(0);
	});

	it('returns 0 for miss (multiplier 0)', () => {
		expect(calcScore(20, 0)).toBe(0);
		expect(calcScore(25, 0)).toBe(0);
	});

	it('returns 0 for sector 0', () => {
		expect(calcScore(0, 1)).toBe(0);
		expect(calcScore(0, 3)).toBe(0);
	});
});

describe('isCheckoutPossible', () => {
	it('returns true for valid checkout scores', () => {
		expect(isCheckoutPossible(2)).toBe(true); // D1
		expect(isCheckoutPossible(170)).toBe(true); // T20 T20 D25
		expect(isCheckoutPossible(50)).toBe(true); // D25
		expect(isCheckoutPossible(40)).toBe(true); // D20
		expect(isCheckoutPossible(100)).toBe(true);
		expect(isCheckoutPossible(160)).toBe(true);
		expect(isCheckoutPossible(36)).toBe(true);
		expect(isCheckoutPossible(32)).toBe(true);
		expect(isCheckoutPossible(161)).toBe(true);
	});

	it('returns false for impossible checkouts', () => {
		expect(isCheckoutPossible(1)).toBe(false);
		expect(isCheckoutPossible(0)).toBe(false);
		expect(isCheckoutPossible(-1)).toBe(false);
		expect(isCheckoutPossible(171)).toBe(false);
		expect(isCheckoutPossible(169)).toBe(false);
		expect(isCheckoutPossible(168)).toBe(false);
	});
});

describe('isBust', () => {
	it('returns true when remaining goes below 0', () => {
		expect(isBust(30, 40, 2)).toBe(true);
	});

	it('returns true when remaining becomes 1', () => {
		expect(isBust(21, 20, 1)).toBe(true);
	});

	it('returns true when reaching 0 without a double', () => {
		expect(isBust(20, 20, 1)).toBe(true);
		expect(isBust(60, 60, 3)).toBe(true);
	});

	it('returns false for valid checkout on double', () => {
		expect(isBust(40, 40, 2)).toBe(false);
		expect(isBust(2, 2, 2)).toBe(false);
		expect(isBust(50, 50, 2)).toBe(false);
	});

	it('returns false for normal scoring', () => {
		expect(isBust(501, 60, 3)).toBe(false);
		expect(isBust(301, 25, 1)).toBe(false);
	});
});

describe('isCheckout', () => {
	it('returns true when remaining reaches 0 on a double', () => {
		expect(isCheckout(40, 40, 2)).toBe(true);
		expect(isCheckout(50, 50, 2)).toBe(true);
		expect(isCheckout(2, 2, 2)).toBe(true);
	});

	it('returns false when not reaching 0', () => {
		expect(isCheckout(100, 40, 2)).toBe(false);
	});

	it('returns false when reaching 0 without double', () => {
		expect(isCheckout(20, 20, 1)).toBe(false);
		expect(isCheckout(60, 60, 3)).toBe(false);
	});
});
