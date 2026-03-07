import type { Multiplier, SectorValue } from '$lib/types/game.js';

export interface CheckoutDart {
	sector: SectorValue;
	multiplier: Multiplier;
	score: number;
	label: string;
}

export type CheckoutRoute = CheckoutDart[];

const DOUBLES: CheckoutDart[] = [];
const SINGLES: CheckoutDart[] = [];
const TRIPLES: CheckoutDart[] = [];

// Build all possible dart scores
for (let s = 1; s <= 20; s++) {
	const sector = s as SectorValue;
	SINGLES.push({ sector, multiplier: 1, score: s, label: `S${s}` });
	DOUBLES.push({ sector, multiplier: 2, score: s * 2, label: `D${s}` });
	TRIPLES.push({ sector, multiplier: 3, score: s * 3, label: `T${s}` });
}
// Bull
SINGLES.push({ sector: 25, multiplier: 1, score: 25, label: 'S25' });
DOUBLES.push({ sector: 25, multiplier: 2, score: 50, label: 'D25' });

const ALL_DARTS: CheckoutDart[] = [...SINGLES, ...DOUBLES, ...TRIPLES];

// Precompute checkout routes for all possible remaining scores (2-170)
const checkoutTable = new Map<number, CheckoutRoute>();

function buildCheckoutTable(): void {
	// 1-dart checkouts (just a double)
	for (const d of DOUBLES) {
		if (!checkoutTable.has(d.score)) {
			checkoutTable.set(d.score, [d]);
		}
	}

	// 2-dart checkouts (any + double)
	for (const first of ALL_DARTS) {
		for (const finish of DOUBLES) {
			const total = first.score + finish.score;
			if (total >= 2 && total <= 170 && !checkoutTable.has(total)) {
				checkoutTable.set(total, [first, finish]);
			}
		}
	}

	// 3-dart checkouts (any + any + double)
	for (const first of ALL_DARTS) {
		for (const second of ALL_DARTS) {
			for (const finish of DOUBLES) {
				const total = first.score + second.score + finish.score;
				if (total >= 2 && total <= 170 && !checkoutTable.has(total)) {
					checkoutTable.set(total, [first, second, finish]);
				}
			}
		}
	}
}

buildCheckoutTable();

/**
 * Get the best checkout route for a given remaining score.
 * Returns null if no checkout is possible.
 */
export function getCheckoutRoute(remaining: number): CheckoutRoute | null {
	return checkoutTable.get(remaining) ?? null;
}

/**
 * Get a formatted string for a checkout route (e.g. "T20 T20 D25").
 */
export function formatCheckoutRoute(route: CheckoutRoute): string {
	return route.map((d) => d.label).join(' ');
}
