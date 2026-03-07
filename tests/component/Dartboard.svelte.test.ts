import { describe, it, expect, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import Dartboard from '$lib/components/dartboard/Dartboard.svelte';

describe('Dartboard Component', () => {
	it('renders an SVG element', async () => {
		render(Dartboard, { props: { size: 400 } });
		const svg = page.getByTestId('dartboard');
		await expect.element(svg).toBeVisible();
	});

	it('renders all sector paths (20 sectors x 4 rings + bull + bullseye = 82 clickable elements)', async () => {
		render(Dartboard, { props: { size: 400 } });
		const sectors = page.getByRole('button');
		const elements = sectors.elements();
		expect(elements.length).toBeGreaterThanOrEqual(82);
	});

	it('dispatches hit event with correct data when T20 sector is clicked', async () => {
		const hitSpy = vi.fn();
		render(Dartboard, {
			props: { size: 400, onhit: hitSpy }
		});
		const t20 = page.elementLocator(
			document.querySelector('[data-sector="20"][data-multiplier="3"]')!
		);
		await t20.click();
		expect(hitSpy).toHaveBeenCalledWith({ sector: 20, multiplier: 3, score: 60 });
	});

	it('dispatches hit event for bullseye click', async () => {
		const hitSpy = vi.fn();
		render(Dartboard, {
			props: { size: 400, onhit: hitSpy }
		});
		const bullseye = page.elementLocator(
			document.querySelector('[data-sector="25"][data-multiplier="2"]')!
		);
		await bullseye.click();
		expect(hitSpy).toHaveBeenCalledWith({ sector: 25, multiplier: 2, score: 50 });
	});

	it('does not dispatch events when disabled', async () => {
		const hitSpy = vi.fn();
		render(Dartboard, {
			props: { size: 400, disabled: true, onhit: hitSpy }
		});
		const bullseye = page.elementLocator(
			document.querySelector('[data-sector="25"][data-multiplier="2"]')!
		);
		await bullseye.click({ force: true });
		expect(hitSpy).not.toHaveBeenCalled();
	});
});
