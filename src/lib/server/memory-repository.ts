import type { Club } from '$lib/types/club.js';
import type { Player } from '$lib/types/club.js';
import type { Season, Match, Standing } from '$lib/types/league.js';
import type { ClubRepository, PlayerRepository, SeasonRepository, MatchRepository, StandingsService } from './repository.js';

function generateId(): string {
	return crypto.randomUUID();
}

function now(): string {
	return new Date().toISOString();
}

export class InMemoryClubRepository implements ClubRepository {
	private clubs: Map<string, Club> = new Map();

	constructor(initial: Club[] = []) {
		for (const club of initial) {
			this.clubs.set(club.id, club);
		}
	}

	async getAll(): Promise<Club[]> {
		return [...this.clubs.values()].sort((a, b) => a.name.localeCompare(b.name));
	}

	async getById(id: string): Promise<Club | null> {
		return this.clubs.get(id) ?? null;
	}

	async create(data: Omit<Club, 'id' | 'created_at' | 'updated_at'>): Promise<Club> {
		const club: Club = {
			...data,
			id: generateId(),
			created_at: now(),
			updated_at: now()
		};
		this.clubs.set(club.id, club);
		return club;
	}

	async update(
		id: string,
		data: Partial<Omit<Club, 'id' | 'created_at' | 'updated_at'>>
	): Promise<Club | null> {
		const existing = this.clubs.get(id);
		if (!existing) return null;
		const updated: Club = { ...existing, ...data, updated_at: now() };
		this.clubs.set(id, updated);
		return updated;
	}

	async delete(id: string): Promise<boolean> {
		return this.clubs.delete(id);
	}

	async search(query: string): Promise<Club[]> {
		const q = query.toLowerCase();
		const all = await this.getAll();
		return all.filter(
			(c) =>
				c.name.toLowerCase().includes(q) ||
				c.short_name.toLowerCase().includes(q)
		);
	}
}

export class InMemoryPlayerRepository implements PlayerRepository {
	private players: Map<string, Player> = new Map();

	constructor(initial: Player[] = []) {
		for (const player of initial) {
			this.players.set(player.id, player);
		}
	}

	async getAll(): Promise<Player[]> {
		return [...this.players.values()].sort((a, b) =>
			a.last_name.localeCompare(b.last_name)
		);
	}

	async getByClubId(clubId: string): Promise<Player[]> {
		return [...this.players.values()]
			.filter((p) => p.club_id === clubId)
			.sort((a, b) => a.last_name.localeCompare(b.last_name));
	}

	async getById(id: string): Promise<Player | null> {
		return this.players.get(id) ?? null;
	}

	async create(data: Omit<Player, 'id' | 'created_at'>): Promise<Player> {
		const player: Player = {
			...data,
			id: generateId(),
			created_at: now()
		};
		this.players.set(player.id, player);
		return player;
	}

	async update(
		id: string,
		data: Partial<Omit<Player, 'id' | 'created_at'>>
	): Promise<Player | null> {
		const existing = this.players.get(id);
		if (!existing) return null;
		const updated: Player = { ...existing, ...data };
		this.players.set(id, updated);
		return updated;
	}

	async delete(id: string): Promise<boolean> {
		return this.players.delete(id);
	}
}

export class InMemorySeasonRepository implements SeasonRepository {
	private seasons: Map<string, Season> = new Map();
	private seasonClubs: Map<string, Set<string>> = new Map();

	constructor(initial: Season[] = [], clubAssignments: Record<string, string[]> = {}) {
		for (const season of initial) {
			this.seasons.set(season.id, season);
		}
		for (const [seasonId, clubIds] of Object.entries(clubAssignments)) {
			this.seasonClubs.set(seasonId, new Set(clubIds));
		}
	}

	async getAll(): Promise<Season[]> {
		return [...this.seasons.values()].sort((a, b) => a.name.localeCompare(b.name));
	}

	async getById(id: string): Promise<Season | null> {
		return this.seasons.get(id) ?? null;
	}

	async getActive(): Promise<Season | null> {
		return [...this.seasons.values()].find((s) => s.is_active) ?? null;
	}

	async create(data: Omit<Season, 'id'>): Promise<Season> {
		const season: Season = { ...data, id: generateId() };
		this.seasons.set(season.id, season);
		this.seasonClubs.set(season.id, new Set());
		return season;
	}

	async update(id: string, data: Partial<Omit<Season, 'id'>>): Promise<Season | null> {
		const existing = this.seasons.get(id);
		if (!existing) return null;
		const updated: Season = { ...existing, ...data };
		this.seasons.set(id, updated);
		return updated;
	}

	async delete(id: string): Promise<boolean> {
		this.seasonClubs.delete(id);
		return this.seasons.delete(id);
	}

	async getClubIds(seasonId: string): Promise<string[]> {
		return [...(this.seasonClubs.get(seasonId) ?? [])];
	}

	async assignClub(seasonId: string, clubId: string): Promise<void> {
		if (!this.seasonClubs.has(seasonId)) {
			this.seasonClubs.set(seasonId, new Set());
		}
		this.seasonClubs.get(seasonId)!.add(clubId);
	}

	async removeClub(seasonId: string, clubId: string): Promise<void> {
		this.seasonClubs.get(seasonId)?.delete(clubId);
	}
}

export class InMemoryMatchRepository implements MatchRepository {
	private matches: Map<string, Match> = new Map();

	constructor(initial: Match[] = []) {
		for (const match of initial) {
			this.matches.set(match.id, match);
		}
	}

	async getAll(): Promise<Match[]> {
		return [...this.matches.values()];
	}

	async getBySeasonId(seasonId: string): Promise<Match[]> {
		return [...this.matches.values()].filter((m) => m.season_id === seasonId);
	}

	async getById(id: string): Promise<Match | null> {
		return this.matches.get(id) ?? null;
	}

	async create(data: Omit<Match, 'id'>): Promise<Match> {
		const match: Match = { ...data, id: generateId() };
		this.matches.set(match.id, match);
		return match;
	}

	async update(id: string, data: Partial<Omit<Match, 'id'>>): Promise<Match | null> {
		const existing = this.matches.get(id);
		if (!existing) return null;
		const updated: Match = { ...existing, ...data };
		this.matches.set(id, updated);
		return updated;
	}

	async delete(id: string): Promise<boolean> {
		return this.matches.delete(id);
	}
}

export class InMemoryStandingsService implements StandingsService {
	constructor(
		private matchRepo: MatchRepository,
		private seasonRepo: SeasonRepository,
		private clubRepo: ClubRepository
	) {}

	async getBySeasonId(seasonId: string): Promise<Standing[]> {
		return this.recalculate(seasonId);
	}

	async recalculate(seasonId: string): Promise<Standing[]> {
		const clubIds = await this.seasonRepo.getClubIds(seasonId);
		const matches = await this.matchRepo.getBySeasonId(seasonId);
		const completedMatches = matches.filter((m) => m.status === 'completed');

		const standingsMap = new Map<string, Standing>();

		for (const clubId of clubIds) {
			const club = await this.clubRepo.getById(clubId);
			if (!club) continue;
			standingsMap.set(clubId, {
				season_id: seasonId,
				club_id: clubId,
				club_name: club.name,
				short_name: club.short_name,
				crest_url: club.crest_url,
				played: 0,
				won: 0,
				drawn: 0,
				lost: 0,
				legs_for: 0,
				legs_against: 0,
				points: 0
			});
		}

		for (const match of completedMatches) {
			const home = standingsMap.get(match.home_club.id);
			const away = standingsMap.get(match.away_club.id);
			if (!home || !away) continue;

			home.played++;
			away.played++;
			home.legs_for += match.home_legs_won;
			home.legs_against += match.away_legs_won;
			away.legs_for += match.away_legs_won;
			away.legs_against += match.home_legs_won;

			if (match.home_legs_won > match.away_legs_won) {
				home.won++;
				home.points += 2;
				away.lost++;
			} else if (match.away_legs_won > match.home_legs_won) {
				away.won++;
				away.points += 2;
				home.lost++;
			} else {
				home.drawn++;
				away.drawn++;
				home.points += 1;
				away.points += 1;
			}
		}

		return [...standingsMap.values()].sort((a, b) => {
			if (b.points !== a.points) return b.points - a.points;
			const aDiff = a.legs_for - a.legs_against;
			const bDiff = b.legs_for - b.legs_against;
			if (bDiff !== aDiff) return bDiff - aDiff;
			return b.legs_for - a.legs_for;
		});
	}
}
