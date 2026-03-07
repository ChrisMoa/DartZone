import type { Multiplier, SectorValue } from '$lib/types/game.js';

/**
 * Calculate score from a sector hit and multiplier.
 * Bull (25) only allows multiplier 1 (single bull = 25) or 2 (bullseye = 50).
 * Sectors 1-20 allow multiplier 1 (single), 2 (double), 3 (triple).
 * Multiplier 0 = miss = 0.
 */
export function calcScore(sector: SectorValue, multiplier: Multiplier): number {
	if (multiplier === 0 || sector === 0) return 0;
	if (sector === 25) {
		// Bull only has single (25) and double (50), no triple
		if (multiplier === 3) return 0;
		return sector * multiplier;
	}
	return sector * multiplier;
}

/**
 * Check if a remaining score can be finished (checkout) with the given number of darts.
 * A valid checkout must end on a double (multiplier 2).
 */
export function isCheckoutPossible(remaining: number): boolean {
	// Minimum checkout is 2 (D1), maximum is 170 (T20 T20 D25)
	if (remaining < 2 || remaining > 170) return false;
	// Impossible checkouts
	const impossible = [159, 162, 163, 165, 166, 168, 169];
	if (impossible.includes(remaining)) return false;
	return true;
}

/**
 * Check if a throw results in a bust.
 * Bust occurs when:
 * - Remaining score goes below 0
 * - Remaining score becomes 1 (can't finish on a double)
 * - Remaining score becomes 0 but the last dart wasn't a double
 */
export function isBust(
	remainingBefore: number,
	score: number,
	multiplier: Multiplier
): boolean {
	const remaining = remainingBefore - score;
	if (remaining < 0) return true;
	if (remaining === 1) return true;
	if (remaining === 0 && multiplier !== 2) return true;
	return false;
}

/**
 * Check if a throw is a valid checkout (remaining reaches exactly 0 on a double).
 */
export function isCheckout(
	remainingBefore: number,
	score: number,
	multiplier: Multiplier
): boolean {
	return remainingBefore - score === 0 && multiplier === 2;
}
