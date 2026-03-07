export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS clubs (
	id TEXT PRIMARY KEY,
	name TEXT NOT NULL,
	short_name TEXT NOT NULL,
	crest_url TEXT,
	primary_color TEXT NOT NULL DEFAULT '#333333',
	secondary_color TEXT NOT NULL DEFAULT '#ffffff',
	contact_email TEXT,
	created_at TEXT NOT NULL,
	updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS players (
	id TEXT PRIMARY KEY,
	club_id TEXT,
	first_name TEXT NOT NULL,
	last_name TEXT NOT NULL,
	nickname TEXT,
	created_at TEXT NOT NULL,
	FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS seasons (
	id TEXT PRIMARY KEY,
	name TEXT NOT NULL,
	game_mode TEXT NOT NULL DEFAULT '501',
	legs_per_set INTEGER NOT NULL DEFAULT 3,
	sets_per_match INTEGER NOT NULL DEFAULT 5,
	start_date TEXT,
	end_date TEXT,
	is_active INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS season_clubs (
	season_id TEXT NOT NULL,
	club_id TEXT NOT NULL,
	PRIMARY KEY (season_id, club_id),
	FOREIGN KEY (season_id) REFERENCES seasons(id) ON DELETE CASCADE,
	FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS matches (
	id TEXT PRIMARY KEY,
	season_id TEXT NOT NULL,
	home_club_id TEXT NOT NULL,
	away_club_id TEXT NOT NULL,
	scheduled_at TEXT,
	status TEXT NOT NULL DEFAULT 'scheduled',
	home_legs_won INTEGER NOT NULL DEFAULT 0,
	away_legs_won INTEGER NOT NULL DEFAULT 0,
	completed_at TEXT,
	FOREIGN KEY (season_id) REFERENCES seasons(id) ON DELETE CASCADE,
	FOREIGN KEY (home_club_id) REFERENCES clubs(id) ON DELETE CASCADE,
	FOREIGN KEY (away_club_id) REFERENCES clubs(id) ON DELETE CASCADE
);
`;
