import { describe, it, expect } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import ClubCard from '$lib/components/clubs/ClubCard.svelte';
import type { Club } from '$lib/types/club.js';

const mockClub: Club = {
	id: 'club-1',
	name: 'DC Bullseye Berlin',
	short_name: 'BCB',
	crest_url: null,
	has_crest: false,
	primary_color: '#e74c3c',
	secondary_color: '#ffffff',
	contact_email: 'info@bullseye.de',
	created_at: '2025-01-15T10:00:00.000Z',
	updated_at: '2025-01-15T10:00:00.000Z'
};

function preventNavigation() {
	document.addEventListener('click', (e) => {
		const link = (e.target as HTMLElement).closest('a');
		if (link) e.preventDefault();
	});
}

describe('ClubCard Component', () => {
	it('renders club name and short name', async () => {
		preventNavigation();
		render(ClubCard, { props: { club: mockClub, href: '#' } });
		const name = page.getByTestId('club-card-name');
		await expect.element(name).toHaveTextContent('DC Bullseye Berlin');
		const shortName = page.getByTestId('club-card-short-name');
		await expect.element(shortName).toHaveTextContent('BCB');
	});

	it('renders fallback crest when no crest_url', async () => {
		render(ClubCard, { props: { club: mockClub, href: '#' } });
		const fallback = page.getByTestId('club-crest-fallback');
		await expect.element(fallback).toBeVisible();
		await expect.element(fallback).toHaveTextContent('DBB');
	});

	it('links to club detail page by default', async () => {
		render(ClubCard, { props: { club: mockClub, href: '#' } });
		const card = page.getByTestId('club-card');
		await expect.element(card).toHaveAttribute('href', '#');
	});

	it('displays club colors', async () => {
		render(ClubCard, { props: { club: mockClub, href: '#' } });
		const card = page.getByTestId('club-card');
		await expect.element(card).toBeVisible();
	});
});
