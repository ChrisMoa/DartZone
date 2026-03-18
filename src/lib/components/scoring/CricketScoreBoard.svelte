<script lang="ts">
	import { browser } from '$app/environment';
	import { getContext } from 'svelte';
	import type { CricketGameStore } from '$lib/stores/cricket-game.svelte.js';
	import type { SettingsStore } from '$lib/stores/settings.svelte.js';
	import { CRICKET_SEGMENTS } from '$lib/types/game.js';

	interface Props {
		game: CricketGameStore;
	}

	let { game }: Props = $props();
	const settingsStore = getContext<SettingsStore>('settings');

	const homeActive = $derived(game.current_player_id === game.home_player.id);
	const awayActive = $derived(game.current_player_id === game.away_player.id);

	const SEGMENT_LABELS: Record<number, string> = {
		15: '15', 16: '16', 17: '17', 18: '18', 19: '19', 20: '20', 25: 'Bull'
	};

	function markSymbol(count: number): string {
		if (count === 0) return '';
		if (count === 1) return '/';
		if (count === 2) return 'X';
		return '\u2A02'; // ⨂ (circled X = closed)
	}

	function markClass(count: number): string {
		if (count >= 3) return 'text-success font-bold';
		if (count > 0) return 'text-warning';
		return 'text-base-content/30';
	}

	// --- Elapsed leg timer ---
	let timerEnabled = $state(settingsStore.settings.timerEnabled);
	let elapsedSeconds = $state(0);
	let timerStarted = $state(false);
	let intervalId: ReturnType<typeof setInterval> | null = null;

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

	$effect(() => {
		if (!browser || !timerEnabled) return;
		if (game.throws.length > 0 && !timerStarted) {
			timerStarted = true;
			startTimer();
		}
	});

	$effect(() => {
		if (game.status === 'completed') stopTimer();
	});

	$effect(() => {
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		game.leg_number;
		elapsedSeconds = 0;
		timerStarted = false;
		stopTimer();
	});

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
		settingsStore.update('timerEnabled', timerEnabled);
		if (!timerEnabled) stopTimer();
		else if (timerStarted && game.status !== 'completed') startTimer();
	}
</script>

<div class="flex flex-col gap-2" data-testid="cricket-scoreboard">
	<!-- Player headers -->
	<div class="grid grid-cols-[1fr_auto_1fr] gap-1 items-center">
		<div
			class="text-center p-2 rounded-lg transition-all duration-300 {homeActive ? 'bg-base-100 ring-2 ring-primary shadow-lg shadow-primary/30' : 'bg-base-100'}"
			data-testid="cricket-home-header"
		>
			<div class="text-sm font-medium truncate {homeActive ? 'text-primary' : ''}">
				{game.home_player.first_name} {game.home_player.last_name}
			</div>
			<div class="text-2xl font-bold tabular-nums {homeActive ? 'text-primary' : ''}" data-testid="cricket-home-points">
				{game.homePoints}
			</div>
		</div>

		<div class="flex flex-col items-center gap-1 px-2">
			<div class="text-sm text-base-content/60">Leg {game.leg_number}</div>
			{#if timerEnabled}
				<div class="text-xs font-mono text-base-content/50 tabular-nums">
					{formatTime(elapsedSeconds)}
				</div>
			{/if}
			<div class="text-xs text-base-content/40">Runde {game.current_turn}</div>
			{#if game.status === 'completed'}
				<div class="badge badge-success mt-1 animate-pulse">Gewonnen!</div>
			{/if}
			<button
				class="btn btn-ghost btn-xs mt-1 opacity-40 hover:opacity-100"
				onclick={toggleTimer}
				title={timerEnabled ? 'Timer ausblenden' : 'Timer einblenden'}
			>
				{#if timerEnabled}
					<svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
						<circle cx="12" cy="12" r="10" /><path stroke-linecap="round" d="M12 6v6l4 2" />
					</svg>
				{:else}
					<svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
						<path stroke-linecap="round" d="M3 3l18 18M12 6v3m0 0a9 9 0 017.74 13.5M4.26 6.5A9 9 0 0012 21a9 9 0 005.74-2.06" />
					</svg>
				{/if}
			</button>
		</div>

		<div
			class="text-center p-2 rounded-lg transition-all duration-300 {awayActive ? 'bg-base-100 ring-2 ring-secondary shadow-lg shadow-secondary/30' : 'bg-base-100'}"
			data-testid="cricket-away-header"
		>
			<div class="text-sm font-medium truncate {awayActive ? 'text-secondary' : ''}">
				{game.away_player.first_name} {game.away_player.last_name}
			</div>
			<div class="text-2xl font-bold tabular-nums {awayActive ? 'text-secondary' : ''}" data-testid="cricket-away-points">
				{game.awayPoints}
			</div>
		</div>
	</div>

	<!-- Cricket marks table -->
	<div class="card bg-base-100 p-3">
		<table class="w-full text-center" data-testid="cricket-marks-table">
			<thead>
				<tr class="text-xs text-base-content/50">
					<th class="pb-1">Heim</th>
					<th class="pb-1">Segment</th>
					<th class="pb-1">Gast</th>
				</tr>
			</thead>
			<tbody>
				{#each CRICKET_SEGMENTS as seg (seg)}
					<tr class="border-t border-base-200">
						<td class="py-1.5 text-lg {markClass(game.homeMarks[seg] ?? 0)}" data-testid="cricket-home-mark-{seg}">
							{markSymbol(game.homeMarks[seg] ?? 0)}
						</td>
						<td class="py-1.5 font-bold text-sm">{SEGMENT_LABELS[seg]}</td>
						<td class="py-1.5 text-lg {markClass(game.awayMarks[seg] ?? 0)}" data-testid="cricket-away-mark-{seg}">
							{markSymbol(game.awayMarks[seg] ?? 0)}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
