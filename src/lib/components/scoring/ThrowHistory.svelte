<script lang="ts">
	import type { DartThrow } from '$lib/types/game.js';

	interface Props {
		throws: DartThrow[];
		currentTurnThrows: DartThrow[];
	}

	let { throws, currentTurnThrows }: Props = $props();

	function formatThrow(t: DartThrow): string {
		if (t.is_bust) return 'BUST';
		if (t.sector === 0 || t.multiplier === 0) return 'Miss';
		const prefix = t.multiplier === 3 ? 'T' : t.multiplier === 2 ? 'D' : 'S';
		return `${prefix}${t.sector}`;
	}

	function throwClass(t: DartThrow): string {
		if (t.is_bust) return 'text-error font-bold';
		if (t.multiplier === 3) return 'text-warning font-semibold';
		if (t.multiplier === 2) return 'text-success font-semibold';
		return '';
	}
</script>

<div class="flex flex-col gap-2" data-testid="throw-history">
	<div class="text-sm font-medium">Aktuelle Runde</div>
	<div class="flex gap-3" data-testid="current-turn-throws">
		{#each [0, 1, 2] as i}
			<div class="flex-1 text-center p-2 rounded bg-base-200 min-h-[3rem] flex items-center justify-center">
				{#if currentTurnThrows[i]}
					<span class={throwClass(currentTurnThrows[i])} data-testid="throw-value">
						{formatThrow(currentTurnThrows[i])}
						{#if !currentTurnThrows[i].is_bust}
							<span class="text-xs opacity-60 block">{currentTurnThrows[i].score}</span>
						{/if}
					</span>
				{:else}
					<span class="text-base-content/30">-</span>
				{/if}
			</div>
		{/each}
	</div>

	{#if throws.length > 0}
		<div class="text-sm font-medium mt-2">Verlauf</div>
		<div class="max-h-32 overflow-y-auto text-xs" data-testid="throw-log">
			{#each [...throws].reverse().slice(0, 15) as t (t.id)}
				<div class="flex justify-between py-0.5 border-b border-base-200">
					<span class="opacity-60">R{t.turn_number} D{t.dart_number}</span>
					<span class={throwClass(t)}>{formatThrow(t)}</span>
					<span>{t.score}</span>
				</div>
			{/each}
		</div>
	{/if}
</div>
