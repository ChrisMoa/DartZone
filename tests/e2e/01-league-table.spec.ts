import { test, expect } from '@playwright/test';

test.describe.serial('Tournament Table', () => {
	test('dashboard shows active tournament standings', async ({ page }) => {
		await page.goto('/');
		await expect(page.getByTestId('league-table')).toBeVisible();
		await expect(page.getByTestId('league-table-row')).toHaveCount(4);
	});

	test('tournament detail page shows standings table', async ({ page }) => {
		await page.goto('/tournaments');
		await page.getByTestId('tournament-card').first().click();
		await expect(page.getByTestId('league-table')).toBeVisible();
		await expect(page.getByTestId('league-table-row')).toHaveCount(4);
	});

	test('standings reflect completed match results', async ({ page }) => {
		await page.goto('/tournaments');
		await page.getByTestId('tournament-card').first().click();

		const points = page.getByTestId('standing-points');
		const pointValues = await points.allTextContents();
		expect(pointValues.some((p) => parseInt(p) > 0)).toBe(true);
	});

	test('matches are displayed on tournament detail', async ({ page }) => {
		await page.goto('/tournaments');
		await page.getByTestId('tournament-card').first().click();
		await expect(page.getByTestId('match-list')).toBeVisible();
		await expect(page.getByTestId('match-card')).toHaveCount(4);
	});
});
