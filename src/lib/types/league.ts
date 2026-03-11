import type { Club } from './club.js';

export interface Tournament {
	id: string;
	name: string;
	game_mode: '501' | '301' | 'cricket';
	format: 'round_robin' | 'knockout';
	legs_per_set: number;
	sets_per_match: number;
	start_date: string | null;
	end_date: string | null;
	is_active: boolean;
	organizer_name: string | null;
	has_organizer_logo: boolean;
	organizer_contact: string | null;
	organizer_note: string | null;
}

export interface Match {
	id: string;
	tournament_id: string;
	home_club: Club;
	away_club: Club;
	round: string | null;
	scheduled_at: string | null;
	status: 'scheduled' | 'in_progress' | 'completed';
	home_legs_won: number;
	away_legs_won: number;
	completed_at: string | null;
}

export interface Standing {
	tournament_id: string;
	club_id: string;
	club_name: string;
	short_name: string;
	crest_url: string | null;
	has_crest: boolean;
	played: number;
	won: number;
	drawn: number;
	lost: number;
	legs_for: number;
	legs_against: number;
	points: number;
}
