import { describe, it, expect } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import DrinkingProgressBar from '$lib/components/drinking/DrinkingProgressBar.svelte';

const baseProps = {
	club_id: 'club-1',
	club_name: 'Dart Club Alpha',
	short_name: 'DCA',
	has_crest: false,
	primary_color: '#e11d48',
	drink_count: 5,
	max_count: 10
};

describe('DrinkingProgressBar Component', () => {
	it('renders club short name', async () => {
		render(DrinkingProgressBar, { props: baseProps });
		const name = page.getByTestId('drinking-progress-name');
		await expect.element(name).toHaveTextContent('DCA');
	});

	it('renders drink count', async () => {
		render(DrinkingProgressBar, { props: baseProps });
		const count = page.getByTestId('drinking-progress-count');
		await expect.element(count).toHaveTextContent('5');
	});

	it('renders progress bar with correct width percentage', async () => {
		render(DrinkingProgressBar, { props: baseProps });
		const bar = page.getByTestId('drinking-progress-bar');
		await expect.element(bar).toBeVisible();
		const style = bar.element().getAttribute('style');
		expect(style).toContain('width: 50%');
	});

	it('renders full width for max count', async () => {
		render(DrinkingProgressBar, { props: { ...baseProps, drink_count: 10, max_count: 10 } });
		const bar = page.getByTestId('drinking-progress-bar');
		const style = bar.element().getAttribute('style');
		expect(style).toContain('width: 100%');
	});

	it('renders minimum width for zero count', async () => {
		render(DrinkingProgressBar, { props: { ...baseProps, drink_count: 0, max_count: 10 } });
		const bar = page.getByTestId('drinking-progress-bar');
		const style = bar.element().getAttribute('style');
		expect(style).toContain('width: 8%');
	});

	it('applies primary color to bar', async () => {
		render(DrinkingProgressBar, { props: baseProps });
		const bar = page.getByTestId('drinking-progress-bar');
		const style = bar.element().getAttribute('style');
		expect(style).toContain('background-color:');
		expect(style).toMatch(/background-color:\s*(#e11d48|rgb\(225,\s*29,\s*72\))/);
	});
});
