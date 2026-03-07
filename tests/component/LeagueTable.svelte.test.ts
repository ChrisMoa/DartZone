import { describe, it, expect } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import LeagueTable from '$lib/components/league/LeagueTable.svelte';
import type { Standing } from '$lib/types/league.js';

const mockStandings: Standing[] = [
	{
		season_id: 's1',
		club_id: 'c1',
		club_name: 'DC Bullseye Berlin',
		short_name: 'BCB',
		crest_url: null,
		played: 2,
		won: 2,
		drawn: 0,
		lost: 0,
		legs_for: 6,
		legs_against: 2,
		points: 4
	},
	{
		season_id: 's1',
		club_id: 'c2',
		club_name: 'Triple Twenty Hamburg',
		short_name: 'TTH',
		crest_url: null,
		played: 2,
		won: 1,
		drawn: 0,
		lost: 1,
		legs_for: 4,
		legs_against: 4,
		points: 2
	},
	{
		season_id: 's1',
		club_id: 'c3',
		club_name: 'Dart Devils Muenchen',
		short_name: 'DDM',
		crest_url: null,
		played: 2,
		won: 0,
		drawn: 1,
		lost: 1,
		legs_for: 3,
		legs_against: 5,
		points: 1
	},
	{
		season_id: 's1',
		club_id: 'c4',
		club_name: 'Arrow Kings Koeln',
		short_name: 'AKK',
		crest_url: null,
		played: 2,
		won: 0,
		drawn: 1,
		lost: 1,
		legs_for: 3,
		legs_against: 5,
		points: 1
	}
];

describe('LeagueTable Component', () => {
	it('renders the table with correct number of rows', async () => {
		render(LeagueTable, { props: { standings: mockStandings } });
		const rows = page.getByTestId('league-table-row');
		const elements = rows.elements();
		expect(elements.length).toBe(4);
	});

	it('displays club names', async () => {
		render(LeagueTable, { props: { standings: mockStandings } });
		const names = page.getByTestId('standing-club-name');
		const elements = names.elements();
		expect(elements[0].textContent).toBe('DC Bullseye Berlin');
		expect(elements[1].textContent).toBe('Triple Twenty Hamburg');
	});

	it('displays correct points', async () => {
		render(LeagueTable, { props: { standings: mockStandings } });
		const points = page.getByTestId('standing-points');
		const elements = points.elements();
		expect(elements[0].textContent).toBe('4');
		expect(elements[1].textContent).toBe('2');
		expect(elements[2].textContent).toBe('1');
	});

	it('displays correct columns (Sp, S, U, N, Pkt)', async () => {
		render(LeagueTable, { props: { standings: mockStandings } });
		const table = page.getByTestId('league-table');
		await expect.element(table).toBeVisible();

		// Check first row stats
		const played = page.getByTestId('standing-played').elements();
		const won = page.getByTestId('standing-won').elements();
		const drawn = page.getByTestId('standing-drawn').elements();
		const lost = page.getByTestId('standing-lost').elements();

		expect(played[0].textContent).toBe('2');
		expect(won[0].textContent).toBe('2');
		expect(drawn[0].textContent).toBe('0');
		expect(lost[0].textContent).toBe('0');
	});
});
