import type { Player } from '$lib/types/club.js';
import type { DartThrow, GameState, Multiplier, SectorValue, SpecialHit } from '$lib/types/game.js';
import { calcScore, isBust, isCheckout } from '$lib/utils/scoring.js';
import { getCheckoutRoute, type CheckoutRoute } from '$lib/utils/checkout.js';

export function createGameState(config: {
	match_id: string;
	leg_number: number;
	home_player: Player;
	away_player: Player;
	starting_score: number;
	softCheckout?: boolean;
}) {
	const softCheckout = config.softCheckout ?? false;
	let id = $state(crypto.randomUUID());
	let match_id = $state(config.match_id);
	let leg_number = $state(config.leg_number);
	let home_player = $state(config.home_player);
	let away_player = $state(config.away_player);
	let starting_score = $state(config.starting_score);
	let home_remaining = $state(config.starting_score);
	let away_remaining = $state(config.starting_score);
	let current_player_id = $state(config.home_player.id);
	let current_turn = $state(1);
	let current_dart = $state<1 | 2 | 3>(1);
	let throws = $state<DartThrow[]>([]);
	let status = $state<'in_progress' | 'completed'>('in_progress');
	let winner_player_id = $state<string | null>(null);
	let lastSpecialHit = $state<SpecialHit>(null);

	const isHomePlayer = $derived(current_player_id === home_player.id);
	const currentRemaining = $derived(isHomePlayer ? home_remaining : away_remaining);
	const currentPlayer = $derived(isHomePlayer ? home_player : away_player);
	const opponentPlayer = $derived(isHomePlayer ? away_player : home_player);

	const currentTurnThrows = $derived(
		throws.filter(
			(t) => t.turn_number === current_turn && t.player_id === current_player_id
		)
	);

	const homeAverage = $derived.by(() => {
		const homeThrows = throws.filter((t) => t.player_id === home_player.id && !t.is_bust);
		if (homeThrows.length === 0) return 0;
		const totalScore = homeThrows.reduce((sum, t) => sum + t.score, 0);
		return (totalScore / homeThrows.length) * 3;
	});

	const awayAverage = $derived.by(() => {
		const awayThrows = throws.filter((t) => t.player_id === away_player.id && !t.is_bust);
		if (awayThrows.length === 0) return 0;
		const totalScore = awayThrows.reduce((sum, t) => sum + t.score, 0);
		return (totalScore / awayThrows.length) * 3;
	});

	const checkoutRoute = $derived.by((): CheckoutRoute | null => {
		if (status === 'completed') return null;
		return getCheckoutRoute(currentRemaining);
	});

	function registerThrow(sector: SectorValue, multiplier: Multiplier): DartThrow {
		if (status === 'completed') {
			throw new Error('Game is already completed');
		}

		const score = calcScore(sector, multiplier);
		const remaining = isHomePlayer ? home_remaining : away_remaining;
		const bust = isBust(remaining, score, multiplier, softCheckout);
		const checkout = !bust && isCheckout(remaining, score, multiplier, softCheckout);

		const newRemaining = checkout && softCheckout ? 0 : remaining - score;

		const dartThrow: DartThrow = {
			id: crypto.randomUUID(),
			game_id: id,
			player_id: current_player_id,
			turn_number: current_turn,
			dart_number: current_dart,
			sector,
			multiplier,
			score: bust ? 0 : score,
			remaining_score: bust ? remaining : newRemaining,
			is_bust: bust,
			thrown_at: new Date().toISOString()
		};

		throws = [...throws, dartThrow];

		// Detect special hits
		lastSpecialHit = detectSpecialHit(sector, multiplier, bust, checkout);

		if (bust) {
			// Bust: restore remaining score, end turn
			endTurn();
			return dartThrow;
		}

		// Update remaining score (clamp to 0 in soft checkout mode)
		if (isHomePlayer) {
			home_remaining = checkout && softCheckout ? 0 : home_remaining - score;
		} else {
			away_remaining = checkout && softCheckout ? 0 : away_remaining - score;
		}

		if (checkout) {
			status = 'completed';
			winner_player_id = current_player_id;
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

	function detectSpecialHit(
		sector: SectorValue,
		multiplier: Multiplier,
		bust: boolean,
		checkout: boolean
	): SpecialHit {
		if (checkout) return 'checkout';
		if (bust) return null;

		// Check for 180 (three T20s in current turn)
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

		if (sector === 25 && multiplier === 2) return 'bullseye';

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

		if (!lastThrow.is_bust) {
			if (lastThrow.player_id === home_player.id) {
				home_remaining += lastThrow.score;
			} else {
				away_remaining += lastThrow.score;
			}
		}

		lastSpecialHit = null;
		return lastThrow;
	}

	function getState(): GameState {
		return {
			id,
			match_id,
			leg_number,
			home_player,
			away_player,
			starting_score,
			home_remaining,
			away_remaining,
			current_player_id,
			current_turn,
			current_dart,
			throws,
			status,
			winner_player_id
		};
	}

	return {
		get id() { return id; },
		get match_id() { return match_id; },
		get leg_number() { return leg_number; },
		get home_player() { return home_player; },
		get away_player() { return away_player; },
		get starting_score() { return starting_score; },
		get home_remaining() { return home_remaining; },
		get away_remaining() { return away_remaining; },
		get current_player_id() { return current_player_id; },
		get current_turn() { return current_turn; },
		get current_dart() { return current_dart; },
		get throws() { return throws; },
		get status() { return status; },
		get winner_player_id() { return winner_player_id; },
		get lastSpecialHit() { return lastSpecialHit; },
		get isHomePlayer() { return isHomePlayer; },
		get currentRemaining() { return currentRemaining; },
		get currentPlayer() { return currentPlayer; },
		get opponentPlayer() { return opponentPlayer; },
		get currentTurnThrows() { return currentTurnThrows; },
		get homeAverage() { return homeAverage; },
		get awayAverage() { return awayAverage; },
		get checkoutRoute() { return checkoutRoute; },
		get softCheckout() { return softCheckout; },
		registerThrow,
		undoLastThrow,
		getState
	};
}

export type GameStore = ReturnType<typeof createGameState>;
