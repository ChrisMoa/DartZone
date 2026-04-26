import type { LiveMatchState } from '$lib/types/live-match.js';

export type { LiveMatchState, LiveTurnThrow } from '$lib/types/live-match.js';

const store = new Map<string, LiveMatchState>();

export function getLiveState(matchId: string): LiveMatchState | null {
	return store.get(matchId) ?? null;
}

export function setLiveState(matchId: string, state: LiveMatchState): void {
	store.set(matchId, { ...state, match_id: matchId, updated_at: Date.now() });
}

export function clearLiveState(matchId: string): void {
	store.delete(matchId);
}
