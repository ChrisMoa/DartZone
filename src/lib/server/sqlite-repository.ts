import type Database from 'better-sqlite3';
import type { Club } from '$lib/types/club.js';
import type { Player } from '$lib/types/club.js';
import type { Season, Match, Standing } from '$lib/types/league.js';
import type {
	ClubRepository,
	PlayerRepository,
	SeasonRepository,
	MatchRepository,
	StandingsService
} from './repository.js';

function generateId(): string {
	return crypto.randomUUID();
}

function now(): string {
	return new Date().toISOString();
}

// --- Club Repository ---

export class SqliteClubRepository implements ClubRepository {
	constructor(private db: Database.Database) {}

	async getAll(): Promise<Club[]> {
		return this.db.prepare('SELECT * FROM clubs ORDER BY name').all() as Club[];
	}

	async getById(id: string): Promise<Club | null> {
		return (this.db.prepare('SELECT * FROM clubs WHERE id = ?').get(id) as Club) ?? null;
	}

	async create(data: Omit<Club, 'id' | 'created_at' | 'updated_at'>): Promise<Club> {
		const club: Club = { ...data, id: generateId(), created_at: now(), updated_at: now() };
		this.db
			.prepare(
				`INSERT INTO clubs (id, name, short_name, crest_url, primary_color, secondary_color, contact_email, created_at, updated_at)
				 VALUES (@id, @name, @short_name, @crest_url, @primary_color, @secondary_color, @contact_email, @created_at, @updated_at)`
			)
			.run(club);
		return club;
	}

	async update(
		id: string,
		data: Partial<Omit<Club, 'id' | 'created_at' | 'updated_at'>>
	): Promise<Club | null> {
		const existing = await this.getById(id);
		if (!existing) return null;
		const updated: Club = { ...existing, ...data, updated_at: now() };
		this.db
			.prepare(
				`UPDATE clubs SET name = @name, short_name = @short_name, crest_url = @crest_url,
				 primary_color = @primary_color, secondary_color = @secondary_color,
				 contact_email = @contact_email, updated_at = @updated_at WHERE id = @id`
			)
			.run(updated);
		return updated;
	}

	async delete(id: string): Promise<boolean> {
		const result = this.db.prepare('DELETE FROM clubs WHERE id = ?').run(id);
		return result.changes > 0;
	}

	async search(query: string): Promise<Club[]> {
		const q = `%${query.toLowerCase()}%`;
		return this.db
			.prepare(
				`SELECT * FROM clubs WHERE LOWER(name) LIKE ? OR LOWER(short_name) LIKE ? ORDER BY name`
			)
			.all(q, q) as Club[];
	}
}

// --- Player Repository ---

export class SqlitePlayerRepository implements PlayerRepository {
	constructor(private db: Database.Database) {}

	async getAll(): Promise<Player[]> {
		return this.db.prepare('SELECT * FROM players ORDER BY last_name').all() as Player[];
	}

	async getByClubId(clubId: string): Promise<Player[]> {
		return this.db
			.prepare('SELECT * FROM players WHERE club_id = ? ORDER BY last_name')
			.all(clubId) as Player[];
	}

	async getById(id: string): Promise<Player | null> {
		return (this.db.prepare('SELECT * FROM players WHERE id = ?').get(id) as Player) ?? null;
	}

	async create(data: Omit<Player, 'id' | 'created_at'>): Promise<Player> {
		const player: Player = { ...data, id: generateId(), created_at: now() };
		this.db
			.prepare(
				`INSERT INTO players (id, club_id, first_name, last_name, nickname, created_at)
				 VALUES (@id, @club_id, @first_name, @last_name, @nickname, @created_at)`
			)
			.run(player);
		return player;
	}

	async update(
		id: string,
		data: Partial<Omit<Player, 'id' | 'created_at'>>
	): Promise<Player | null> {
		const existing = await this.getById(id);
		if (!existing) return null;
		const updated: Player = { ...existing, ...data };
		this.db
			.prepare(
				`UPDATE players SET club_id = @club_id, first_name = @first_name,
				 last_name = @last_name, nickname = @nickname WHERE id = @id`
			)
			.run(updated);
		return updated;
	}

	async delete(id: string): Promise<boolean> {
		const result = this.db.prepare('DELETE FROM players WHERE id = ?').run(id);
		return result.changes > 0;
	}
}

// --- Season Repository ---

export class SqliteSeasonRepository implements SeasonRepository {
	constructor(private db: Database.Database) {}

	async getAll(): Promise<Season[]> {
		const rows = this.db.prepare('SELECT * FROM seasons ORDER BY name').all() as Array<
			Omit<Season, 'is_active'> & { is_active: number }
		>;
		return rows.map((r) => ({ ...r, is_active: r.is_active === 1 }));
	}

	async getById(id: string): Promise<Season | null> {
		const row = this.db.prepare('SELECT * FROM seasons WHERE id = ?').get(id) as
			| (Omit<Season, 'is_active'> & { is_active: number })
			| undefined;
		if (!row) return null;
		return { ...row, is_active: row.is_active === 1 };
	}

	async getActive(): Promise<Season | null> {
		const row = this.db.prepare('SELECT * FROM seasons WHERE is_active = 1').get() as
			| (Omit<Season, 'is_active'> & { is_active: number })
			| undefined;
		if (!row) return null;
		return { ...row, is_active: true };
	}

	async create(data: Omit<Season, 'id'>): Promise<Season> {
		const season: Season = { ...data, id: generateId() };
		this.db
			.prepare(
				`INSERT INTO seasons (id, name, game_mode, legs_per_set, sets_per_match, start_date, end_date, is_active)
				 VALUES (@id, @name, @game_mode, @legs_per_set, @sets_per_match, @start_date, @end_date, @is_active)`
			)
			.run({ ...season, is_active: season.is_active ? 1 : 0 });
		return season;
	}

	async update(id: string, data: Partial<Omit<Season, 'id'>>): Promise<Season | null> {
		const existing = await this.getById(id);
		if (!existing) return null;
		const updated: Season = { ...existing, ...data };
		this.db
			.prepare(
				`UPDATE seasons SET name = @name, game_mode = @game_mode, legs_per_set = @legs_per_set,
				 sets_per_match = @sets_per_match, start_date = @start_date, end_date = @end_date,
				 is_active = @is_active WHERE id = @id`
			)
			.run({ ...updated, is_active: updated.is_active ? 1 : 0 });
		return updated;
	}

	async delete(id: string): Promise<boolean> {
		const result = this.db.prepare('DELETE FROM seasons WHERE id = ?').run(id);
		return result.changes > 0;
	}

	async getClubIds(seasonId: string): Promise<string[]> {
		const rows = this.db
			.prepare('SELECT club_id FROM season_clubs WHERE season_id = ?')
			.all(seasonId) as Array<{ club_id: string }>;
		return rows.map((r) => r.club_id);
	}

	async assignClub(seasonId: string, clubId: string): Promise<void> {
		this.db
			.prepare('INSERT OR IGNORE INTO season_clubs (season_id, club_id) VALUES (?, ?)')
			.run(seasonId, clubId);
	}

	async removeClub(seasonId: string, clubId: string): Promise<void> {
		this.db
			.prepare('DELETE FROM season_clubs WHERE season_id = ? AND club_id = ?')
			.run(seasonId, clubId);
	}
}

// --- Match Repository ---

interface MatchRow {
	id: string;
	season_id: string;
	home_club_id: string;
	away_club_id: string;
	scheduled_at: string | null;
	status: 'scheduled' | 'in_progress' | 'completed';
	home_legs_won: number;
	away_legs_won: number;
	completed_at: string | null;
}

export class SqliteMatchRepository implements MatchRepository {
	constructor(
		private db: Database.Database,
		private clubRepo: ClubRepository
	) {}

	private async rowToMatch(row: MatchRow): Promise<Match> {
		const homeClub = await this.clubRepo.getById(row.home_club_id);
		const awayClub = await this.clubRepo.getById(row.away_club_id);
		if (!homeClub || !awayClub) {
			throw new Error(`Club not found for match ${row.id}`);
		}
		return {
			id: row.id,
			season_id: row.season_id,
			home_club: homeClub,
			away_club: awayClub,
			scheduled_at: row.scheduled_at,
			status: row.status,
			home_legs_won: row.home_legs_won,
			away_legs_won: row.away_legs_won,
			completed_at: row.completed_at
		};
	}

	async getAll(): Promise<Match[]> {
		const rows = this.db.prepare('SELECT * FROM matches').all() as MatchRow[];
		return Promise.all(rows.map((r) => this.rowToMatch(r)));
	}

	async getBySeasonId(seasonId: string): Promise<Match[]> {
		const rows = this.db
			.prepare('SELECT * FROM matches WHERE season_id = ?')
			.all(seasonId) as MatchRow[];
		return Promise.all(rows.map((r) => this.rowToMatch(r)));
	}

	async getById(id: string): Promise<Match | null> {
		const row = this.db.prepare('SELECT * FROM matches WHERE id = ?').get(id) as
			| MatchRow
			| undefined;
		if (!row) return null;
		return this.rowToMatch(row);
	}

	async create(data: Omit<Match, 'id'>): Promise<Match> {
		const id = generateId();
		this.db
			.prepare(
				`INSERT INTO matches (id, season_id, home_club_id, away_club_id, scheduled_at, status, home_legs_won, away_legs_won, completed_at)
				 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
			)
			.run(
				id,
				data.season_id,
				data.home_club.id,
				data.away_club.id,
				data.scheduled_at,
				data.status,
				data.home_legs_won,
				data.away_legs_won,
				data.completed_at
			);
		return { ...data, id };
	}

	async update(id: string, data: Partial<Omit<Match, 'id'>>): Promise<Match | null> {
		const existing = await this.getById(id);
		if (!existing) return null;
		const updated: Match = { ...existing, ...data };
		this.db
			.prepare(
				`UPDATE matches SET season_id = ?, home_club_id = ?, away_club_id = ?,
				 scheduled_at = ?, status = ?, home_legs_won = ?, away_legs_won = ?, completed_at = ?
				 WHERE id = ?`
			)
			.run(
				updated.season_id,
				updated.home_club.id,
				updated.away_club.id,
				updated.scheduled_at,
				updated.status,
				updated.home_legs_won,
				updated.away_legs_won,
				updated.completed_at,
				id
			);
		return updated;
	}

	async delete(id: string): Promise<boolean> {
		const result = this.db.prepare('DELETE FROM matches WHERE id = ?').run(id);
		return result.changes > 0;
	}
}

// --- Standings Service ---

export class SqliteStandingsService implements StandingsService {
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
