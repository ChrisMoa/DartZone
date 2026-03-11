<script lang="ts">
	import type { Multiplier, SectorValue } from '$lib/types/game.js';
	import { calcScore } from '$lib/utils/scoring.js';

	interface Props {
		disabled?: boolean;
		onhit?: (event: { sector: SectorValue; multiplier: Multiplier; score: number }) => void;
	}

	let { disabled = false, onhit }: Props = $props();

	let activeMultiplier = $state<Multiplier>(1);
	let error = $state<string | null>(null);
	let textInput = $state('');

	const SECTOR_NUMBERS: number[] = [
		20, 19, 18, 17, 16, 15,
		14, 13, 12, 11, 10, 9,
		8, 7, 6, 5, 4, 3, 2, 1
	];

	function emitHit(sector: SectorValue, multiplier: Multiplier) {
		if (disabled) return;
		error = null;

		// Validate: no triple on bull
		if (sector === 25 && multiplier === 3) {
			error = 'Triple Bull gibt es nicht';
			return;
		}

		const score = calcScore(sector, multiplier);
		onhit?.({ sector, multiplier, score });
		activeMultiplier = 1;
	}

	function handleNumberClick(num: number) {
		emitHit(num as SectorValue, activeMultiplier);
	}

	function handleBullClick() {
		if (activeMultiplier === 3) {
			error = 'Triple Bull gibt es nicht';
			return;
		}
		const mult = activeMultiplier === 1 ? 1 : 2;
		emitHit(25, mult as Multiplier);
	}

	function handleMissClick() {
		emitHit(0 as SectorValue, 0);
	}

	function setMultiplier(m: Multiplier) {
		error = null;
		activeMultiplier = m;
	}

	// --- Text input parsing ---
	function parseNotation(input: string): { sector: SectorValue; multiplier: Multiplier } | null {
		const s = input.trim().toUpperCase();
		if (!s) return null;

		// Miss
		if (s === '0' || s === 'MISS' || s === 'M') {
			return { sector: 0 as SectorValue, multiplier: 0 };
		}

		// Double Bull / Bullseye
		if (s === 'DB' || s === 'DBULL' || s === '50' || s === 'BULLSEYE') {
			return { sector: 25, multiplier: 2 };
		}

		// Single Bull
		if (s === 'BULL' || s === 'SBULL' || s === '25') {
			return { sector: 25, multiplier: 1 };
		}

		// Prefixed notation: T20, D16, S5
		const match = s.match(/^([TDS])(\d{1,2})$/);
		if (match) {
			const prefix = match[1];
			const num = parseInt(match[2], 10);
			if (num < 1 || num > 20) return null;

			const multiplier: Multiplier = prefix === 'T' ? 3 : prefix === 'D' ? 2 : 1;
			return { sector: num as SectorValue, multiplier };
		}

		// Plain number: 1-20
		const num = parseInt(s, 10);
		if (!isNaN(num) && num >= 1 && num <= 20) {
			return { sector: num as SectorValue, multiplier: 1 };
		}

		return null;
	}

	function handleTextSubmit() {
		if (disabled) return;
		const parsed = parseNotation(textInput);
		if (!parsed) {
			error = `Ungültige Eingabe: "${textInput}"`;
			return;
		}

		// Validate triple bull
		if (parsed.sector === 25 && parsed.multiplier === 3) {
			error = 'Triple Bull gibt es nicht';
			return;
		}

		emitHit(parsed.sector, parsed.multiplier);
		textInput = '';
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			handleTextSubmit();
		}
	}

	const multiplierLabel = $derived(
		activeMultiplier === 3 ? 'Triple' : activeMultiplier === 2 ? 'Double' : 'Single'
	);
</script>

<div class="flex flex-col gap-3" data-testid="score-keypad">
	<!-- Text input -->
	<div class="flex gap-2">
		<input
			type="text"
			class="input input-bordered input-sm flex-1 font-mono"
			placeholder="T20, D16, Bull, 0…"
			bind:value={textInput}
			onkeydown={handleKeydown}
			{disabled}
			data-testid="keypad-text-input"
		/>
		<button
			class="btn btn-primary btn-sm"
			onclick={handleTextSubmit}
			{disabled}
			data-testid="keypad-submit-btn"
		>OK</button>
	</div>

	{#if error}
		<div class="text-xs text-error" data-testid="keypad-error">{error}</div>
	{/if}

	<!-- Multiplier selector -->
	<div class="flex gap-1" data-testid="keypad-multiplier">
		<button
			class="btn btn-sm flex-1 {activeMultiplier === 1 ? 'btn-primary' : 'btn-outline'}"
			onclick={() => setMultiplier(1)}
			{disabled}
		>Single</button>
		<button
			class="btn btn-sm flex-1 {activeMultiplier === 2 ? 'btn-secondary' : 'btn-outline'}"
			onclick={() => setMultiplier(2)}
			{disabled}
		>Double</button>
		<button
			class="btn btn-sm flex-1 {activeMultiplier === 3 ? 'btn-accent' : 'btn-outline'}"
			onclick={() => setMultiplier(3)}
			{disabled}
		>Triple</button>
	</div>

	<!-- Number grid -->
	<div class="grid grid-cols-5 gap-1" data-testid="keypad-numbers">
		{#each SECTOR_NUMBERS as num}
			<button
				class="btn btn-sm tabular-nums {activeMultiplier === 3 ? 'btn-accent btn-outline' : activeMultiplier === 2 ? 'btn-secondary btn-outline' : 'btn-ghost'}"
				onclick={() => handleNumberClick(num)}
				{disabled}
			>
				{activeMultiplier === 3 ? 'T' : activeMultiplier === 2 ? 'D' : ''}{num}
			</button>
		{/each}
	</div>

	<!-- Bull and Miss row -->
	<div class="flex gap-1">
		<button
			class="btn btn-sm flex-1 {activeMultiplier === 2 ? 'btn-warning' : 'btn-outline btn-warning'}"
			onclick={handleBullClick}
			{disabled}
			data-testid="keypad-bull"
		>
			{activeMultiplier === 2 ? 'Bullseye (50)' : 'Bull (25)'}
		</button>
		<button
			class="btn btn-sm flex-1 btn-ghost"
			onclick={handleMissClick}
			{disabled}
			data-testid="keypad-miss"
		>Miss (0)</button>
	</div>

	<div class="text-xs text-base-content/40 text-center">
		Modus: {multiplierLabel} — oder Kurzform eingeben (T20, D16, Bull)
	</div>
</div>
