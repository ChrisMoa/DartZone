export interface LiveTurnThrow {
	sector: number;
	multiplier: number;
	score: number;
	is_bust: boolean;
}

export interface LiveMatchState {
	match_id: string;
	leg_number: number;
	home_player_name: string;
	away_player_name: string;
	home_remaining: number;
	away_remaining: number;
	home_average: number;
	away_average: number;
	current_player_side: 'home' | 'away';
	current_dart: 1 | 2 | 3;
	current_turn_throws: LiveTurnThrow[];
	last_throw_score: number | null;
	status: 'in_progress' | 'completed';
	game_mode: '501' | '301' | 'cricket';
	updated_at: number;
}
