import { test, expect } from '@playwright/test';

test.describe.serial('League Table', () => {
	test('dashboard shows active season standings', async ({ page }) => {
		await page.goto('/');
		await expect(page.getByTestId('league-table')).toBeVisible();
		await expect(page.getByTestId('league-table-row')).toHaveCount(4);
	});

	test('season detail page shows standings table', async ({ page }) => {
		await page.goto('/seasons');
		await page.getByTestId('season-card').first().click();
		await expect(page.getByTestId('league-table')).toBeVisible();
		await expect(page.getByTestId('league-table-row')).toHaveCount(4);
	});

	test('standings reflect completed match results', async ({ page }) => {
		await page.goto('/seasons');
		await page.getByTestId('season-card').first().click();

		// BCB won match-1 (3:1 vs TTH), so should have points
		const points = page.getByTestId('standing-points');
		const pointValues = await points.allTextContents();
		// At least one club should have points > 0
		expect(pointValues.some((p) => parseInt(p) > 0)).toBe(true);
	});

	test('matches are displayed on season detail', async ({ page }) => {
		await page.goto('/seasons');
		await page.getByTestId('season-card').first().click();
		await expect(page.getByTestId('match-list')).toBeVisible();
		await expect(page.getByTestId('match-card')).toHaveCount(4);
	});
});
