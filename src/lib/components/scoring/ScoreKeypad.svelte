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

	const SECTOR_ROWS: number[][] = [
		[20, 19, 18, 17, 16],
		[15, 14, 13, 12, 11],
		[10, 9, 8, 7, 6],
		[5, 4, 3, 2, 1]
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
		emitHit(25, 1);
	}

	function handleBullseyeClick() {
		emitHit(25, 2);
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
			error = `Ungueltige Eingabe: "${textInput}"`;
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

	function multiplierBtnClass(m: Multiplier): string {
		if (activeMultiplier !== m) return 'btn-outline';
		if (m === 1) return 'btn-primary';
		if (m === 2) return 'btn-secondary';
		return 'btn-accent';
	}

	function numberBtnClass(): string {
		if (activeMultiplier === 3) return 'btn-accent btn-outline';
		if (activeMultiplier === 2) return 'btn-secondary btn-outline';
		return 'btn-ghost border-base-300';
	}

	function numberLabel(num: number): string {
		if (activeMultiplier === 3) return `T${num}`;
		if (activeMultiplier === 2) return `D${num}`;
		return `${num}`;
	}

	function scoreLabel(num: number): number {
		return num * activeMultiplier;
	}
</script>

<div class="flex flex-col gap-2" data-testid="score-keypad">
	<!-- Multiplier selector -->
	<div class="grid grid-cols-3 gap-1" data-testid="keypad-multiplier">
		<button
			class="btn btn-sm {multiplierBtnClass(1)}"
			onclick={() => setMultiplier(1)}
			{disabled}
		>Single</button>
		<button
			class="btn btn-sm {multiplierBtnClass(2)}"
			onclick={() => setMultiplier(2)}
			{disabled}
		>Double</button>
		<button
			class="btn btn-sm {multiplierBtnClass(3)}"
			onclick={() => setMultiplier(3)}
			{disabled}
		>Triple</button>
	</div>

	{#if error}
		<div class="text-xs text-error" data-testid="keypad-error">{error}</div>
	{/if}

	<!-- Number grid -->
	<div class="flex flex-col gap-1" data-testid="keypad-numbers">
		{#each SECTOR_ROWS as row}
			<div class="grid grid-cols-5 gap-1">
				{#each row as num}
					<button
						class="btn tabular-nums min-h-[2.75rem] {numberBtnClass()}"
						onclick={() => handleNumberClick(num)}
						{disabled}
					>
						<span class="flex flex-col items-center leading-tight">
							<span class="text-sm font-semibold">{numberLabel(num)}</span>
							{#if activeMultiplier > 1}
								<span class="text-[0.6rem] opacity-50">{scoreLabel(num)}</span>
							{/if}
						</span>
					</button>
				{/each}
			</div>
		{/each}
	</div>

	<!-- Bull, Bullseye, Miss row -->
	<div class="grid grid-cols-3 gap-1">
		<button
			class="btn btn-sm btn-outline btn-warning min-h-[2.75rem]"
			onclick={handleBullClick}
			{disabled}
			data-testid="keypad-bull"
		>
			<span class="flex flex-col items-center leading-tight">
				<span class="text-sm font-semibold">Bull</span>
				<span class="text-[0.6rem] opacity-60">25</span>
			</span>
		</button>
		<button
			class="btn btn-sm btn-warning min-h-[2.75rem]"
			onclick={handleBullseyeClick}
			{disabled}
			data-testid="keypad-bullseye"
		>
			<span class="flex flex-col items-center leading-tight">
				<span class="text-sm font-semibold">Bullseye</span>
				<span class="text-[0.6rem] opacity-60">50</span>
			</span>
		</button>
		<button
			class="btn btn-sm btn-ghost min-h-[2.75rem]"
			onclick={handleMissClick}
			{disabled}
			data-testid="keypad-miss"
		>Miss (0)</button>
	</div>

	<!-- Text input (compact, for advanced users) -->
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
</div>
