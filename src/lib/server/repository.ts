import type { Club } from '$lib/types/club.js';
import type { Player } from '$lib/types/club.js';
import type { Tournament, Match, Standing } from '$lib/types/league.js';

export interface ClubRepository {
	getAll(): Promise<Club[]>;
	getById(id: string): Promise<Club | null>;
	create(club: Omit<Club, 'id' | 'created_at' | 'updated_at' | 'has_crest'>): Promise<Club>;
	update(id: string, club: Partial<Omit<Club, 'id' | 'created_at' | 'updated_at' | 'has_crest'>>): Promise<Club | null>;
	delete(id: string): Promise<boolean>;
	search(query: string): Promise<Club[]>;
	getCrestData(id: string): Promise<{ data: Buffer; mime: string } | null>;
	setCrestData(id: string, data: Buffer, mime: string): Promise<boolean>;
	removeCrestData(id: string): Promise<boolean>;
}

export interface PlayerRepository {
	getAll(): Promise<Player[]>;
	getByClubId(clubId: string): Promise<Player[]>;
	getById(id: string): Promise<Player | null>;
	create(player: Omit<Player, 'id' | 'created_at'>): Promise<Player>;
	update(id: string, player: Partial<Omit<Player, 'id' | 'created_at'>>): Promise<Player | null>;
	delete(id: string): Promise<boolean>;
}

export interface TournamentRepository {
	getAll(): Promise<Tournament[]>;
	getById(id: string): Promise<Tournament | null>;
	getActive(): Promise<Tournament | null>;
	create(tournament: Omit<Tournament, 'id' | 'has_organizer_logo'>): Promise<Tournament>;
	update(id: string, tournament: Partial<Omit<Tournament, 'id' | 'has_organizer_logo'>>): Promise<Tournament | null>;
	delete(id: string): Promise<boolean>;
	getClubIds(tournamentId: string): Promise<string[]>;
	assignClub(tournamentId: string, clubId: string): Promise<void>;
	removeClub(tournamentId: string, clubId: string): Promise<void>;
	getLogoData(id: string): Promise<{ data: Buffer; mime: string } | null>;
	setLogoData(id: string, data: Buffer, mime: string): Promise<boolean>;
}

export interface MatchRepository {
	getAll(): Promise<Match[]>;
	getByTournamentId(tournamentId: string): Promise<Match[]>;
	getById(id: string): Promise<Match | null>;
	create(match: Omit<Match, 'id'>): Promise<Match>;
	update(id: string, match: Partial<Omit<Match, 'id'>>): Promise<Match | null>;
	delete(id: string): Promise<boolean>;
}

export interface StandingsService {
	getByTournamentId(tournamentId: string): Promise<Standing[]>;
	recalculate(tournamentId: string): Promise<Standing[]>;
}
