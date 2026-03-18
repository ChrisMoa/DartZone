import { getDatabase } from './database.js';
import {
	SqliteClubRepository,
	SqlitePlayerRepository,
	SqliteTournamentRepository,
	SqliteMatchRepository,
	SqliteStandingsService,
	SqliteAnimationAssetRepository
} from './sqlite-repository.js';
import { seedClubs, seedPlayers, seedTournaments, seedTournamentClubs, seedMatches } from './seed.js';

const db = getDatabase();

export const clubRepo = new SqliteClubRepository(db);
export const playerRepo = new SqlitePlayerRepository(db);
export const tournamentRepo = new SqliteTournamentRepository(db);
export const matchRepo = new SqliteMatchRepository(db, clubRepo);
export const standingsService = new SqliteStandingsService(matchRepo, tournamentRepo, clubRepo);
export const animationAssetRepo = new SqliteAnimationAssetRepository(db);

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
	const insertTournament = db.prepare(
		`INSERT INTO tournaments (id, name, game_mode, format, legs_per_set, sets_per_match, start_date, end_date, status)
		 VALUES (@id, @name, @game_mode, @format, @legs_per_set, @sets_per_match, @start_date, @end_date, @status)`
	);
	const insertTournamentClub = db.prepare(
		`INSERT INTO tournament_clubs (tournament_id, club_id) VALUES (?, ?)`
	);
	const insertMatch = db.prepare(
		`INSERT INTO matches (id, tournament_id, home_club_id, away_club_id, round, scheduled_at, status, home_legs_won, away_legs_won, completed_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
	);

	const seed = db.transaction(() => {
		for (const club of seedClubs) {
			insertClub.run(club);
		}
		for (const player of seedPlayers) {
			insertPlayer.run(player);
		}
		for (const tournament of seedTournaments) {
			insertTournament.run(tournament);
		}
		for (const [tournamentId, clubIds] of Object.entries(seedTournamentClubs)) {
			for (const clubId of clubIds) {
				insertTournamentClub.run(tournamentId, clubId);
			}
		}
		for (const match of seedMatches) {
			insertMatch.run(
				match.id,
				match.tournament_id,
				match.home_club.id,
				match.away_club.id,
				match.round,
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
