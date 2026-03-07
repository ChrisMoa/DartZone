import type { Multiplier, SectorValue, SpecialHit } from '$lib/types/game.js';
import type { DartThrow } from '$lib/types/game.js';

/** Standard dartboard sector order, clockwise starting from the top (12 o'clock position). */
export const SECTOR_ORDER: readonly number[] = [
	20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5
] as const;

/** Dartboard ring radii as fractions of the total board radius (170mm = 1.0). */
export const RINGS = {
	BULLSEYE_OUTER: 6.35 / 170, // ~0.0374
	BULL_OUTER: 15.9 / 170, // ~0.0935
	TRIPLE_INNER: 99 / 170, // ~0.5824
	TRIPLE_OUTER: 107 / 170, // ~0.6294
	DOUBLE_INNER: 162 / 170, // ~0.9529
	DOUBLE_OUTER: 1.0 // 170/170
} as const;

/** Angle span per sector in degrees. */
const SECTOR_ANGLE = 360 / 20; // 18 degrees

/**
 * Get the sector number at a given angle (in degrees, 0 = top/12 o'clock, clockwise).
 * Each sector spans 18 degrees, offset by half a sector so sector 20 is centered at 0/360.
 */
export function sectorAtAngle(degrees: number): number {
	// Normalize angle to [0, 360)
	let angle = ((degrees % 360) + 360) % 360;
	// Offset by half a sector width so sector 20 is centered at 0°
	angle = (angle + SECTOR_ANGLE / 2) % 360;
	const index = Math.floor(angle / SECTOR_ANGLE);
	return SECTOR_ORDER[index];
}

/**
 * Determine which ring a point is in, based on its normalized distance from center (0-1).
 * Returns the multiplier: 0 (outside), 1 (single), 2 (double/bullseye), 3 (triple).
 */
export function getMultiplierForDistance(distance: number): Multiplier {
	if (distance <= RINGS.BULLSEYE_OUTER) return 2; // Bullseye (double bull)
	if (distance <= RINGS.BULL_OUTER) return 1; // Bull (single bull)
	if (distance <= RINGS.TRIPLE_INNER) return 1; // Inner single
	if (distance <= RINGS.TRIPLE_OUTER) return 3; // Triple
	if (distance <= RINGS.DOUBLE_INNER) return 1; // Outer single
	if (distance <= RINGS.DOUBLE_OUTER) return 2; // Double
	return 0; // Outside the board
}

/**
 * Check if a normalized distance falls within a specific ring.
 */
export function isInRing(
	distance: number,
	ring: 'bullseye' | 'bull' | 'triple' | 'double' | 'inner_single' | 'outer_single'
): boolean {
	switch (ring) {
		case 'bullseye':
			return distance <= RINGS.BULLSEYE_OUTER;
		case 'bull':
			return distance > RINGS.BULLSEYE_OUTER && distance <= RINGS.BULL_OUTER;
		case 'inner_single':
			return distance > RINGS.BULL_OUTER && distance <= RINGS.TRIPLE_INNER;
		case 'triple':
			return distance > RINGS.TRIPLE_INNER && distance <= RINGS.TRIPLE_OUTER;
		case 'outer_single':
			return distance > RINGS.TRIPLE_OUTER && distance <= RINGS.DOUBLE_INNER;
		case 'double':
			return distance > RINGS.DOUBLE_INNER && distance <= RINGS.DOUBLE_OUTER;
		default:
			return false;
	}
}

/**
 * Convert click coordinates (relative to board center) to sector and multiplier.
 * x/y are in the range [-1, 1] where the board radius is 1.
 */
export function hitFromCoordinates(
	x: number,
	y: number
): { sector: SectorValue; multiplier: Multiplier; score: number } {
	const distance = Math.sqrt(x * x + y * y);

	if (distance > RINGS.DOUBLE_OUTER) {
		return { sector: 0, multiplier: 0, score: 0 };
	}

	const multiplier = getMultiplierForDistance(distance);

	// Bull/Bullseye
	if (distance <= RINGS.BULL_OUTER) {
		const sector: SectorValue = 25;
		return { sector, multiplier, score: sector * multiplier };
	}

	// Calculate angle: 0° = top (12 o'clock), clockwise
	const angleRad = Math.atan2(x, -y); // x first, -y to make 0° = top
	let angleDeg = (angleRad * 180) / Math.PI;
	angleDeg = ((angleDeg % 360) + 360) % 360;

	const sectorNumber = sectorAtAngle(angleDeg) as SectorValue;
	return { sector: sectorNumber, multiplier, score: sectorNumber * multiplier };
}

/**
 * Detect special hits from the throws in a single turn (up to 3 darts).
 */
export function detectSpecialHit(turnThrows: DartThrow[]): SpecialHit {
	if (turnThrows.length === 0) return null;

	const lastThrow = turnThrows[turnThrows.length - 1];

	// Checkout: remaining score reached 0
	if (lastThrow.remaining_score === 0 && lastThrow.multiplier === 2) {
		return 'checkout';
	}

	// 180: all 3 darts are T20
	if (
		turnThrows.length === 3 &&
		turnThrows.every((t) => t.sector === 20 && t.multiplier === 3)
	) {
		return 'one_eighty';
	}

	// Bullseye: last throw was double bull (50)
	if (lastThrow.sector === 25 && lastThrow.multiplier === 2) {
		return 'bullseye';
	}

	// Triple 20
	if (lastThrow.sector === 20 && lastThrow.multiplier === 3) {
		return 'triple_twenty';
	}

	return null;
}

/**
 * Generate SVG path data for a sector arc segment (annular sector).
 * Used to draw the individual sectors of the dartboard.
 *
 * @param sectorIndex - Index in the SECTOR_ORDER array (0-19)
 * @param innerRadius - Inner radius as fraction of total board radius
 * @param outerRadius - Outer radius as fraction of total board radius
 * @param boardRadius - The actual SVG radius in pixels
 */
export function generateSectorPath(
	sectorIndex: number,
	innerRadius: number,
	outerRadius: number,
	boardRadius: number
): string {
	const startAngle = sectorIndex * SECTOR_ANGLE - SECTOR_ANGLE / 2 - 90; // offset so sector 0 (20) is at top
	const endAngle = startAngle + SECTOR_ANGLE;

	const startRad = (startAngle * Math.PI) / 180;
	const endRad = (endAngle * Math.PI) / 180;

	const ir = innerRadius * boardRadius;
	const or = outerRadius * boardRadius;

	const x1 = or * Math.cos(startRad);
	const y1 = or * Math.sin(startRad);
	const x2 = or * Math.cos(endRad);
	const y2 = or * Math.sin(endRad);
	const x3 = ir * Math.cos(endRad);
	const y3 = ir * Math.sin(endRad);
	const x4 = ir * Math.cos(startRad);
	const y4 = ir * Math.sin(startRad);

	return [
		`M ${x1} ${y1}`,
		`A ${or} ${or} 0 0 1 ${x2} ${y2}`,
		`L ${x3} ${y3}`,
		`A ${ir} ${ir} 0 0 0 ${x4} ${y4}`,
		'Z'
	].join(' ');
}
