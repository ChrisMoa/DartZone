import type { CricketMarks, CricketPlayerState, Multiplier, SectorValue } from '$lib/types/game.js';
import { CRICKET_SEGMENTS } from '$lib/types/game.js';

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
 * Standard mode: bust when remaining < 0, remaining === 1, or remaining === 0 without a double.
 * Soft checkout mode: never a bust (any throw that reaches <= 0 wins).
 */
export function isBust(
	remainingBefore: number,
	score: number,
	multiplier: Multiplier,
	softCheckout: boolean = false
): boolean {
	if (softCheckout) return false;
	const remaining = remainingBefore - score;
	if (remaining < 0) return true;
	if (remaining === 1) return true;
	if (remaining === 0 && multiplier !== 2) return true;
	return false;
}

/**
 * Check if a throw is a valid checkout.
 * Standard mode: remaining reaches exactly 0 on a double.
 * Soft checkout mode: remaining reaches 0 or below.
 */
export function isCheckout(
	remainingBefore: number,
	score: number,
	multiplier: Multiplier,
	softCheckout: boolean = false
): boolean {
	if (softCheckout) {
		return remainingBefore - score <= 0;
	}
	return remainingBefore - score === 0 && multiplier === 2;
}

// --- Cricket scoring ---

export function isCricketSegment(sector: SectorValue): boolean {
	return (CRICKET_SEGMENTS as readonly number[]).includes(sector);
}

export function createEmptyCricketMarks(): CricketMarks {
	const marks: CricketMarks = {};
	for (const seg of CRICKET_SEGMENTS) {
		marks[seg] = 0;
	}
	return marks;
}

/**
 * Calculate the result of a cricket throw.
 * Returns how many new marks are applied and how many points are scored.
 * A hit on a non-cricket segment or a miss scores nothing.
 * Marks beyond 3 on a closed-by-opponent segment score points instead.
 */
export function calcCricketThrow(
	sector: SectorValue,
	multiplier: Multiplier,
	throwerMarks: CricketMarks,
	opponentMarks: CricketMarks
): { newMarks: number; points: number } {
	if (multiplier === 0 || sector === 0 || !isCricketSegment(sector)) {
		return { newMarks: 0, points: 0 };
	}

	// Bull: single=1 mark, double=2 marks, no triple
	const hitCount = sector === 25 && multiplier === 3 ? 0 : multiplier;
	if (hitCount === 0) return { newMarks: 0, points: 0 };

	const currentMarks = throwerMarks[sector] ?? 0;
	const opponentClosed = (opponentMarks[sector] ?? 0) >= 3;

	// Marks needed to close this segment (max 3)
	const marksToClose = Math.max(0, 3 - currentMarks);
	const newMarks = Math.min(hitCount, marksToClose);

	// Extra hits beyond closing score points (only if opponent hasn't closed)
	let points = 0;
	if (!opponentClosed) {
		const extraHits = hitCount - marksToClose;
		if (extraHits > 0) {
			const pointValue = sector === 25 ? 25 : sector;
			points = extraHits * pointValue;
		}
	}

	return { newMarks, points };
}

/**
 * Check if a player has closed all cricket segments.
 */
export function hasClosedAll(marks: CricketMarks): boolean {
	return CRICKET_SEGMENTS.every((seg) => (marks[seg] ?? 0) >= 3);
}

/**
 * Check if cricket game is over.
 * Game ends when a player has closed all segments AND has >= opponent's points.
 */
export function isCricketGameOver(
	homeState: CricketPlayerState,
	awayState: CricketPlayerState
): string | null {
	const homeClosed = hasClosedAll(homeState.marks);
	const awayClosed = hasClosedAll(awayState.marks);

	if (homeClosed && homeState.points >= awayState.points) return 'home';
	if (awayClosed && awayState.points >= homeState.points) return 'away';

	return null;
}
