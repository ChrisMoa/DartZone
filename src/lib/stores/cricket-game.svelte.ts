import type { Player } from '$lib/types/club.js';
import type { CricketMarks, CricketPlayerState, DartThrow, Multiplier, SectorValue, SpecialHit } from '$lib/types/game.js';
import { CRICKET_SEGMENTS } from '$lib/types/game.js';
import { calcScore, calcCricketThrow, createEmptyCricketMarks, hasClosedAll, isCricketGameOver } from '$lib/utils/scoring.js';

export function createCricketGameState(config: {
	match_id: string;
	leg_number: number;
	home_player: Player;
	away_player: Player;
}) {
	let id = $state(crypto.randomUUID());
	let match_id = $state(config.match_id);
	let leg_number = $state(config.leg_number);
	let home_player = $state(config.home_player);
	let away_player = $state(config.away_player);
	let current_player_id = $state(config.home_player.id);
	let current_turn = $state(1);
	let current_dart = $state<1 | 2 | 3>(1);
	let throws = $state<DartThrow[]>([]);
	let status = $state<'in_progress' | 'completed'>('in_progress');
	let winner_player_id = $state<string | null>(null);
	let lastSpecialHit = $state<SpecialHit>(null);

	let homeMarks = $state<CricketMarks>(createEmptyCricketMarks());
	let awayMarks = $state<CricketMarks>(createEmptyCricketMarks());
	let homePoints = $state(0);
	let awayPoints = $state(0);

	const isHomePlayer = $derived(current_player_id === home_player.id);
	const currentPlayer = $derived(isHomePlayer ? home_player : away_player);

	const currentTurnThrows = $derived(
		throws.filter(
			(t) => t.turn_number === current_turn && t.player_id === current_player_id
		)
	);

	const homeState = $derived<CricketPlayerState>({ marks: homeMarks, points: homePoints });
	const awayState = $derived<CricketPlayerState>({ marks: awayMarks, points: awayPoints });

	function registerThrow(sector: SectorValue, multiplier: Multiplier): DartThrow {
		if (status === 'completed') {
			throw new Error('Game is already completed');
		}

		const score = calcScore(sector, multiplier);
		const throwerMarks = isHomePlayer ? homeMarks : awayMarks;
		const opponentMarks = isHomePlayer ? awayMarks : homeMarks;

		const result = calcCricketThrow(sector, multiplier, throwerMarks, opponentMarks);

		const dartThrow: DartThrow = {
			id: crypto.randomUUID(),
			game_id: id,
			player_id: current_player_id,
			turn_number: current_turn,
			dart_number: current_dart,
			sector,
			multiplier,
			score,
			remaining_score: 0, // Not used in cricket
			is_bust: false, // No bust in cricket
			thrown_at: new Date().toISOString()
		};

		throws = [...throws, dartThrow];

		// Apply marks and points
		if (result.newMarks > 0) {
			if (isHomePlayer) {
				homeMarks = { ...homeMarks, [sector]: (homeMarks[sector] ?? 0) + result.newMarks };
			} else {
				awayMarks = { ...awayMarks, [sector]: (awayMarks[sector] ?? 0) + result.newMarks };
			}
		}
		if (result.points > 0) {
			if (isHomePlayer) {
				homePoints += result.points;
			} else {
				awayPoints += result.points;
			}
		}

		// Detect special hits
		lastSpecialHit = detectSpecialHit(sector, multiplier);

		// Check game over
		const currentHomeState: CricketPlayerState = { marks: homeMarks, points: homePoints };
		const currentAwayState: CricketPlayerState = { marks: awayMarks, points: awayPoints };
		const winner = isCricketGameOver(currentHomeState, currentAwayState);
		if (winner) {
			status = 'completed';
			winner_player_id = winner === 'home' ? home_player.id : away_player.id;
			lastSpecialHit = 'checkout';
			return dartThrow;
		}

		// Advance to next dart or next turn
		if (current_dart === 3) {
			endTurn();
		} else {
			current_dart = (current_dart + 1) as 1 | 2 | 3;
		}

		return dartThrow;
	}

	function detectSpecialHit(sector: SectorValue, multiplier: Multiplier): SpecialHit {
		if (sector === 25 && multiplier === 2) return 'bullseye';
		if (sector === 20 && multiplier === 3) {
			const turnThrows = throws.filter(
				(t) => t.turn_number === current_turn && t.player_id === current_player_id
			);
			if (
				turnThrows.length === 3 &&
				turnThrows.every((t) => t.sector === 20 && t.multiplier === 3)
			) {
				return 'one_eighty';
			}
			return 'triple_twenty';
		}
		return null;
	}

	function endTurn(): void {
		current_player_id = isHomePlayer ? away_player.id : home_player.id;
		current_turn++;
		current_dart = 1;
	}

	function undoLastThrow(): DartThrow | null {
		if (throws.length === 0) return null;
		if (status === 'completed') {
			status = 'in_progress';
			winner_player_id = null;
		}

		const lastThrow = throws[throws.length - 1];
		throws = throws.slice(0, -1);

		// Restore game state
		current_player_id = lastThrow.player_id;
		current_turn = lastThrow.turn_number;
		current_dart = lastThrow.dart_number;

		// Recalculate marks and points from scratch
		const recalc = recalculateState();
		homeMarks = recalc.homeMarks;
		awayMarks = recalc.awayMarks;
		homePoints = recalc.homePoints;
		awayPoints = recalc.awayPoints;

		lastSpecialHit = null;
		return lastThrow;
	}

	function recalculateState() {
		const hm = createEmptyCricketMarks();
		const am = createEmptyCricketMarks();
		let hp = 0;
		let ap = 0;

		for (const t of throws) {
			const isHome = t.player_id === home_player.id;
			const thrower = isHome ? hm : am;
			const opponent = isHome ? am : hm;

			const result = calcCricketThrow(t.sector, t.multiplier, thrower, opponent);
			if (result.newMarks > 0) {
				thrower[t.sector] = (thrower[t.sector] ?? 0) + result.newMarks;
			}
			if (result.points > 0) {
				if (isHome) hp += result.points;
				else ap += result.points;
			}
		}

		return { homeMarks: hm, awayMarks: am, homePoints: hp, awayPoints: ap };
	}

	return {
		get id() { return id; },
		get match_id() { return match_id; },
		get leg_number() { return leg_number; },
		get home_player() { return home_player; },
		get away_player() { return away_player; },
		get current_player_id() { return current_player_id; },
		get current_turn() { return current_turn; },
		get current_dart() { return current_dart; },
		get throws() { return throws; },
		get status() { return status; },
		get winner_player_id() { return winner_player_id; },
		get lastSpecialHit() { return lastSpecialHit; },
		get isHomePlayer() { return isHomePlayer; },
		get currentPlayer() { return currentPlayer; },
		get currentTurnThrows() { return currentTurnThrows; },
		get homeState() { return homeState; },
		get awayState() { return awayState; },
		get homeMarks() { return homeMarks; },
		get awayMarks() { return awayMarks; },
		get homePoints() { return homePoints; },
		get awayPoints() { return awayPoints; },
		// Compatibility with GameStore interface used by shared components
		get home_remaining() { return homePoints; },
		get away_remaining() { return awayPoints; },
		get starting_score() { return 0; },
		get homeAverage() { return 0; },
		get awayAverage() { return 0; },
		get checkoutRoute() { return null; },
		get checkoutRoutes() { return []; },
		get softCheckout() { return false; },
		get currentRemaining() { return 0; },
		get opponentPlayer() { return isHomePlayer ? away_player : home_player; },
		setSoftCheckout(_v: boolean) { /* no-op for cricket */ },
		registerThrow,
		undoLastThrow,
		getState() {
			return {
				id, match_id, leg_number, home_player, away_player,
				starting_score: 0, home_remaining: homePoints, away_remaining: awayPoints,
				current_player_id, current_turn, current_dart, throws, status, winner_player_id
			};
		}
	};
}

export type CricketGameStore = ReturnType<typeof createCricketGameState>;
