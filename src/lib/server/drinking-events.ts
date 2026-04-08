type Listener = (tournamentId: string) => void;

const listeners = new Set<Listener>();

export function onDrinkingScoreChange(listener: Listener): () => void {
	listeners.add(listener);
	return () => listeners.delete(listener);
}

export function emitDrinkingScoreChange(tournamentId: string): void {
	for (const listener of listeners) {
		listener(tournamentId);
	}
}
