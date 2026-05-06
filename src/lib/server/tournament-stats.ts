import type Database from 'better-sqlite3';

export type TournamentStatsMode = 'player' | 'team';

export interface TournamentLeaderEntry {
	id: string;
	name: string;
	short_name: string | null;
	club_id: string | null;
	has_crest: boolean;
	primary_color: string | null;
	matches_played: number;
	legs_played: number;
	total_darts: number;
	average: number;
	one_eighties: number;
	ton_plus: number;
	highest_finish: number;
	highest_turn: number;
}

export interface TournamentStats {
	mode: TournamentStatsMode;
	entries: TournamentLeaderEntry[];
}

interface ThrowRow {
	match_id: string;
	leg_number: number;
	player_id: string;
	turn_number: number;
	dart_number: number;
	sector: number;
	multiplier: number;
	score: number;
	remaining_score: number;
	is_bust: number;
	first_name: string;
	last_name: string;
	nickname: string | null;
	player_club_id: string;
	club_name: string;
	club_short_name: string;
	club_primary_color: string;
	has_crest_flag: number;
}

export class SqliteTournamentStatsService {
	constructor(private db: Database.Database) {}

	getStats(tournamentId: string, mode: TournamentStatsMode): TournamentStats {
		const rows = this.db
			.prepare(
				`SELECT t.match_id, t.leg_number, t.player_id, t.turn_number, t.dart_number,
				        t.sector, t.multiplier, t.score, t.remaining_score, t.is_bust,
				        p.first_name, p.last_name, p.nickname,
				        p.club_id as player_club_id,
				        c.name as club_name, c.short_name as club_short_name,
				        c.primary_color as club_primary_color,
				        (c.crest_data IS NOT NULL) as has_crest_flag
				 FROM dart_throws t
				 JOIN matches m ON m.id = t.match_id
				 JOIN players p ON p.id = t.player_id
				 JOIN clubs c ON c.id = p.club_id
				 WHERE m.tournament_id = ?`
			)
			.all(tournamentId) as ThrowRow[];

		if (rows.length === 0) {
			return { mode, entries: [] };
		}

		// Choose the grouping key
		type Bucket = {
			id: string;
			name: string;
			short_name: string | null;
			club_id: string | null;
			has_crest: boolean;
			primary_color: string | null;
			matches: Set<string>;
			legs: Set<string>;
			total_darts: number;
			scoring_darts: number;
			scoring_sum: number;
			one_eighties: number;
			ton_plus: number;
			highest_finish: number;
			highest_turn: number;
			turns: Map<string, { score: number; t20: number; bust: boolean; darts: number }>;
		};
		const buckets = new Map<string, Bucket>();

		for (const r of rows) {
			const isPlayerMode = mode === 'player';
			const id = isPlayerMode ? r.player_id : r.player_club_id;
			const name = isPlayerMode
				? r.nickname || `${r.first_name} ${r.last_name}`.trim()
				: r.club_name;

			let b = buckets.get(id);
			if (!b) {
				b = {
					id,
					name,
					short_name: r.club_short_name,
					club_id: isPlayerMode ? r.player_club_id : null,
					has_crest: r.has_crest_flag === 1,
					primary_color: r.club_primary_color,
					matches: new Set(),
					legs: new Set(),
					total_darts: 0,
					scoring_darts: 0,
					scoring_sum: 0,
					one_eighties: 0,
					ton_plus: 0,
					highest_finish: 0,
					highest_turn: 0,
					turns: new Map()
				};
				buckets.set(id, b);
			}

			b.matches.add(r.match_id);
			b.legs.add(`${r.match_id}_${r.leg_number}`);
			b.total_darts++;
			if (!r.is_bust) {
				b.scoring_darts++;
				b.scoring_sum += r.score;
				if (r.remaining_score === 0 && r.score > b.highest_finish) {
					b.highest_finish = r.score;
				}
			}

			const turnKey = `${r.match_id}_${r.leg_number}_${r.player_id}_${r.turn_number}`;
			let turn = b.turns.get(turnKey);
			if (!turn) {
				turn = { score: 0, t20: 0, bust: false, darts: 0 };
				b.turns.set(turnKey, turn);
			}
			turn.darts++;
			if (r.is_bust) {
				turn.bust = true;
			} else {
				turn.score += r.score;
				if (r.sector === 20 && r.multiplier === 3) turn.t20++;
			}
		}

		const entries: TournamentLeaderEntry[] = [];
		for (const b of buckets.values()) {
			for (const turn of b.turns.values()) {
				if (turn.bust) continue;
				if (turn.darts === 3) {
					if (turn.score === 180 && turn.t20 === 3) b.one_eighties++;
					if (turn.score >= 100) b.ton_plus++;
					if (turn.score > b.highest_turn) b.highest_turn = turn.score;
				}
			}
			const avg = b.scoring_darts > 0 ? (b.scoring_sum / b.scoring_darts) * 3 : 0;
			entries.push({
				id: b.id,
				name: b.name,
				short_name: b.short_name,
				club_id: b.club_id,
				has_crest: b.has_crest,
				primary_color: b.primary_color,
				matches_played: b.matches.size,
				legs_played: b.legs.size,
				total_darts: b.total_darts,
				average: Math.round(avg * 10) / 10,
				one_eighties: b.one_eighties,
				ton_plus: b.ton_plus,
				highest_finish: b.highest_finish,
				highest_turn: b.highest_turn
			});
		}

		entries.sort((a, b) => b.average - a.average);
		return { mode, entries };
	}
}
