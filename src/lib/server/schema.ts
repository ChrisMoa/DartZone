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
	status TEXT NOT NULL DEFAULT 'planned',
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

CREATE TABLE IF NOT EXISTS dart_throws (
	id TEXT PRIMARY KEY,
	match_id TEXT NOT NULL,
	leg_number INTEGER NOT NULL,
	player_id TEXT NOT NULL,
	turn_number INTEGER NOT NULL,
	dart_number INTEGER NOT NULL CHECK (dart_number IN (1, 2, 3)),
	sector INTEGER NOT NULL,
	multiplier INTEGER NOT NULL CHECK (multiplier IN (0, 1, 2, 3)),
	score INTEGER NOT NULL,
	remaining_score INTEGER NOT NULL,
	is_bust INTEGER NOT NULL DEFAULT 0,
	thrown_at TEXT NOT NULL,
	FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
	FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS animation_assets (
	event TEXT PRIMARY KEY,
	data BLOB NOT NULL,
	mime TEXT NOT NULL,
	duration_ms INTEGER NOT NULL DEFAULT 2000,
	position TEXT NOT NULL DEFAULT 'center',
	created_at TEXT NOT NULL
);
`;
