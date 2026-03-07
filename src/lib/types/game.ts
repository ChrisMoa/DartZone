import type { Player } from './club.js';

export type SectorValue =
	| 0
	| 1
	| 2
	| 3
	| 4
	| 5
	| 6
	| 7
	| 8
	| 9
	| 10
	| 11
	| 12
	| 13
	| 14
	| 15
	| 16
	| 17
	| 18
	| 19
	| 20
	| 25;

export type Multiplier = 0 | 1 | 2 | 3;

export interface DartThrow {
	id?: string;
	game_id: string;
	player_id: string;
	turn_number: number;
	dart_number: 1 | 2 | 3;
	sector: SectorValue;
	multiplier: Multiplier;
	score: number;
	remaining_score: number;
	is_bust: boolean;
	thrown_at?: string;
}

export interface GameState {
	id: string;
	match_id: string;
	leg_number: number;
	home_player: Player;
	away_player: Player;
	starting_score: number;
	home_remaining: number;
	away_remaining: number;
	current_player_id: string;
	current_turn: number;
	current_dart: 1 | 2 | 3;
	throws: DartThrow[];
	status: 'in_progress' | 'completed';
	winner_player_id: string | null;
}

export type SpecialHit = 'bullseye' | 'triple_twenty' | 'one_eighty' | 'checkout' | null;
