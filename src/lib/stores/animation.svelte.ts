import type { SpecialHit } from '$lib/types/game.js';

export interface AnimationEvent {
	id: string;
	type: SpecialHit;
	timestamp: number;
}

export function createAnimationStore() {
	let currentEvent = $state<AnimationEvent | null>(null);
	let isPlaying = $state(false);

	function trigger(type: SpecialHit) {
		if (!type || isPlaying) return;

		currentEvent = {
			id: crypto.randomUUID(),
			type,
			timestamp: Date.now()
		};
		isPlaying = true;
	}

	function dismiss() {
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
