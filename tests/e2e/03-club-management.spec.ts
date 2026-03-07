import { test, expect } from '@playwright/test';

test.describe.serial('Club Management', () => {
	test('club list page loads with seeded clubs', async ({ page }) => {
		await page.goto('/clubs');
		await expect(page.getByRole('heading', { name: 'Vereine' })).toBeVisible();
		await expect(page.getByTestId('club-list')).toBeVisible();
		await expect(page.getByTestId('club-card')).toHaveCount(4);
	});

	test('search clubs', async ({ page }) => {
		await page.goto('/clubs');
		await page.getByTestId('club-search').fill('Bullseye');
		await page.getByTestId('club-search').press('Enter');

		const cards = page.getByTestId('club-card');
		await expect(cards).toHaveCount(1);
		await expect(cards.first().getByTestId('club-card-name')).toContainText('Bullseye');
	});

	test('create new club flow', async ({ page }) => {
		await page.goto('/clubs');
		await page.getByTestId('new-club-btn').click();
		await expect(page.getByTestId('club-form')).toBeVisible();

		await page.getByTestId('club-form-name').fill('Testverein Dart');
		await page.getByTestId('club-form-short-name').fill('TVD');
		await page.getByTestId('club-form-email').fill('test@dartverein.de');
		await page.getByTestId('club-form-submit').click();

		await expect(page.getByTestId('club-detail-name')).toHaveText('Testverein Dart');
	});

	test('navigation between clubs list and detail', async ({ page }) => {
		await page.goto('/clubs');
		await page.getByTestId('club-card').first().click();
		await expect(page.getByTestId('club-detail-name')).toBeVisible();

		await page.getByText('Zurueck').click();
		await expect(page.getByTestId('club-list')).toBeVisible();
	});

	test('edit club flow', async ({ page }) => {
		await page.goto('/clubs');
		await page.getByTestId('club-card').first().click();
		await page.getByTestId('edit-club-btn').click();

		await expect(page.getByTestId('club-form')).toBeVisible();
		await page.getByTestId('club-form-name').fill('Umbenannter Verein');
		await page.getByTestId('club-form-submit').click();

		await expect(page.getByTestId('club-detail-name')).toHaveText('Umbenannter Verein');
	});

	test('delete club flow', async ({ page }) => {
		await page.goto('/clubs');
		const initialCount = await page.getByTestId('club-card').count();

		await page.getByTestId('club-card').first().click();
		await page.getByTestId('delete-club-btn').click();

		await expect(page).toHaveURL('/clubs');
		const newCount = await page.getByTestId('club-card').count();
		expect(newCount).toBeLessThan(initialCount);
	});
});
