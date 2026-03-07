import type { Club } from '$lib/types/club.js';
import type { Player } from '$lib/types/club.js';
import type { Season, Match, Standing } from '$lib/types/league.js';

export interface ClubRepository {
	getAll(): Promise<Club[]>;
	getById(id: string): Promise<Club | null>;
	create(club: Omit<Club, 'id' | 'created_at' | 'updated_at'>): Promise<Club>;
	update(id: string, club: Partial<Omit<Club, 'id' | 'created_at' | 'updated_at'>>): Promise<Club | null>;
	delete(id: string): Promise<boolean>;
	search(query: string): Promise<Club[]>;
}

export interface PlayerRepository {
	getAll(): Promise<Player[]>;
	getByClubId(clubId: string): Promise<Player[]>;
	getById(id: string): Promise<Player | null>;
	create(player: Omit<Player, 'id' | 'created_at'>): Promise<Player>;
	update(id: string, player: Partial<Omit<Player, 'id' | 'created_at'>>): Promise<Player | null>;
	delete(id: string): Promise<boolean>;
}

export interface SeasonRepository {
	getAll(): Promise<Season[]>;
	getById(id: string): Promise<Season | null>;
	getActive(): Promise<Season | null>;
	create(season: Omit<Season, 'id'>): Promise<Season>;
	update(id: string, season: Partial<Omit<Season, 'id'>>): Promise<Season | null>;
	delete(id: string): Promise<boolean>;
	getClubIds(seasonId: string): Promise<string[]>;
	assignClub(seasonId: string, clubId: string): Promise<void>;
	removeClub(seasonId: string, clubId: string): Promise<void>;
}

export interface MatchRepository {
	getAll(): Promise<Match[]>;
	getBySeasonId(seasonId: string): Promise<Match[]>;
	getById(id: string): Promise<Match | null>;
	create(match: Omit<Match, 'id'>): Promise<Match>;
	update(id: string, match: Partial<Omit<Match, 'id'>>): Promise<Match | null>;
	delete(id: string): Promise<boolean>;
}

export interface StandingsService {
	getBySeasonId(seasonId: string): Promise<Standing[]>;
	recalculate(seasonId: string): Promise<Standing[]>;
}
