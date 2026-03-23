<script lang="ts">
	import { browser } from '$app/environment';
	import Dartboard from '$lib/components/dartboard/Dartboard.svelte';
	import ScoreKeypad from '$lib/components/scoring/ScoreKeypad.svelte';
	import ThrowHistory from '$lib/components/scoring/ThrowHistory.svelte';
	import CheckoutHelper from '$lib/components/scoring/CheckoutHelper.svelte';
	import CompactGamePanel from '$lib/components/scoring/CompactGamePanel.svelte';
	import AnimationOverlay from '$lib/components/animations/AnimationOverlay.svelte';
	import type { LegRecord } from '$lib/components/scoring/LegHistory.svelte';
	import { getContext, onMount } from 'svelte';
	import { createGameState, type GameStore } from '$lib/stores/game.svelte.js';
	import { createCricketGameState, type CricketGameStore } from '$lib/stores/cricket-game.svelte.js';
	import { createAnimationStore } from '$lib/stores/animation.svelte.js';
	import type { SettingsStore } from '$lib/stores/settings.svelte.js';
	import type { DartThrow, Multiplier, SectorValue } from '$lib/types/game.js';
	import { CRICKET_SEGMENTS } from '$lib/types/game.js';

	const settingsStore = getContext<SettingsStore>('settings');

	let { data } = $props();

	const isCricket = $derived(data.tournament.game_mode === 'cricket');
	const legsToWin = $derived(Math.ceil(data.tournament.sets_per_match / 2));
	const startingScore = $derived(
		data.tournament.game_mode === '301' ? 301 : data.tournament.game_mode === 'cricket' ? 0 : 501
	);

	// Per-slot state
	interface SlotState {
		game: GameStore | CricketGameStore | null;
		legNumber: number;
		homeLegsWon: number;
		awayLegsWon: number;
		matchStarted: boolean;
		matchCompleted: boolean;
		homePlayerIndex: number;
		awayPlayerIndex: number;
		completedLegs: LegRecord[];
		softCheckout: boolean;
	}

	let slots = $state<SlotState[]>(
		data.matchesWithPlayers.map((mwp: (typeof data.matchesWithPlayers)[number]) => ({
			game: null,
			legNumber: 1,
			homeLegsWon: mwp.match.home_legs_won,
			awayLegsWon: mwp.match.away_legs_won,
			matchStarted: mwp.match.status !== 'scheduled',
			matchCompleted: mwp.match.status === 'completed',
			homePlayerIndex: 0,
			awayPlayerIndex: 0,
			completedLegs: [],
			softCheckout: settingsStore.settings.defaultSoftCheckout
		}))
	);

	let activeSlotIndex = $state(0);
	const activeSlot = $derived(slots[activeSlotIndex]);
	const activeMatchData = $derived(data.matchesWithPlayers[activeSlotIndex]);
	const activeGame = $derived(activeSlot?.game);

	const animations = createAnimationStore();

	// Input mode
	type InputMode = 'dartboard' | 'keypad' | 'both';
	let inputMode = $state<InputMode>(settingsStore.settings.inputMode);

	function cycleInputMode() {
		const modes: InputMode[] = ['dartboard', 'keypad', 'both'];
		const idx = modes.indexOf(inputMode);
		inputMode = modes[(idx + 1) % modes.length];
		settingsStore.update('inputMode', inputMode);
	}

	// Keyboard shortcuts: 1-4 to switch slots
	function handleKeydown(e: KeyboardEvent) {
		const num = parseInt(e.key);
		if (num >= 1 && num <= data.matchesWithPlayers.length) {
			e.preventDefault();
			activeSlotIndex = num - 1;
		}
	}

	onMount(() => {
		if (!browser) return;
		window.addEventListener('keydown', handleKeydown);
		return () => window.removeEventListener('keydown', handleKeydown);
	});

	function selectSlot(index: number) {
		activeSlotIndex = index;
	}

	let startingSlot = $state<number | null>(null);
	let startError = $state<string | null>(null);

	async function startGame(slotIndex: number, homePlayerIdx: number, awayPlayerIdx: number) {
		const mwp = data.matchesWithPlayers[slotIndex];
		const homePlayer = mwp.homePlayers[homePlayerIdx];
		const awayPlayer = mwp.awayPlayers[awayPlayerIdx];
		if (!homePlayer || !awayPlayer) return;
		if (startingSlot !== null) return;

		startingSlot = slotIndex;
		startError = null;

		try {
			const formData = new FormData();
			formData.set('match_id', mwp.match.id);

			const response = await fetch('?/startGame', {
				method: 'POST',
				body: formData,
				headers: { 'x-sveltekit-action': 'true' }
			});

			const result = await response.json();
			if (result?.type === 'failure') {
				startError = result?.data?.error ?? 'Spiel konnte nicht gestartet werden';
				return;
			}

			const slot = slots[slotIndex];
			slot.homePlayerIndex = homePlayerIdx;
			slot.awayPlayerIndex = awayPlayerIdx;

			// Use server-returned leg counts (handles resume)
			if (result?.data?.home_legs_won != null) {
				slot.homeLegsWon = result.data.home_legs_won;
				slot.awayLegsWon = result.data.away_legs_won;
				slot.legNumber = slot.homeLegsWon + slot.awayLegsWon + 1;
			}

			if (isCricket) {
				slot.game = createCricketGameState({
					match_id: mwp.match.id,
					leg_number: slot.legNumber,
					home_player: homePlayer,
					away_player: awayPlayer
				});
			} else {
				slot.game = createGameState({
					match_id: mwp.match.id,
					leg_number: slot.legNumber,
					home_player: homePlayer,
					away_player: awayPlayer,
					starting_score: startingScore,
					softCheckout: slot.softCheckout
				});
			}
			slot.matchStarted = true;
		} catch (err) {
			console.error('Error starting game:', err);
			startError = 'Netzwerkfehler beim Starten';
		} finally {
			startingSlot = null;
		}
	}

	let resettingSlot = $state<number | null>(null);

	async function resetMatchSlot(slotIndex: number) {
		const mwp = data.matchesWithPlayers[slotIndex];
		if (resettingSlot !== null) return;

		resettingSlot = slotIndex;
		startError = null;

		try {
			const formData = new FormData();
			formData.set('match_id', mwp.match.id);

			const response = await fetch('?/resetMatch', {
				method: 'POST',
				body: formData,
				headers: { 'x-sveltekit-action': 'true' }
			});

			const result = await response.json();
			if (result?.type === 'failure') {
				startError = result?.data?.error ?? 'Zuruecksetzen fehlgeschlagen';
				return;
			}

			const slot = slots[slotIndex];
			slot.game = null;
			slot.matchStarted = false;
			slot.matchCompleted = false;
			slot.homeLegsWon = 0;
			slot.awayLegsWon = 0;
			slot.legNumber = 1;
			slot.completedLegs = [];
		} catch (err) {
			console.error('Error resetting match:', err);
			startError = 'Netzwerkfehler beim Zuruecksetzen';
		} finally {
			resettingSlot = null;
		}
	}

	let refreshing = $state(false);

	async function refreshMatchStates() {
		refreshing = true;
		try {
			const response = await fetch('?/refreshMatches', {
				method: 'POST',
				body: new FormData(),
				headers: { 'x-sveltekit-action': 'true' }
			});

			const result = await response.json();
			if (result?.type === 'success' && result?.data?.statuses) {
				for (const status of result.data.statuses) {
					const idx = data.matchesWithPlayers.findIndex(
						(mwp: (typeof data.matchesWithPlayers)[number]) => mwp.match.id === status.id
					);
					if (idx >= 0 && !slots[idx].matchStarted) {
						// Update slot state from server if not locally started
						slots[idx].homeLegsWon = status.home_legs_won;
						slots[idx].awayLegsWon = status.away_legs_won;
						if (status.status === 'in_progress') {
							slots[idx].matchStarted = true;
							// Match is in_progress on server but not here — show as locked
						}
						if (status.status === 'completed') {
							slots[idx].matchCompleted = true;
						}
					}
				}
			}
		} catch (err) {
			console.error('Error refreshing:', err);
		} finally {
			refreshing = false;
		}
	}

	function handleHit(event: { sector: SectorValue; multiplier: Multiplier; score: number }) {
		const g = activeGame;
		if (!g || g.status === 'completed') return;
		try {
			g.registerThrow(event.sector, event.multiplier);
			if (g.lastSpecialHit && settingsStore.isAnimationEnabled(g.lastSpecialHit)) {
				animations.trigger(g.lastSpecialHit);
			}
		} catch (err) {
			console.error('Error registering throw:', err);
		}
	}

	function handleMiss() {
		handleHit({ sector: 0 as SectorValue, multiplier: 0 as Multiplier, score: 0 });
	}

	function handleUndo() {
		const g = activeGame;
		if (!g) return;
		g.undoLastThrow();
	}

	function extractLegRecord(g: GameStore | CricketGameStore): LegRecord {
		const throws = g.throws;
		const winnerId = g.winner_player_id!;
		const winner = winnerId === g.home_player.id ? g.home_player : g.away_player;
		const winnerThrows = throws.filter((t) => t.player_id === winnerId && !t.is_bust);
		const dartsThrown = throws.filter((t) => t.player_id === winnerId).length;
		const turnMap = new Map<number, number>();
		for (const t of winnerThrows) {
			turnMap.set(t.turn_number, (turnMap.get(t.turn_number) ?? 0) + t.score);
		}
		const highestTurn = turnMap.size > 0 ? Math.max(...turnMap.values()) : 0;
		const lastThrow = [...throws].reverse().find((t) => t.player_id === winnerId && !t.is_bust);
		const checkoutScore = lastThrow?.score ?? 0;

		return {
			legNumber: g.leg_number,
			winnerName: `${winner.first_name} ${winner.last_name}`,
			dartsThrown,
			highestTurn,
			checkoutScore
		};
	}

	let legSaving = $state(false);

	async function handleLegComplete() {
		const slot = activeSlot;
		const g = slot?.game;
		const mwp = activeMatchData;
		if (!g || !slot || !mwp || g.status !== 'completed' || !g.winner_player_id) return;
		if (legSaving) return;

		legSaving = true;
		const winnerSide = g.winner_player_id === g.home_player.id ? 'home' : 'away';
		const legRecord = extractLegRecord(g);

		try {
			const formData = new FormData();
			formData.set('match_id', mwp.match.id);
			formData.set('winner_side', winnerSide);
			const throwsData = g.throws.map((t: DartThrow) => ({
				...t,
				game_id: mwp.match.id,
				leg_number: slot.legNumber
			}));
			formData.set('throws', JSON.stringify(throwsData));

			const response = await fetch('?/completeLeg', {
				method: 'POST',
				body: formData,
				headers: { 'x-sveltekit-action': 'true' }
			});

			if (!response.ok) {
				console.error('Failed to save leg result:', response.status);
				return;
			}

			slot.completedLegs = [...slot.completedLegs, legRecord];

			if (winnerSide === 'home') {
				slot.homeLegsWon++;
			} else {
				slot.awayLegsWon++;
			}

			if (slot.homeLegsWon >= legsToWin || slot.awayLegsWon >= legsToWin) {
				slot.matchCompleted = true;
				return;
			}

			// Start next leg
			slot.legNumber++;
			const homePlayer = mwp.homePlayers[slot.homePlayerIndex];
			const awayPlayer = mwp.awayPlayers[slot.awayPlayerIndex];

			if (isCricket) {
				slot.game = createCricketGameState({
					match_id: mwp.match.id,
					leg_number: slot.legNumber,
					home_player: homePlayer,
					away_player: awayPlayer
				});
			} else {
				slot.game = createGameState({
					match_id: mwp.match.id,
					leg_number: slot.legNumber,
					home_player: homePlayer,
					away_player: awayPlayer,
					starting_score: startingScore,
					softCheckout: slot.softCheckout
				});
			}
		} catch (err) {
			console.error('Error saving leg result:', err);
		} finally {
			legSaving = false;
		}
	}
</script>

<div class="flex flex-col gap-4" data-testid="multi-play-page">
	<!-- Header -->
	<div class="flex items-center gap-4">
		<a href="/tournaments/{data.tournament.id}" class="btn btn-ghost btn-sm">Zurueck</a>
		<h1 class="text-xl font-bold flex-1">Multi-Spiel — {data.tournament.name}</h1>
		<span class="text-xs text-base-content/50">Taste 1–{data.matchesWithPlayers.length} zum Wechseln</span>
		<button
			class="btn btn-ghost btn-sm"
			onclick={refreshMatchStates}
			disabled={refreshing}
			title="Spielstatus aktualisieren"
			data-testid="multi-refresh-btn"
		>
			{#if refreshing}
				<span class="loading loading-spinner loading-xs"></span>
			{:else}
				<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
				</svg>
			{/if}
		</button>
	</div>

	{#if data.matchesWithPlayers.length === 0}
		<div class="card bg-base-100 shadow-sm">
			<div class="card-body text-center">
				<p class="text-base-content/60">Keine spielbaren Matches vorhanden.</p>
				<a href="/tournaments/{data.tournament.id}" class="btn btn-primary btn-sm mt-2">Zum Turnier</a>
			</div>
		</div>
	{:else}
		<!-- Animation Overlay -->
		<AnimationOverlay
			{animations}
			playerName={activeGame?.status === 'completed' ? `${activeGame.currentPlayer.first_name} ${activeGame.currentPlayer.last_name}` : ''}
		/>

		<!-- 2x2 Game Panels Grid -->
		<div class="grid grid-cols-2 gap-3" data-testid="multi-play-grid">
			{#each data.matchesWithPlayers as mwp, i (mwp.match.id)}
				<CompactGamePanel
					match={mwp.match}
					game={slots[i].game}
					homePlayers={mwp.homePlayers}
					awayPlayers={mwp.awayPlayers}
					homeLegsWon={slots[i].homeLegsWon}
					awayLegsWon={slots[i].awayLegsWon}
					legNumber={slots[i].legNumber}
					isActive={activeSlotIndex === i}
					panelIndex={i}
					matchStarted={slots[i].matchStarted}
					matchCompleted={slots[i].matchCompleted}
					isCricket={isCricket}
					starting={startingSlot === i}
					resetting={resettingSlot === i}
					error={startingSlot === i || resettingSlot === i || activeSlotIndex === i ? startError : null}
					onselect={() => selectSlot(i)}
					onstart={(hpi, api) => startGame(i, hpi, api)}
					onreset={() => resetMatchSlot(i)}
				/>
			{/each}
		</div>

		<!-- Shared Input Area (for the active game) -->
		{#if activeGame && activeSlot.matchStarted && !activeSlot.matchCompleted}
			<div class="card bg-base-100 shadow-sm">
				<div class="card-body p-4">
					<div class="flex items-center justify-between mb-2">
						<h2 class="font-semibold text-sm">
							Eingabe — Spiel {activeSlotIndex + 1}:
							{activeMatchData.match.home_club.short_name} vs {activeMatchData.match.away_club.short_name}
						</h2>
						<div class="flex items-center gap-2">
							<button
								class="btn btn-ghost btn-xs"
								onclick={cycleInputMode}
								title="Eingabemodus wechseln"
								aria-label="Eingabemodus wechseln"
								data-testid="multi-input-mode-toggle"
							>
								{#if inputMode === 'dartboard'}
									<span class="text-xs">Dartboard</span>
								{:else if inputMode === 'keypad'}
									<span class="text-xs">Tastatur</span>
								{:else}
									<span class="text-xs">Beides</span>
								{/if}
							</button>
						</div>
					</div>

					<div class="grid gap-4 lg:grid-cols-2">
						<div class="flex flex-col items-center gap-3">
							<!-- Dartboard -->
							{#if inputMode === 'dartboard' || inputMode === 'both'}
								<Dartboard
									size={inputMode === 'both' ? 240 : 300}
									disabled={activeGame.status === 'completed'}
									quadrant={'full'}
									highlightSegments={isCricket ? [...CRICKET_SEGMENTS] : []}
									onhit={handleHit}
								/>
								<button
									class="btn btn-ghost btn-sm"
									onclick={handleMiss}
									disabled={activeGame.status === 'completed'}
									data-testid="multi-miss-btn"
								>Miss (0)</button>
							{/if}

							<!-- Keypad -->
							{#if inputMode === 'keypad' || inputMode === 'both'}
								<div class="w-full max-w-sm">
									<ScoreKeypad
										disabled={activeGame.status === 'completed'}
										onhit={handleHit}
									/>
								</div>
							{/if}

							<!-- Action buttons -->
							<div class="flex flex-wrap items-center gap-2">
								<button
									class="btn btn-outline btn-sm"
									onclick={handleUndo}
									disabled={activeGame.throws.length === 0}
									data-testid="multi-undo-btn"
								>
									Rueckgaengig
								</button>
								{#if activeGame.status === 'completed'}
									<button
										class="btn btn-primary btn-sm"
										onclick={handleLegComplete}
										disabled={legSaving}
										data-testid="multi-next-leg-btn"
									>
										{#if legSaving}
											<span class="loading loading-spinner loading-xs"></span>
										{/if}
										Leg bestaetigen
									</button>
								{/if}
							</div>
						</div>

						<div class="flex flex-col gap-3">
							{#if !isCricket && settingsStore.settings.showCheckoutHelper}
								<CheckoutHelper remaining={activeGame.currentRemaining} checkoutRoutes={activeGame.checkoutRoutes} />
							{/if}
							<ThrowHistory throws={activeGame.throws} currentTurnThrows={activeGame.currentTurnThrows} />
						</div>
					</div>
				</div>
			</div>
		{:else if activeSlot?.matchCompleted}
			<div class="card bg-success/10 border border-success/30 shadow-sm">
				<div class="card-body text-center p-4">
					<p class="text-sm font-medium text-success">
						Spiel {activeSlotIndex + 1} beendet —
						{activeSlot.homeLegsWon > activeSlot.awayLegsWon
							? activeMatchData.match.home_club.name
							: activeMatchData.match.away_club.name} gewinnt!
					</p>
				</div>
			</div>
		{/if}
	{/if}
</div>
