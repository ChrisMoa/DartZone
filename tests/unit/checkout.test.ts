import { describe, it, expect } from 'vitest';
import { getCheckoutRoute, formatCheckoutRoute } from '$lib/utils/checkout.js';

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
