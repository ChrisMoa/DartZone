import { describe, it, expect } from 'vitest';
import {
	isCricketSegment,
	createEmptyCricketMarks,
	calcCricketThrow,
	hasClosedAll,
	isCricketGameOver
} from '$lib/utils/scoring.js';
import type { CricketMarks, CricketPlayerState, Multiplier, SectorValue } from '$lib/types/game.js';

describe('isCricketSegment', () => {
	it('returns true for cricket segments (15-20, 25)', () => {
		expect(isCricketSegment(15)).toBe(true);
		expect(isCricketSegment(16)).toBe(true);
		expect(isCricketSegment(17)).toBe(true);
		expect(isCricketSegment(18)).toBe(true);
		expect(isCricketSegment(19)).toBe(true);
		expect(isCricketSegment(20)).toBe(true);
		expect(isCricketSegment(25)).toBe(true);
	});

	it('returns false for non-cricket segments', () => {
		expect(isCricketSegment(1)).toBe(false);
		expect(isCricketSegment(14)).toBe(false);
		expect(isCricketSegment(0)).toBe(false);
	});
});

describe('createEmptyCricketMarks', () => {
	it('creates marks object with all cricket segments at 0', () => {
		const marks = createEmptyCricketMarks();
		expect(marks[15]).toBe(0);
		expect(marks[16]).toBe(0);
		expect(marks[17]).toBe(0);
		expect(marks[18]).toBe(0);
		expect(marks[19]).toBe(0);
		expect(marks[20]).toBe(0);
		expect(marks[25]).toBe(0);
	});
});

describe('calcCricketThrow', () => {
	function emptyMarks(): CricketMarks {
		return createEmptyCricketMarks();
	}

	it('single hit on open segment adds 1 mark, no points', () => {
		const result = calcCricketThrow(20, 1, emptyMarks(), emptyMarks());
		expect(result.newMarks).toBe(1);
		expect(result.points).toBe(0);
	});

	it('double hit on open segment adds 2 marks, no points', () => {
		const result = calcCricketThrow(20, 2, emptyMarks(), emptyMarks());
		expect(result.newMarks).toBe(2);
		expect(result.points).toBe(0);
	});

	it('triple hit on open segment adds 3 marks (closes it), no points', () => {
		const result = calcCricketThrow(20, 3, emptyMarks(), emptyMarks());
		expect(result.newMarks).toBe(3);
		expect(result.points).toBe(0);
	});

	it('hit on already closed segment (3 marks) scores points if opponent has not closed', () => {
		const thrower = emptyMarks();
		thrower[20] = 3; // closed
		const opponent = emptyMarks();
		opponent[20] = 1; // not closed
		const result = calcCricketThrow(20, 1, thrower, opponent);
		expect(result.newMarks).toBe(0);
		expect(result.points).toBe(20);
	});

	it('triple on closed segment scores 3x points', () => {
		const thrower = emptyMarks();
		thrower[20] = 3;
		const opponent = emptyMarks();
		const result = calcCricketThrow(20, 3, thrower, opponent);
		expect(result.newMarks).toBe(0);
		expect(result.points).toBe(60);
	});

	it('hit on closed segment scores 0 if opponent also closed', () => {
		const thrower = emptyMarks();
		thrower[20] = 3;
		const opponent = emptyMarks();
		opponent[20] = 3;
		const result = calcCricketThrow(20, 1, thrower, opponent);
		expect(result.newMarks).toBe(0);
		expect(result.points).toBe(0);
	});

	it('partially closing with extra marks scores points for overflow', () => {
		const thrower = emptyMarks();
		thrower[20] = 2; // needs 1 more to close
		const opponent = emptyMarks();
		// Triple: 3 hits, 1 to close + 2 overflow
		const result = calcCricketThrow(20, 3, thrower, opponent);
		expect(result.newMarks).toBe(1);
		expect(result.points).toBe(40); // 2 * 20
	});

	it('bull single adds 1 mark', () => {
		const result = calcCricketThrow(25, 1, emptyMarks(), emptyMarks());
		expect(result.newMarks).toBe(1);
		expect(result.points).toBe(0);
	});

	it('bullseye (double bull) adds 2 marks', () => {
		const result = calcCricketThrow(25, 2, emptyMarks(), emptyMarks());
		expect(result.newMarks).toBe(2);
		expect(result.points).toBe(0);
	});

	it('triple bull is invalid (returns 0)', () => {
		const result = calcCricketThrow(25, 3, emptyMarks(), emptyMarks());
		expect(result.newMarks).toBe(0);
		expect(result.points).toBe(0);
	});

	it('bull scoring uses value 25', () => {
		const thrower = emptyMarks();
		thrower[25] = 3; // closed
		const opponent = emptyMarks();
		const result = calcCricketThrow(25, 1, thrower, opponent);
		expect(result.points).toBe(25);
	});

	it('non-cricket segment returns 0 marks and 0 points', () => {
		const result = calcCricketThrow(1 as SectorValue, 3 as Multiplier, emptyMarks(), emptyMarks());
		expect(result.newMarks).toBe(0);
		expect(result.points).toBe(0);
	});

	it('miss returns 0 marks and 0 points', () => {
		const result = calcCricketThrow(0 as SectorValue, 0 as Multiplier, emptyMarks(), emptyMarks());
		expect(result.newMarks).toBe(0);
		expect(result.points).toBe(0);
	});

	it('overflow on bull scores points correctly', () => {
		const thrower = emptyMarks();
		thrower[25] = 2; // needs 1 more
		const opponent = emptyMarks();
		// Double bull: 2 hits, 1 to close + 1 overflow
		const result = calcCricketThrow(25, 2, thrower, opponent);
		expect(result.newMarks).toBe(1);
		expect(result.points).toBe(25);
	});

	it('overflow does not score if opponent has closed', () => {
		const thrower = emptyMarks();
		thrower[20] = 2;
		const opponent = emptyMarks();
		opponent[20] = 3; // opponent closed
		const result = calcCricketThrow(20, 3, thrower, opponent);
		expect(result.newMarks).toBe(1);
		expect(result.points).toBe(0);
	});
});

describe('hasClosedAll', () => {
	it('returns false when no segments closed', () => {
		expect(hasClosedAll(createEmptyCricketMarks())).toBe(false);
	});

	it('returns false when some segments closed', () => {
		const marks = createEmptyCricketMarks();
		marks[15] = 3;
		marks[16] = 3;
		marks[17] = 3;
		expect(hasClosedAll(marks)).toBe(false);
	});

	it('returns true when all 7 segments closed', () => {
		const marks: CricketMarks = { 15: 3, 16: 3, 17: 3, 18: 3, 19: 3, 20: 3, 25: 3 };
		expect(hasClosedAll(marks)).toBe(true);
	});

	it('returns true when marks exceed 3', () => {
		const marks: CricketMarks = { 15: 5, 16: 4, 17: 3, 18: 3, 19: 3, 20: 3, 25: 3 };
		expect(hasClosedAll(marks)).toBe(true);
	});
});

describe('isCricketGameOver', () => {
	function makeState(marks: CricketMarks, points: number): CricketPlayerState {
		return { marks, points };
	}

	function allClosed(): CricketMarks {
		return { 15: 3, 16: 3, 17: 3, 18: 3, 19: 3, 20: 3, 25: 3 };
	}

	it('returns null when neither player has closed all', () => {
		const home = makeState(createEmptyCricketMarks(), 0);
		const away = makeState(createEmptyCricketMarks(), 0);
		expect(isCricketGameOver(home, away)).toBeNull();
	});

	it('returns home when home closed all with more points', () => {
		const home = makeState(allClosed(), 100);
		const away = makeState(createEmptyCricketMarks(), 50);
		expect(isCricketGameOver(home, away)).toBe('home');
	});

	it('returns away when away closed all with more points', () => {
		const home = makeState(createEmptyCricketMarks(), 50);
		const away = makeState(allClosed(), 100);
		expect(isCricketGameOver(home, away)).toBe('away');
	});

	it('returns home when home closed all with equal points', () => {
		const home = makeState(allClosed(), 50);
		const away = makeState(createEmptyCricketMarks(), 50);
		expect(isCricketGameOver(home, away)).toBe('home');
	});

	it('returns null when home closed all but has fewer points', () => {
		const home = makeState(allClosed(), 10);
		const away = makeState(createEmptyCricketMarks(), 50);
		expect(isCricketGameOver(home, away)).toBeNull();
	});

	it('returns home when both closed all and home has more points', () => {
		const home = makeState(allClosed(), 100);
		const away = makeState(allClosed(), 50);
		expect(isCricketGameOver(home, away)).toBe('home');
	});

	it('returns home when both closed all with equal points (home advantage)', () => {
		const home = makeState(allClosed(), 0);
		const away = makeState(allClosed(), 0);
		expect(isCricketGameOver(home, away)).toBe('home');
	});
});
