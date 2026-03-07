import type { Club } from '$lib/types/club.js';
import type { Player } from '$lib/types/club.js';
import type { Tournament, Match } from '$lib/types/league.js';

export const seedClubs: Omit<Club, 'has_crest'>[] = [
	{
		id: 'club-1',
		name: 'DC Bullseye Berlin',
		short_name: 'BCB',
		crest_url: null,
		primary_color: '#e74c3c',
		secondary_color: '#ffffff',
		contact_email: 'info@bullseye-berlin.de',
		created_at: '2025-01-15T10:00:00.000Z',
		updated_at: '2025-01-15T10:00:00.000Z'
	},
	{
		id: 'club-2',
		name: 'Triple Twenty Hamburg',
		short_name: 'TTH',
		crest_url: null,
		primary_color: '#2ecc71',
		secondary_color: '#1a1a1a',
		contact_email: 'kontakt@tt-hamburg.de',
		created_at: '2025-01-15T10:00:00.000Z',
		updated_at: '2025-01-15T10:00:00.000Z'
	},
	{
		id: 'club-3',
		name: 'Dart Devils Muenchen',
		short_name: 'DDM',
		crest_url: null,
		primary_color: '#9b59b6',
		secondary_color: '#f1c40f',
		contact_email: null,
		created_at: '2025-02-01T10:00:00.000Z',
		updated_at: '2025-02-01T10:00:00.000Z'
	},
	{
		id: 'club-4',
		name: 'Arrow Kings Koeln',
		short_name: 'AKK',
		crest_url: null,
		primary_color: '#3498db',
		secondary_color: '#ecf0f1',
		contact_email: 'info@arrow-kings.de',
		created_at: '2025-02-10T10:00:00.000Z',
		updated_at: '2025-02-10T10:00:00.000Z'
	}
];

export const seedPlayers: Player[] = [
	{ id: 'player-1', club_id: 'club-1', first_name: 'Max', last_name: 'Mueller', nickname: 'The Hammer', created_at: '2025-01-15T10:00:00.000Z' },
	{ id: 'player-2', club_id: 'club-1', first_name: 'Anna', last_name: 'Schmidt', nickname: null, created_at: '2025-01-15T10:00:00.000Z' },
	{ id: 'player-3', club_id: 'club-2', first_name: 'Jan', last_name: 'Fischer', nickname: 'Bullseye Jan', created_at: '2025-01-15T10:00:00.000Z' },
	{ id: 'player-4', club_id: 'club-2', first_name: 'Lisa', last_name: 'Weber', nickname: null, created_at: '2025-01-15T10:00:00.000Z' },
	{ id: 'player-5', club_id: 'club-3', first_name: 'Tom', last_name: 'Braun', nickname: 'Devil Tom', created_at: '2025-02-01T10:00:00.000Z' },
	{ id: 'player-6', club_id: 'club-3', first_name: 'Sarah', last_name: 'Klein', nickname: null, created_at: '2025-02-01T10:00:00.000Z' },
	{ id: 'player-7', club_id: 'club-4', first_name: 'Lukas', last_name: 'Wagner', nickname: 'King Lukas', created_at: '2025-02-10T10:00:00.000Z' },
	{ id: 'player-8', club_id: 'club-4', first_name: 'Emma', last_name: 'Becker', nickname: null, created_at: '2025-02-10T10:00:00.000Z' }
];

export const seedTournaments: Tournament[] = [
	{
		id: 'tournament-1',
		name: 'Fruehjahrscup 2026',
		game_mode: '501',
		format: 'round_robin',
		legs_per_set: 3,
		sets_per_match: 5,
		start_date: '2026-03-15',
		end_date: null,
		is_active: true
	}
];

export const seedTournamentClubs: Record<string, string[]> = {
	'tournament-1': ['club-1', 'club-2', 'club-3', 'club-4']
};

export const seedMatches: Match[] = [
	{
		id: 'match-1',
		tournament_id: 'tournament-1',
		home_club: seedClubs[0] as Club,
		away_club: seedClubs[1] as Club,
		round: null,
		scheduled_at: '2026-03-15T10:00:00.000Z',
		status: 'completed',
		home_legs_won: 3,
		away_legs_won: 1,
		completed_at: '2026-03-15T11:30:00.000Z'
	},
	{
		id: 'match-2',
		tournament_id: 'tournament-1',
		home_club: seedClubs[2] as Club,
		away_club: seedClubs[3] as Club,
		round: null,
		scheduled_at: '2026-03-15T10:00:00.000Z',
		status: 'completed',
		home_legs_won: 2,
		away_legs_won: 2,
		completed_at: '2026-03-15T11:00:00.000Z'
	},
	{
		id: 'match-3',
		tournament_id: 'tournament-1',
		home_club: seedClubs[1] as Club,
		away_club: seedClubs[2] as Club,
		round: null,
		scheduled_at: '2026-03-15T12:00:00.000Z',
		status: 'completed',
		home_legs_won: 3,
		away_legs_won: 2,
		completed_at: '2026-03-15T13:30:00.000Z'
	},
	{
		id: 'match-4',
		tournament_id: 'tournament-1',
		home_club: seedClubs[3] as Club,
		away_club: seedClubs[0] as Club,
		round: null,
		scheduled_at: '2026-03-15T14:00:00.000Z',
		status: 'scheduled',
		home_legs_won: 0,
		away_legs_won: 0,
		completed_at: null
	}
];
