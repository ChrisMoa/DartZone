<script lang="ts">
	import { browser } from '$app/environment';
	import type { GameStore } from '$lib/stores/game.svelte.js';

	interface Props {
		game: GameStore;
	}

	let { game }: Props = $props();

	const homeActive = $derived(game.current_player_id === game.home_player.id);
	const awayActive = $derived(game.current_player_id === game.away_player.id);

	// --- Elapsed leg timer ---
	const TIMER_STORAGE_KEY = 'dartzone_timer_enabled';

	let timerEnabled = $state(
		browser ? (localStorage.getItem(TIMER_STORAGE_KEY) ?? 'true') !== 'false' : true
	);
	let elapsedSeconds = $state(0);
	let timerStarted = $state(false);
	let intervalId = $state<ReturnType<typeof setInterval> | null>(null);

	function formatTime(secs: number): string {
		const m = Math.floor(secs / 60).toString().padStart(2, '0');
		const s = (secs % 60).toString().padStart(2, '0');
		return `${m}:${s}`;
	}

	function startTimer() {
		if (intervalId) return;
		intervalId = setInterval(() => {
			if (!document.hidden) elapsedSeconds++;
		}, 1000);
	}

	function stopTimer() {
		if (intervalId) {
			clearInterval(intervalId);
			intervalId = null;
		}
	}

	// Start timer on first throw of this leg
	$effect(() => {
		if (!browser || !timerEnabled) return;
		if (game.throws.length > 0 && !timerStarted) {
			timerStarted = true;
			startTimer();
		}
	});

	// Stop timer when leg completes
	$effect(() => {
		if (game.status === 'completed') {
			stopTimer();
		}
	});

	// Reset when leg_number changes (new game object passed in)
	$effect(() => {
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		game.leg_number; // reactive dependency
		elapsedSeconds = 0;
		timerStarted = false;
		stopTimer();
	});

	// Page Visibility API — pause timer when tab is hidden
	$effect(() => {
		if (!browser) return;
		function handleVisibility() {
			if (document.hidden) {
				stopTimer();
			} else if (timerStarted && game.status !== 'completed') {
				startTimer();
			}
		}
		document.addEventListener('visibilitychange', handleVisibility);
		return () => document.removeEventListener('visibilitychange', handleVisibility);
	});

	function toggleTimer() {
		timerEnabled = !timerEnabled;
		if (browser) localStorage.setItem(TIMER_STORAGE_KEY, timerEnabled ? 'true' : 'false');
		if (!timerEnabled) stopTimer();
		else if (timerStarted && game.status !== 'completed') startTimer();
	}
</script>

<div class="grid grid-cols-3 gap-2" data-testid="scoreboard">
	<div
		class="card p-4 text-center transition-all duration-300 {homeActive ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-content ring-2 ring-primary shadow-lg shadow-primary/30' : 'bg-base-100'}"
		data-testid="scoreboard-home"
	>
		<div class="text-sm font-medium truncate" data-testid="scoreboard-home-name">
			{game.home_player.first_name} {game.home_player.last_name}
		</div>
		<div class="text-4xl font-bold my-2 tabular-nums" data-testid="scoreboard-home-remaining">
			{game.home_remaining}
		</div>
		<div class="text-xs opacity-70" data-testid="scoreboard-home-avg">
			Avg: {game.homeAverage.toFixed(1)}
		</div>
	</div>

	<div class="flex flex-col items-center justify-center gap-1">
		<div class="text-sm text-base-content/60">Leg {game.leg_number}</div>

		{#if timerEnabled}
			<div class="text-xs font-mono text-base-content/50 tabular-nums" data-testid="scoreboard-timer">
				{formatTime(elapsedSeconds)}
			</div>
		{/if}

		<div class="text-xs text-base-content/40">Runde {game.current_turn}</div>

		{#if game.status === 'completed'}
			<div class="badge badge-success mt-1 animate-pulse" data-testid="scoreboard-completed">Checkout!</div>
		{/if}

		<button
			class="btn btn-ghost btn-xs mt-1 opacity-40 hover:opacity-100"
			onclick={toggleTimer}
			title={timerEnabled ? 'Timer ausblenden' : 'Timer einblenden'}
			data-testid="scoreboard-timer-toggle"
		>
			{#if timerEnabled}
				<!-- Clock icon -->
				<svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
					<circle cx="12" cy="12" r="10" /><path stroke-linecap="round" d="M12 6v6l4 2" />
				</svg>
			{:else}
				<!-- Clock-off icon -->
				<svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
					<path stroke-linecap="round" d="M3 3l18 18M12 6v3m0 0a9 9 0 017.74 13.5M4.26 6.5A9 9 0 0012 21a9 9 0 005.74-2.06" />
				</svg>
			{/if}
		</button>
	</div>

	<div
		class="card p-4 text-center transition-all duration-300 {awayActive ? 'bg-gradient-to-br from-secondary to-secondary/80 text-secondary-content ring-2 ring-secondary shadow-lg shadow-secondary/30' : 'bg-base-100'}"
		data-testid="scoreboard-away"
	>
		<div class="text-sm font-medium truncate" data-testid="scoreboard-away-name">
			{game.away_player.first_name} {game.away_player.last_name}
		</div>
		<div class="text-4xl font-bold my-2 tabular-nums" data-testid="scoreboard-away-remaining">
			{game.away_remaining}
		</div>
		<div class="text-xs opacity-70" data-testid="scoreboard-away-avg">
			Avg: {game.awayAverage.toFixed(1)}
		</div>
	</div>
</div>
