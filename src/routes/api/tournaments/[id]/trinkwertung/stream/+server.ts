import type { RequestHandler } from './$types.js';
import { error } from '@sveltejs/kit';
import { drinkingGameRepo } from '$lib/server/db.js';
import { onDrinkingScoreChange } from '$lib/server/drinking-events.js';

export const GET: RequestHandler = async ({ params }) => {
	const game = await drinkingGameRepo.getByTournament(params.id);
	if (!game) throw error(404, 'Keine Trinkwertung gefunden');

	const tournamentId = params.id;

	const stream = new ReadableStream({
		start(controller) {
			const encoder = new TextEncoder();

			function send(data: string) {
				try {
					controller.enqueue(encoder.encode(`data: ${data}\n\n`));
				} catch {
					// stream closed
				}
			}

			// Send initial scores immediately
			drinkingGameRepo.getByTournament(tournamentId).then(async (g) => {
				if (!g) return;
				const scores = await drinkingGameRepo.getScores(g.id);
				send(JSON.stringify({ game: g, scores }));
			});

			// Listen for changes
			const unsubscribe = onDrinkingScoreChange(async (changedTournamentId) => {
				if (changedTournamentId !== tournamentId) return;

				const g = await drinkingGameRepo.getByTournament(tournamentId);
				if (!g) return;
				const scores = await drinkingGameRepo.getScores(g.id);
				send(JSON.stringify({ game: g, scores }));
			});

			// Cleanup when client disconnects
			const keepAlive = setInterval(() => {
				try {
					controller.enqueue(encoder.encode(': keepalive\n\n'));
				} catch {
					clearInterval(keepAlive);
					unsubscribe();
				}
			}, 15000);

			// Store cleanup for cancel
			(controller as unknown as Record<string, () => void>)._cleanup = () => {
				clearInterval(keepAlive);
				unsubscribe();
			};
		},
		cancel(controller) {
			const cleanup = (controller as unknown as Record<string, () => void>)?._cleanup;
			if (cleanup) cleanup();
		}
	});

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			Connection: 'keep-alive'
		}
	});
};
