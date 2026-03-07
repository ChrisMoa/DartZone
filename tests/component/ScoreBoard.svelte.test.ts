import { describe, it, expect } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import ScoreBoard from '$lib/components/scoring/ScoreBoard.svelte';
import { createGameState } from '$lib/stores/game.svelte.js';
import type { Player } from '$lib/types/club.js';

const homePlayer: Player = {
	id: 'p1',
	club_id: 'c1',
	first_name: 'Max',
	last_name: 'Mueller',
	nickname: 'The Hammer',
	created_at: '2025-01-01T00:00:00.000Z'
};

const awayPlayer: Player = {
	id: 'p2',
	club_id: 'c2',
	first_name: 'Jan',
	last_name: 'Fischer',
	nickname: null,
	created_at: '2025-01-01T00:00:00.000Z'
};

function createTestGame() {
	return createGameState({
		match_id: 'match-1',
		leg_number: 1,
		home_player: homePlayer,
		away_player: awayPlayer,
		starting_score: 501
	});
}

describe('ScoreBoard Component', () => {
	it('displays both player names', async () => {
		const game = createTestGame();
		render(ScoreBoard, { props: { game } });

		const homeName = page.getByTestId('scoreboard-home-name');
		const awayName = page.getByTestId('scoreboard-away-name');
		await expect.element(homeName).toHaveTextContent('Max Mueller');
		await expect.element(awayName).toHaveTextContent('Jan Fischer');
	});

	it('displays starting scores for both players', async () => {
		const game = createTestGame();
		render(ScoreBoard, { props: { game } });

		const homeRemaining = page.getByTestId('scoreboard-home-remaining');
		const awayRemaining = page.getByTestId('scoreboard-away-remaining');
		await expect.element(homeRemaining).toHaveTextContent('501');
		await expect.element(awayRemaining).toHaveTextContent('501');
	});

	it('highlights the active player', async () => {
		const game = createTestGame();
		render(ScoreBoard, { props: { game } });

		const homePanel = page.getByTestId('scoreboard-home');
		// Home player starts, so home panel should have primary styling
		const homeEl = homePanel.element();
		expect(homeEl.className).toContain('bg-primary');
	});

	it('shows updated score after a throw', async () => {
		const game = createTestGame();
		render(ScoreBoard, { props: { game } });

		// Register a T20 (60 points)
		game.registerThrow(20, 3);

		const homeRemaining = page.getByTestId('scoreboard-home-remaining');
		await expect.element(homeRemaining).toHaveTextContent('441');
	});

	it('shows checkout badge when game is completed', async () => {
		const game = createTestState501Checkout();
		render(ScoreBoard, { props: { game } });

		const badge = page.getByTestId('scoreboard-completed');
		await expect.element(badge).toBeVisible();
	});
});

function createTestState501Checkout() {
	const game = createGameState({
		match_id: 'match-1',
		leg_number: 1,
		home_player: homePlayer,
		away_player: awayPlayer,
		starting_score: 32
	});
	// Checkout with D16
	game.registerThrow(16, 2);
	return game;
}
