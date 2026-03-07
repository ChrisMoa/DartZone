import { getDatabase } from './database.js';
import {
	SqliteClubRepository,
	SqlitePlayerRepository,
	SqliteSeasonRepository,
	SqliteMatchRepository,
	SqliteStandingsService
} from './sqlite-repository.js';
import { seedClubs, seedPlayers, seedSeasons, seedSeasonClubs, seedMatches } from './seed.js';

const db = getDatabase();

export const clubRepo = new SqliteClubRepository(db);
export const playerRepo = new SqlitePlayerRepository(db);
export const seasonRepo = new SqliteSeasonRepository(db);
export const matchRepo = new SqliteMatchRepository(db, clubRepo);
export const standingsService = new SqliteStandingsService(matchRepo, seasonRepo, clubRepo);

// Auto-seed on first run (empty database)
const clubCount = db.prepare('SELECT COUNT(*) as count FROM clubs').get() as { count: number };
if (clubCount.count === 0) {
	seedDatabase();
}

function seedDatabase(): void {
	const insertClub = db.prepare(
		`INSERT INTO clubs (id, name, short_name, crest_url, primary_color, secondary_color, contact_email, created_at, updated_at)
		 VALUES (@id, @name, @short_name, @crest_url, @primary_color, @secondary_color, @contact_email, @created_at, @updated_at)`
	);
	const insertPlayer = db.prepare(
		`INSERT INTO players (id, club_id, first_name, last_name, nickname, created_at)
		 VALUES (@id, @club_id, @first_name, @last_name, @nickname, @created_at)`
	);
	const insertSeason = db.prepare(
		`INSERT INTO seasons (id, name, game_mode, legs_per_set, sets_per_match, start_date, end_date, is_active)
		 VALUES (@id, @name, @game_mode, @legs_per_set, @sets_per_match, @start_date, @end_date, @is_active)`
	);
	const insertSeasonClub = db.prepare(
		`INSERT INTO season_clubs (season_id, club_id) VALUES (?, ?)`
	);
	const insertMatch = db.prepare(
		`INSERT INTO matches (id, season_id, home_club_id, away_club_id, scheduled_at, status, home_legs_won, away_legs_won, completed_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
	);

	const seed = db.transaction(() => {
		for (const club of seedClubs) {
			insertClub.run(club);
		}
		for (const player of seedPlayers) {
			insertPlayer.run(player);
		}
		for (const season of seedSeasons) {
			insertSeason.run({ ...season, is_active: season.is_active ? 1 : 0 });
		}
		for (const [seasonId, clubIds] of Object.entries(seedSeasonClubs)) {
			for (const clubId of clubIds) {
				insertSeasonClub.run(seasonId, clubId);
			}
		}
		for (const match of seedMatches) {
			insertMatch.run(
				match.id,
				match.season_id,
				match.home_club.id,
				match.away_club.id,
				match.scheduled_at,
				match.status,
				match.home_legs_won,
				match.away_legs_won,
				match.completed_at
			);
		}
	});

	seed();
}
