import { describe, it, expect } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import PlayerStats from '$lib/components/stats/PlayerStats.svelte';
import type { PlayerOverallStats } from '$lib/utils/statistics.js';

const mockStats: PlayerOverallStats = {
	player_id: 'player-1',
	player_name: 'Max Mueller',
	matches_played: 5,
	total_darts: 150,
	overall_average: 65.3,
	best_average: 82.1,
	highest_score: 180,
	total_180s: 2,
	total_ton_plus: 12,
	checkout_percentage: 33.3,
	total_checkout_attempts: 9,
	total_checkout_successes: 3,
	sector_counts: { 20: 45, 19: 30, 18: 15 }
};

describe('PlayerStats Component', () => {
	it('renders player name', async () => {
		render(PlayerStats, { props: { stats: mockStats } });
		const name = page.getByTestId('player-stats-name');
		await expect.element(name).toHaveTextContent('Max Mueller');
	});

	it('displays matches played', async () => {
		render(PlayerStats, { props: { stats: mockStats } });
		const matches = page.getByTestId('player-stats-matches');
		await expect.element(matches).toHaveTextContent('5');
	});

	it('displays overall average', async () => {
		render(PlayerStats, { props: { stats: mockStats } });
		const avg = page.getByTestId('player-stats-average');
		await expect.element(avg).toHaveTextContent('65.3');
	});

	it('displays best average', async () => {
		render(PlayerStats, { props: { stats: mockStats } });
		const bestAvg = page.getByTestId('player-stats-best-avg');
		await expect.element(bestAvg).toHaveTextContent('82.1');
	});

	it('displays highest score', async () => {
		render(PlayerStats, { props: { stats: mockStats } });
		const highest = page.getByTestId('player-stats-highest');
		await expect.element(highest).toHaveTextContent('180');
	});

	it('displays 180s count', async () => {
		render(PlayerStats, { props: { stats: mockStats } });
		const count = page.getByTestId('player-stats-180s');
		await expect.element(count).toHaveTextContent('2');
	});

	it('displays checkout percentage', async () => {
		render(PlayerStats, { props: { stats: mockStats } });
		const checkout = page.getByTestId('player-stats-checkout');
		await expect.element(checkout).toHaveTextContent('33.3%');
	});

	it('displays total darts thrown', async () => {
		render(PlayerStats, { props: { stats: mockStats } });
		const darts = page.getByTestId('player-stats-darts');
		await expect.element(darts).toHaveTextContent('150');
	});

	it('shows zero stats for empty player', async () => {
		const emptyStats: PlayerOverallStats = {
			...mockStats,
			matches_played: 0,
			total_darts: 0,
			overall_average: 0,
			best_average: 0,
			highest_score: 0,
			total_180s: 0,
			total_ton_plus: 0,
			checkout_percentage: 0,
			total_checkout_attempts: 0,
			total_checkout_successes: 0
		};
		render(PlayerStats, { props: { stats: emptyStats } });
		const matches = page.getByTestId('player-stats-matches');
		await expect.element(matches).toHaveTextContent('0');
		const avg = page.getByTestId('player-stats-average');
		await expect.element(avg).toHaveTextContent('0.0');
	});
});
