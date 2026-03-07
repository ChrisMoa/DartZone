import { describe, it, expect } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import ClubForm from '$lib/components/clubs/ClubForm.svelte';
import type { Club } from '$lib/types/club.js';

const mockClub: Club = {
	id: 'club-1',
	name: 'DC Bullseye Berlin',
	short_name: 'BCB',
	crest_url: null,
	primary_color: '#e74c3c',
	secondary_color: '#ffffff',
	contact_email: 'info@bullseye.de',
	created_at: '2025-01-15T10:00:00.000Z',
	updated_at: '2025-01-15T10:00:00.000Z'
};

describe('ClubForm Component', () => {
	it('renders empty form for new club', async () => {
		render(ClubForm);
		const nameInput = page.getByTestId('club-form-name');
		await expect.element(nameInput).toHaveValue('');
		const shortNameInput = page.getByTestId('club-form-short-name');
		await expect.element(shortNameInput).toHaveValue('');
	});

	it('pre-fills form in edit mode', async () => {
		render(ClubForm, { props: { club: mockClub } });
		const nameInput = page.getByTestId('club-form-name');
		await expect.element(nameInput).toHaveValue('DC Bullseye Berlin');
		const shortNameInput = page.getByTestId('club-form-short-name');
		await expect.element(shortNameInput).toHaveValue('BCB');
	});

	it('shows submit button with correct label for new club', async () => {
		render(ClubForm);
		const submit = page.getByTestId('club-form-submit');
		await expect.element(submit).toHaveTextContent('Erstellen');
	});

	it('shows submit button with correct label for edit', async () => {
		render(ClubForm, { props: { club: mockClub } });
		const submit = page.getByTestId('club-form-submit');
		await expect.element(submit).toHaveTextContent('Speichern');
	});

	it('displays error messages when provided', async () => {
		render(ClubForm, {
			props: { errors: { name: 'Name ist erforderlich' } }
		});
		const error = page.getByTestId('error-name');
		await expect.element(error).toHaveTextContent('Name ist erforderlich');
	});
});
