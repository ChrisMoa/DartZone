export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS clubs (
	id TEXT PRIMARY KEY,
	name TEXT NOT NULL,
	short_name TEXT NOT NULL,
	crest_url TEXT,
	crest_data BLOB,
	crest_mime TEXT,
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

CREATE TABLE IF NOT EXISTS tournaments (
	id TEXT PRIMARY KEY,
	name TEXT NOT NULL,
	game_mode TEXT NOT NULL DEFAULT '501',
	format TEXT NOT NULL DEFAULT 'round_robin',
	legs_per_set INTEGER NOT NULL DEFAULT 3,
	sets_per_match INTEGER NOT NULL DEFAULT 5,
	start_date TEXT,
	end_date TEXT,
	is_active INTEGER NOT NULL DEFAULT 0,
	organizer_name TEXT,
	organizer_logo BLOB,
	organizer_logo_mime TEXT,
	organizer_contact TEXT,
	organizer_note TEXT
);

CREATE TABLE IF NOT EXISTS tournament_clubs (
	tournament_id TEXT NOT NULL,
	club_id TEXT NOT NULL,
	PRIMARY KEY (tournament_id, club_id),
	FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
	FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS matches (
	id TEXT PRIMARY KEY,
	tournament_id TEXT NOT NULL,
	home_club_id TEXT NOT NULL,
	away_club_id TEXT NOT NULL,
	round TEXT,
	scheduled_at TEXT,
	status TEXT NOT NULL DEFAULT 'scheduled',
	home_legs_won INTEGER NOT NULL DEFAULT 0,
	away_legs_won INTEGER NOT NULL DEFAULT 0,
	completed_at TEXT,
	FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
	FOREIGN KEY (home_club_id) REFERENCES clubs(id) ON DELETE CASCADE,
	FOREIGN KEY (away_club_id) REFERENCES clubs(id) ON DELETE CASCADE
);
`;
