import { describe, it, expect } from 'vitest';
import { getCheckoutRoute, getCheckoutRoutes, formatCheckoutRoute } from '$lib/utils/checkout.js';

describe('Checkout Route Calculator', () => {
	describe('getCheckoutRoute', () => {
		it('returns null for impossible scores', () => {
			expect(getCheckoutRoute(0)).toBeNull();
			expect(getCheckoutRoute(1)).toBeNull();
			expect(getCheckoutRoute(169)).toBeNull();
			expect(getCheckoutRoute(171)).toBeNull();
			expect(getCheckoutRoute(200)).toBeNull();
		});

		it('returns 1-dart checkout for D1 (2)', () => {
			const route = getCheckoutRoute(2);
			expect(route).not.toBeNull();
			expect(route!.length).toBe(1);
			expect(route![0].sector).toBe(1);
			expect(route![0].multiplier).toBe(2);
			expect(route![0].score).toBe(2);
		});

		it('returns 1-dart checkout for D20 (40)', () => {
			const route = getCheckoutRoute(40);
			expect(route).not.toBeNull();
			expect(route!.length).toBe(1);
			expect(route![0].sector).toBe(20);
			expect(route![0].multiplier).toBe(2);
		});

		it('returns 1-dart checkout for D25/Bullseye (50)', () => {
			const route = getCheckoutRoute(50);
			expect(route).not.toBeNull();
			expect(route!.length).toBe(1);
			expect(route![0].sector).toBe(25);
			expect(route![0].multiplier).toBe(2);
		});

		it('returns checkout for 170 (T20 T20 D25)', () => {
			const route = getCheckoutRoute(170);
			expect(route).not.toBeNull();
			expect(route!.length).toBe(3);
			const total = route!.reduce((sum, d) => sum + d.score, 0);
			expect(total).toBe(170);
			// Must end on a double
			expect(route![route!.length - 1].multiplier).toBe(2);
		});

		it('returns checkout for 100', () => {
			const route = getCheckoutRoute(100);
			expect(route).not.toBeNull();
			const total = route!.reduce((sum, d) => sum + d.score, 0);
			expect(total).toBe(100);
			expect(route![route!.length - 1].multiplier).toBe(2);
		});

		it('returns checkout for 160', () => {
			const route = getCheckoutRoute(160);
			expect(route).not.toBeNull();
			const total = route!.reduce((sum, d) => sum + d.score, 0);
			expect(total).toBe(160);
			expect(route![route!.length - 1].multiplier).toBe(2);
		});

		it('returns checkout for 161', () => {
			const route = getCheckoutRoute(161);
			expect(route).not.toBeNull();
			const total = route!.reduce((sum, d) => sum + d.score, 0);
			expect(total).toBe(161);
			expect(route![route!.length - 1].multiplier).toBe(2);
		});

		it('returns null for 168 (impossible)', () => {
			expect(getCheckoutRoute(168)).toBeNull();
		});

		it('all checkouts end on a double', () => {
			for (let remaining = 2; remaining <= 170; remaining++) {
				const route = getCheckoutRoute(remaining);
				if (route) {
					const lastDart = route[route.length - 1];
					expect(lastDart.multiplier).toBe(2);
					const total = route.reduce((sum, d) => sum + d.score, 0);
					expect(total).toBe(remaining);
				}
			}
		});

		it('returns checkout for common scores and null for impossible ones', () => {
			// Impossible checkouts: 169 (T20+T19+D16=132 not enough combos), 168, 166, 165, 163, 162, 159
			const impossible = [0, 1, 159, 162, 163, 165, 166, 168, 169];
			for (let i = 2; i <= 170; i++) {
				const route = getCheckoutRoute(i);
				if (impossible.includes(i)) {
					expect(route, `Score ${i} should be impossible`).toBeNull();
				} else {
					expect(route, `Score ${i} should have a checkout`).not.toBeNull();
				}
			}
		});
	});

	describe('getCheckoutRoutes (multiple routes)', () => {
		it('returns empty array for impossible scores', () => {
			expect(getCheckoutRoutes(0)).toEqual([]);
			expect(getCheckoutRoutes(1)).toEqual([]);
			expect(getCheckoutRoutes(169)).toEqual([]);
			expect(getCheckoutRoutes(171)).toEqual([]);
		});

		it('returns 1 route for D1 (2) - only one way', () => {
			const routes = getCheckoutRoutes(2);
			expect(routes.length).toBe(1);
			expect(routes[0].length).toBe(1);
			expect(routes[0][0].label).toBe('D1');
		});

		it('returns multiple routes for scores with alternatives', () => {
			const routes = getCheckoutRoutes(60);
			expect(routes.length).toBeGreaterThan(1);
			expect(routes.length).toBeLessThanOrEqual(3);
		});

		it('respects maxRoutes parameter', () => {
			const routes1 = getCheckoutRoutes(100, 1);
			expect(routes1.length).toBe(1);

			const routes5 = getCheckoutRoutes(100, 5);
			expect(routes5.length).toBeLessThanOrEqual(5);
			expect(routes5.length).toBeGreaterThanOrEqual(1);
		});

		it('sorts routes by fewest darts first', () => {
			const routes = getCheckoutRoutes(40, 3);
			// D20 (1-dart) should come before any 2-dart route
			expect(routes[0].length).toBe(1);
			for (let i = 1; i < routes.length; i++) {
				expect(routes[i].length).toBeGreaterThanOrEqual(routes[i - 1].length);
			}
		});

		it('all routes end on a double', () => {
			for (let remaining = 2; remaining <= 170; remaining++) {
				const routes = getCheckoutRoutes(remaining);
				for (const route of routes) {
					const lastDart = route[route.length - 1];
					expect(lastDart.multiplier, `Score ${remaining}: route should end on double`).toBe(2);
					const total = route.reduce((sum, d) => sum + d.score, 0);
					expect(total, `Score ${remaining}: route total should match`).toBe(remaining);
				}
			}
		});

		it('returns no duplicate routes', () => {
			for (let remaining = 2; remaining <= 170; remaining++) {
				const routes = getCheckoutRoutes(remaining);
				const labels = routes.map((r) => r.map((d) => d.label).join(' '));
				const unique = new Set(labels);
				expect(unique.size, `Score ${remaining}: routes should be unique`).toBe(labels.length);
			}
		});

		it('first route matches getCheckoutRoute', () => {
			for (let remaining = 2; remaining <= 170; remaining++) {
				const single = getCheckoutRoute(remaining);
				const multiple = getCheckoutRoutes(remaining);
				if (single === null) {
					expect(multiple).toEqual([]);
				} else {
					expect(formatCheckoutRoute(multiple[0])).toBe(formatCheckoutRoute(single));
				}
			}
		});
	});

	describe('formatCheckoutRoute', () => {
		it('formats a 1-dart checkout', () => {
			const route = getCheckoutRoute(40)!;
			expect(formatCheckoutRoute(route)).toBe('D20');
		});

		it('formats a multi-dart checkout', () => {
			const route = getCheckoutRoute(170)!;
			const formatted = formatCheckoutRoute(route);
			expect(formatted).toContain('D');
			expect(formatted.split(' ').length).toBe(3);
		});
	});
});
