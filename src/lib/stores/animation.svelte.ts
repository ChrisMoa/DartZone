import type { SpecialHit } from '$lib/types/game.js';

export interface AnimationEvent {
	id: string;
	type: SpecialHit;
	timestamp: number;
}

const SAFETY_TIMEOUT_MS = 10_000;

export function createAnimationStore() {
	let currentEvent = $state<AnimationEvent | null>(null);
	let isPlaying = $state(false);
	let safetyTimer: ReturnType<typeof setTimeout> | null = null;

	function trigger(type: SpecialHit) {
		if (!type || isPlaying) return;

		currentEvent = {
			id: crypto.randomUUID(),
			type,
			timestamp: Date.now()
		};
		isPlaying = true;

		// Safety timeout: auto-dismiss if animation callback never fires
		safetyTimer = setTimeout(dismiss, SAFETY_TIMEOUT_MS);
	}

	function dismiss() {
		if (safetyTimer) {
			clearTimeout(safetyTimer);
			safetyTimer = null;
		}
		currentEvent = null;
		isPlaying = false;
	}

	return {
		get currentEvent() { return currentEvent; },
		get isPlaying() { return isPlaying; },
		trigger,
		dismiss
	};
}

export type AnimationStore = ReturnType<typeof createAnimationStore>;
