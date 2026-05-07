import type Database from 'better-sqlite3';

export interface SpectatorConfig {
	layout: string;
	matchIds: string[];
	updated_at: number;
}

export class SqliteSpectatorConfigRepository {
	constructor(private db: Database.Database) {}

	get(tournamentId: string): SpectatorConfig | null {
		const row = this.db
			.prepare(
				'SELECT layout, match_ids, updated_at FROM spectator_configs WHERE tournament_id = ?'
			)
			.get(tournamentId) as { layout: string; match_ids: string; updated_at: number } | undefined;
		if (!row) return null;
		let matchIds: string[] = [];
		try {
			const parsed = JSON.parse(row.match_ids);
			if (Array.isArray(parsed)) matchIds = parsed.filter((x) => typeof x === 'string');
		} catch {
			/* fall back to empty */
		}
		return { layout: row.layout, matchIds, updated_at: row.updated_at };
	}

	set(tournamentId: string, layout: string, matchIds: string[]): SpectatorConfig {
		const updated_at = Date.now();
		const matchIdsJson = JSON.stringify(matchIds);
		this.db
			.prepare(
				`INSERT INTO spectator_configs (tournament_id, layout, match_ids, updated_at)
				 VALUES (?, ?, ?, ?)
				 ON CONFLICT(tournament_id) DO UPDATE SET
					layout = excluded.layout,
					match_ids = excluded.match_ids,
					updated_at = excluded.updated_at`
			)
			.run(tournamentId, layout, matchIdsJson, updated_at);
		return { layout, matchIds, updated_at };
	}
}
