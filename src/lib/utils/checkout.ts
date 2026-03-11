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

// Precompute ALL checkout routes for each remaining score (2-170)
const allRoutesTable = new Map<number, CheckoutRoute[]>();

/** Score a route for sorting: fewer darts first, then prefer common doubles (D20, D16, D8). */
function routeScore(route: CheckoutRoute): number {
	const dartPenalty = route.length * 1000;
	const lastDart = route[route.length - 1];
	// Prefer common finishing doubles: D20(40), D16(32), D8(16), D10(20), D25(50)
	const preferredDoubles: Record<number, number> = { 40: 0, 32: 1, 16: 2, 20: 3, 50: 4 };
	const doublePenalty = preferredDoubles[lastDart.score] ?? 10;
	return dartPenalty + doublePenalty;
}

/** Create a unique key for a route to deduplicate. */
function routeKey(route: CheckoutRoute): string {
	return route.map((d) => d.label).join('-');
}

function buildAllRoutes(): void {
	const tempMap = new Map<number, Map<string, CheckoutRoute>>();

	function addRoute(total: number, route: CheckoutRoute) {
		if (total < 2 || total > 170) return;
		if (!tempMap.has(total)) tempMap.set(total, new Map());
		const key = routeKey(route);
		if (!tempMap.get(total)!.has(key)) {
			tempMap.get(total)!.set(key, route);
		}
	}

	// 1-dart checkouts (just a double)
	for (const d of DOUBLES) {
		addRoute(d.score, [d]);
	}

	// 2-dart checkouts (any + double)
	for (const first of ALL_DARTS) {
		for (const finish of DOUBLES) {
			addRoute(first.score + finish.score, [first, finish]);
		}
	}

	// 3-dart checkouts (any + any + double)
	for (const first of ALL_DARTS) {
		for (const second of ALL_DARTS) {
			for (const finish of DOUBLES) {
				addRoute(first.score + second.score + finish.score, [first, second, finish]);
			}
		}
	}

	// Sort and store
	for (const [total, routeMap] of tempMap) {
		const routes = [...routeMap.values()].sort((a, b) => routeScore(a) - routeScore(b));
		allRoutesTable.set(total, routes);
	}
}

buildAllRoutes();

/**
 * Get the best checkout route for a given remaining score.
 * Returns null if no checkout is possible.
 */
export function getCheckoutRoute(remaining: number): CheckoutRoute | null {
	const routes = allRoutesTable.get(remaining);
	return routes?.[0] ?? null;
}

/**
 * Get multiple checkout routes for a given remaining score, sorted by simplicity.
 * Returns an empty array if no checkout is possible.
 * @param remaining - The remaining score
 * @param maxRoutes - Maximum number of routes to return (default 3)
 */
export function getCheckoutRoutes(remaining: number, maxRoutes: number = 3): CheckoutRoute[] {
	const routes = allRoutesTable.get(remaining);
	if (!routes) return [];
	return routes.slice(0, maxRoutes);
}

/**
 * Get a formatted string for a checkout route (e.g. "T20 T20 D25").
 */
export function formatCheckoutRoute(route: CheckoutRoute): string {
	return route.map((d) => d.label).join(' ');
}
