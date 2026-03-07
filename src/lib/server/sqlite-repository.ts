import type Database from 'better-sqlite3';
import type { Club } from '$lib/types/club.js';
import type { Player } from '$lib/types/club.js';
import type { Tournament, Match, Standing } from '$lib/types/league.js';
import type {
	ClubRepository,
	PlayerRepository,
	TournamentRepository,
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

	private rowToClub(row: Record<string, unknown>): Club {
		return {
			id: row.id as string,
			name: row.name as string,
			short_name: row.short_name as string,
			crest_url: row.crest_url as string | null,
			has_crest: row.crest_data != null,
			primary_color: row.primary_color as string,
			secondary_color: row.secondary_color as string,
			contact_email: row.contact_email as string | null,
			created_at: row.created_at as string,
			updated_at: row.updated_at as string
		};
	}

	async getAll(): Promise<Club[]> {
		const rows = this.db
			.prepare('SELECT id, name, short_name, crest_url, crest_data IS NOT NULL as has_crest_flag, primary_color, secondary_color, contact_email, created_at, updated_at FROM clubs ORDER BY name')
			.all() as Array<Record<string, unknown>>;
		return rows.map((r) => ({
			id: r.id as string,
			name: r.name as string,
			short_name: r.short_name as string,
			crest_url: r.crest_url as string | null,
			has_crest: (r.has_crest_flag as number) === 1,
			primary_color: r.primary_color as string,
			secondary_color: r.secondary_color as string,
			contact_email: r.contact_email as string | null,
			created_at: r.created_at as string,
			updated_at: r.updated_at as string
		}));
	}

	async getById(id: string): Promise<Club | null> {
		const row = this.db
			.prepare('SELECT id, name, short_name, crest_url, crest_data IS NOT NULL as has_crest_flag, primary_color, secondary_color, contact_email, created_at, updated_at FROM clubs WHERE id = ?')
			.get(id) as Record<string, unknown> | undefined;
		if (!row) return null;
		return {
			id: row.id as string,
			name: row.name as string,
			short_name: row.short_name as string,
			crest_url: row.crest_url as string | null,
			has_crest: (row.has_crest_flag as number) === 1,
			primary_color: row.primary_color as string,
			secondary_color: row.secondary_color as string,
			contact_email: row.contact_email as string | null,
			created_at: row.created_at as string,
			updated_at: row.updated_at as string
		};
	}

	async create(data: Omit<Club, 'id' | 'created_at' | 'updated_at' | 'has_crest'>): Promise<Club> {
		const id = generateId();
		const ts = now();
		this.db
			.prepare(
				`INSERT INTO clubs (id, name, short_name, crest_url, primary_color, secondary_color, contact_email, created_at, updated_at)
				 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
			)
			.run(id, data.name, data.short_name, data.crest_url, data.primary_color, data.secondary_color, data.contact_email, ts, ts);
		return {
			...data,
			id,
			has_crest: false,
			created_at: ts,
			updated_at: ts
		};
	}

	async update(
		id: string,
		data: Partial<Omit<Club, 'id' | 'created_at' | 'updated_at' | 'has_crest'>>
	): Promise<Club | null> {
		const existing = await this.getById(id);
		if (!existing) return null;
		const updated = { ...existing, ...data, updated_at: now() };
		this.db
			.prepare(
				`UPDATE clubs SET name = ?, short_name = ?, crest_url = ?,
				 primary_color = ?, secondary_color = ?,
				 contact_email = ?, updated_at = ? WHERE id = ?`
			)
			.run(updated.name, updated.short_name, updated.crest_url, updated.primary_color, updated.secondary_color, updated.contact_email, updated.updated_at, id);
		return updated;
	}

	async delete(id: string): Promise<boolean> {
		const result = this.db.prepare('DELETE FROM clubs WHERE id = ?').run(id);
		return result.changes > 0;
	}

	async search(query: string): Promise<Club[]> {
		const q = `%${query.toLowerCase()}%`;
		const rows = this.db
			.prepare(
				`SELECT id, name, short_name, crest_url, crest_data IS NOT NULL as has_crest_flag, primary_color, secondary_color, contact_email, created_at, updated_at
				 FROM clubs WHERE LOWER(name) LIKE ? OR LOWER(short_name) LIKE ? ORDER BY name`
			)
			.all(q, q) as Array<Record<string, unknown>>;
		return rows.map((r) => ({
			id: r.id as string,
			name: r.name as string,
			short_name: r.short_name as string,
			crest_url: r.crest_url as string | null,
			has_crest: (r.has_crest_flag as number) === 1,
			primary_color: r.primary_color as string,
			secondary_color: r.secondary_color as string,
			contact_email: r.contact_email as string | null,
			created_at: r.created_at as string,
			updated_at: r.updated_at as string
		}));
	}

	async getCrestData(id: string): Promise<{ data: Buffer; mime: string } | null> {
		const row = this.db
			.prepare('SELECT crest_data, crest_mime FROM clubs WHERE id = ?')
			.get(id) as { crest_data: Buffer | null; crest_mime: string | null } | undefined;
		if (!row || !row.crest_data || !row.crest_mime) return null;
		return { data: row.crest_data, mime: row.crest_mime };
	}

	async setCrestData(id: string, data: Buffer, mime: string): Promise<boolean> {
		const result = this.db
			.prepare('UPDATE clubs SET crest_data = ?, crest_mime = ?, updated_at = ? WHERE id = ?')
			.run(data, mime, now(), id);
		return result.changes > 0;
	}

	async removeCrestData(id: string): Promise<boolean> {
		const result = this.db
			.prepare('UPDATE clubs SET crest_data = NULL, crest_mime = NULL, updated_at = ? WHERE id = ?')
			.run(now(), id);
		return result.changes > 0;
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

// --- Tournament Repository ---

export class SqliteTournamentRepository implements TournamentRepository {
	constructor(private db: Database.Database) {}

	private rowToTournament(row: Omit<Tournament, 'is_active'> & { is_active: number }): Tournament {
		return { ...row, is_active: row.is_active === 1 };
	}

	async getAll(): Promise<Tournament[]> {
		const rows = this.db.prepare('SELECT * FROM tournaments ORDER BY name').all() as Array<
			Omit<Tournament, 'is_active'> & { is_active: number }
		>;
		return rows.map((r) => this.rowToTournament(r));
	}

	async getById(id: string): Promise<Tournament | null> {
		const row = this.db.prepare('SELECT * FROM tournaments WHERE id = ?').get(id) as
			| (Omit<Tournament, 'is_active'> & { is_active: number })
			| undefined;
		if (!row) return null;
		return this.rowToTournament(row);
	}

	async getActive(): Promise<Tournament | null> {
		const row = this.db.prepare('SELECT * FROM tournaments WHERE is_active = 1').get() as
			| (Omit<Tournament, 'is_active'> & { is_active: number })
			| undefined;
		if (!row) return null;
		return { ...row, is_active: true };
	}

	async create(data: Omit<Tournament, 'id'>): Promise<Tournament> {
		const tournament: Tournament = { ...data, id: generateId() };
		this.db
			.prepare(
				`INSERT INTO tournaments (id, name, game_mode, format, legs_per_set, sets_per_match, start_date, end_date, is_active)
				 VALUES (@id, @name, @game_mode, @format, @legs_per_set, @sets_per_match, @start_date, @end_date, @is_active)`
			)
			.run({ ...tournament, is_active: tournament.is_active ? 1 : 0 });
		return tournament;
	}

	async update(id: string, data: Partial<Omit<Tournament, 'id'>>): Promise<Tournament | null> {
		const existing = await this.getById(id);
		if (!existing) return null;
		const updated: Tournament = { ...existing, ...data };
		this.db
			.prepare(
				`UPDATE tournaments SET name = @name, game_mode = @game_mode, format = @format,
				 legs_per_set = @legs_per_set, sets_per_match = @sets_per_match,
				 start_date = @start_date, end_date = @end_date,
				 is_active = @is_active WHERE id = @id`
			)
			.run({ ...updated, is_active: updated.is_active ? 1 : 0 });
		return updated;
	}

	async delete(id: string): Promise<boolean> {
		const result = this.db.prepare('DELETE FROM tournaments WHERE id = ?').run(id);
		return result.changes > 0;
	}

	async getClubIds(tournamentId: string): Promise<string[]> {
		const rows = this.db
			.prepare('SELECT club_id FROM tournament_clubs WHERE tournament_id = ?')
			.all(tournamentId) as Array<{ club_id: string }>;
		return rows.map((r) => r.club_id);
	}

	async assignClub(tournamentId: string, clubId: string): Promise<void> {
		this.db
			.prepare('INSERT OR IGNORE INTO tournament_clubs (tournament_id, club_id) VALUES (?, ?)')
			.run(tournamentId, clubId);
	}

	async removeClub(tournamentId: string, clubId: string): Promise<void> {
		this.db
			.prepare('DELETE FROM tournament_clubs WHERE tournament_id = ? AND club_id = ?')
			.run(tournamentId, clubId);
	}
}

// --- Match Repository ---

interface MatchRow {
	id: string;
	tournament_id: string;
	home_club_id: string;
	away_club_id: string;
	round: string | null;
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
			tournament_id: row.tournament_id,
			home_club: homeClub,
			away_club: awayClub,
			round: row.round,
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

	async getByTournamentId(tournamentId: string): Promise<Match[]> {
		const rows = this.db
			.prepare('SELECT * FROM matches WHERE tournament_id = ?')
			.all(tournamentId) as MatchRow[];
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
				`INSERT INTO matches (id, tournament_id, home_club_id, away_club_id, round, scheduled_at, status, home_legs_won, away_legs_won, completed_at)
				 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
			)
			.run(
				id,
				data.tournament_id,
				data.home_club.id,
				data.away_club.id,
				data.round,
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
				`UPDATE matches SET tournament_id = ?, home_club_id = ?, away_club_id = ?,
				 round = ?, scheduled_at = ?, status = ?, home_legs_won = ?, away_legs_won = ?, completed_at = ?
				 WHERE id = ?`
			)
			.run(
				updated.tournament_id,
				updated.home_club.id,
				updated.away_club.id,
				updated.round,
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
		private tournamentRepo: TournamentRepository,
		private clubRepo: ClubRepository
	) {}

	async getByTournamentId(tournamentId: string): Promise<Standing[]> {
		return this.recalculate(tournamentId);
	}

	async recalculate(tournamentId: string): Promise<Standing[]> {
		const clubIds = await this.tournamentRepo.getClubIds(tournamentId);
		const matches = await this.matchRepo.getByTournamentId(tournamentId);
		const completedMatches = matches.filter((m) => m.status === 'completed');

		const standingsMap = new Map<string, Standing>();

		for (const clubId of clubIds) {
			const club = await this.clubRepo.getById(clubId);
			if (!club) continue;
			standingsMap.set(clubId, {
				tournament_id: tournamentId,
				club_id: clubId,
				club_name: club.name,
				short_name: club.short_name,
				crest_url: club.crest_url,
				has_crest: club.has_crest,
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
