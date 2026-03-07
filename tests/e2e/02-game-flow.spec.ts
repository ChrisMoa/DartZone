import { test, expect } from '@playwright/test';

test.describe.serial('Game Flow', () => {
	test('navigates to play page from season detail', async ({ page }) => {
		await page.goto('/seasons');
		await page.getByTestId('season-card').first().click();
		// match-4 is scheduled, should have a play button
		const playBtn = page.getByTestId('play-match-btn').first();
		await expect(playBtn).toBeVisible();
		await playBtn.click();
		await expect(page.getByTestId('game-page')).toBeVisible();
	});

	test('shows player selection before game starts', async ({ page }) => {
		await page.goto('/seasons');
		await page.getByTestId('season-card').first().click();
		await page.getByTestId('play-match-btn').first().click();
		await expect(page.getByTestId('player-selection')).toBeVisible();
		await expect(page.getByTestId('home-player-select')).toBeVisible();
		await expect(page.getByTestId('away-player-select')).toBeVisible();
	});

	test('starts game and shows scoreboard', async ({ page }) => {
		await page.goto('/seasons');
		await page.getByTestId('season-card').first().click();
		await page.getByTestId('play-match-btn').first().click();
		await page.getByTestId('start-game-btn').click();
		await expect(page.getByTestId('scoreboard')).toBeVisible();
		await expect(page.getByTestId('scoreboard-home-remaining')).toHaveText('501');
		await expect(page.getByTestId('scoreboard-away-remaining')).toHaveText('501');
	});

	test('registers a throw on dartboard click', async ({ page }) => {
		await page.goto('/seasons');
		await page.getByTestId('season-card').first().click();
		await page.getByTestId('play-match-btn').first().click();
		await page.getByTestId('start-game-btn').click();

		// Click on T20 sector (triple 20)
		const dartboard = page.getByTestId('dartboard');
		await expect(dartboard).toBeVisible();

		// Click a sector - we'll click the T20 area via data attributes
		const t20 = page.locator('[data-sector="20"][data-multiplier="3"]');
		await t20.click();

		// Score should decrease by 60
		await expect(page.getByTestId('scoreboard-home-remaining')).toHaveText('441');
	});

	test('undo restores previous score', async ({ page }) => {
		await page.goto('/seasons');
		await page.getByTestId('season-card').first().click();
		await page.getByTestId('play-match-btn').first().click();
		await page.getByTestId('start-game-btn').click();

		const t20 = page.locator('[data-sector="20"][data-multiplier="3"]');
		await t20.click();
		await expect(page.getByTestId('scoreboard-home-remaining')).toHaveText('441');

		await page.getByTestId('undo-btn').click();
		await expect(page.getByTestId('scoreboard-home-remaining')).toHaveText('501');
	});

	test('turn switches after 3 darts', async ({ page }) => {
		await page.goto('/seasons');
		await page.getByTestId('season-card').first().click();
		await page.getByTestId('play-match-btn').first().click();
		await page.getByTestId('start-game-btn').click();

		const s1 = page.locator('[data-sector="1"][data-multiplier="1"]').first();
		await s1.click(); // dart 1
		await s1.click(); // dart 2
		await s1.click(); // dart 3

		// After 3 darts, turn switches to away player
		// Home should be 501 - 3 = 498
		await expect(page.getByTestId('scoreboard-home-remaining')).toHaveText('498');
		// The turn indicator should show the away player
		const turnName = page.getByTestId('turn-player-name');
		await expect(turnName).toBeVisible();
	});
});
