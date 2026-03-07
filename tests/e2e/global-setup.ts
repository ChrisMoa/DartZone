import { existsSync, unlinkSync } from 'fs';

const TEST_DB_PATH = 'data/test.db';

export default function globalSetup() {
	// Remove the test database so the app starts fresh with seed data
	if (existsSync(TEST_DB_PATH)) {
		unlinkSync(TEST_DB_PATH);
	}
	// Also remove WAL/SHM files
	if (existsSync(`${TEST_DB_PATH}-wal`)) {
		unlinkSync(`${TEST_DB_PATH}-wal`);
	}
	if (existsSync(`${TEST_DB_PATH}-shm`)) {
		unlinkSync(`${TEST_DB_PATH}-shm`);
	}
}
