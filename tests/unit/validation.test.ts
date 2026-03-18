import { describe, it, expect } from 'vitest';
import { clubSchema, playerSchema, tournamentSchema } from '$lib/utils/validation.js';

describe('clubSchema', () => {
	it('accepts valid club data', () => {
		const result = clubSchema.safeParse({
			name: 'DC Bullseye Berlin',
			short_name: 'BCB',
			primary_color: '#e74c3c',
			secondary_color: '#ffffff',
			contact_email: 'info@bullseye.de',
			crest_url: null
		});
		expect(result.success).toBe(true);
	});

	it('accepts minimal valid data with defaults', () => {
		const result = clubSchema.safeParse({
			name: 'Test Club',
			short_name: 'TC'
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.primary_color).toBe('#1a5276');
			expect(result.data.secondary_color).toBe('#ffffff');
			expect(result.data.contact_email).toBeNull();
			expect(result.data.crest_url).toBeNull();
		}
	});

	it('rejects name shorter than 2 characters', () => {
		const result = clubSchema.safeParse({
			name: 'A',
			short_name: 'TC'
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues[0].message).toContain('mindestens 2');
		}
	});

	it('rejects name longer than 100 characters', () => {
		const result = clubSchema.safeParse({
			name: 'A'.repeat(101),
			short_name: 'TC'
		});
		expect(result.success).toBe(false);
	});

	it('rejects short_name shorter than 2 characters', () => {
		const result = clubSchema.safeParse({
			name: 'Test Club',
			short_name: 'T'
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues[0].message).toContain('mindestens 2');
		}
	});

	it('rejects short_name longer than 10 characters', () => {
		const result = clubSchema.safeParse({
			name: 'Test Club',
			short_name: 'TOOLONGNAME'
		});
		expect(result.success).toBe(false);
	});

	it('rejects invalid hex color', () => {
		const result = clubSchema.safeParse({
			name: 'Test Club',
			short_name: 'TC',
			primary_color: 'red'
		});
		expect(result.success).toBe(false);
	});

	it('rejects invalid email', () => {
		const result = clubSchema.safeParse({
			name: 'Test Club',
			short_name: 'TC',
			contact_email: 'not-an-email'
		});
		expect(result.success).toBe(false);
	});

	it('accepts null email', () => {
		const result = clubSchema.safeParse({
			name: 'Test Club',
			short_name: 'TC',
			contact_email: null
		});
		expect(result.success).toBe(true);
	});

	it('rejects missing name', () => {
		const result = clubSchema.safeParse({
			short_name: 'TC'
		});
		expect(result.success).toBe(false);
	});
});

describe('playerSchema', () => {
	it('accepts valid player data', () => {
		const result = playerSchema.safeParse({
			club_id: 'club-1',
			first_name: 'Max',
			last_name: 'Mueller',
			nickname: 'The Hammer'
		});
		expect(result.success).toBe(true);
	});

	it('requires first_name', () => {
		const result = playerSchema.safeParse({
			last_name: 'Mueller'
		});
		expect(result.success).toBe(false);
	});

	it('requires last_name', () => {
		const result = playerSchema.safeParse({
			first_name: 'Max'
		});
		expect(result.success).toBe(false);
	});

	it('accepts null nickname', () => {
		const result = playerSchema.safeParse({
			first_name: 'Max',
			last_name: 'Mueller',
			nickname: null
		});
		expect(result.success).toBe(true);
	});

	it('rejects nickname longer than 30 characters', () => {
		const result = playerSchema.safeParse({
			first_name: 'Max',
			last_name: 'Mueller',
			nickname: 'A'.repeat(31)
		});
		expect(result.success).toBe(false);
	});
});

describe('tournamentSchema', () => {
	it('accepts valid tournament data', () => {
		const result = tournamentSchema.safeParse({
			name: 'Fruehjahrscup 2026',
			game_mode: '501',
			format: 'round_robin',
			legs_per_set: 3,
			sets_per_match: 5,
			start_date: '2026-03-15',
			status: 'running'
		});
		expect(result.success).toBe(true);
	});

	it('accepts knockout format', () => {
		const result = tournamentSchema.safeParse({
			name: 'K.O. Cup',
			game_mode: '501',
			format: 'knockout',
			legs_per_set: 3,
			sets_per_match: 5
		});
		expect(result.success).toBe(true);
	});

	it('rejects invalid game_mode', () => {
		const result = tournamentSchema.safeParse({
			name: 'Test',
			game_mode: '701',
			format: 'round_robin',
			legs_per_set: 3,
			sets_per_match: 5
		});
		expect(result.success).toBe(false);
	});

	it('rejects invalid format', () => {
		const result = tournamentSchema.safeParse({
			name: 'Test',
			game_mode: '501',
			format: 'swiss',
			legs_per_set: 3,
			sets_per_match: 5
		});
		expect(result.success).toBe(false);
	});

	it('accepts null dates', () => {
		const result = tournamentSchema.safeParse({
			name: 'Test Tournament',
			game_mode: '301',
			format: 'round_robin',
			legs_per_set: 1,
			sets_per_match: 1
		});
		expect(result.success).toBe(true);
	});
});
