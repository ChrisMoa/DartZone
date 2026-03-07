import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	testDir: 'tests/e2e',
	fullyParallel: false,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: 1,
	reporter: 'html',
	use: {
		baseURL: 'http://localhost:4173',
		trace: 'on-first-retry'
	},
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] }
		}
	],
	webServer: {
		command: 'DARTZONE_DB_PATH=data/test.db npm run build && DARTZONE_DB_PATH=data/test.db npm run preview',
		port: 4173,
		reuseExistingServer: !process.env.CI
	},
	globalSetup: './tests/e2e/global-setup.ts'
});
