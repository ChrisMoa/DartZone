<script lang="ts">
	export interface LegRecord {
		legNumber: number;
		winnerName: string;
		dartsThrown: number;
		highestTurn: number;
		checkoutScore: number;
	}

	interface Props {
		legs: LegRecord[];
		currentLegNumber: number;
	}

	let { legs, currentLegNumber }: Props = $props();

	let expanded = $state(true);

	function checkoutLabel(score: number): string {
		if (score === 50) return 'Bull';
		if (score === 25) return 'SBull';
		// Simple approximation — show the raw checkout value
		return `${score}`;
	}
</script>

<div class="card bg-base-100 shadow-sm" data-testid="leg-history">
	<div class="card-body p-3">
		<button
			class="flex items-center justify-between w-full text-left"
			onclick={() => (expanded = !expanded)}
			aria-expanded={expanded}
		>
			<h3 class="font-semibold text-sm">Leg-Verlauf</h3>
			<svg
				class="w-4 h-4 transition-transform duration-200 {expanded ? 'rotate-180' : ''}"
				fill="none" stroke="currentColor" stroke-width="2"
				viewBox="0 0 24 24"
			>
				<path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
			</svg>
		</button>

		{#if expanded}
			<div class="mt-2 flex flex-col gap-1" data-testid="leg-history-list">
				{#if legs.length === 0}
					<!-- Dummy placeholder row when no legs finished yet -->
					<div class="flex items-center gap-2 text-xs text-base-content/30 italic px-1">
						<span class="w-10">Leg 1</span>
						<span>— noch keine Legs beendet —</span>
					</div>
				{:else}
					{#each legs as leg (leg.legNumber)}
						<div class="flex items-center gap-2 text-xs px-1 py-0.5 rounded bg-base-200" data-testid="leg-history-row">
							<span class="w-10 text-base-content/60 shrink-0">Leg {leg.legNumber}</span>
							<span class="font-semibold flex items-center gap-1 flex-1 truncate">
								<span>✓</span>
								<span class="truncate">{leg.winnerName}</span>
							</span>
							<span class="text-base-content/60 shrink-0">⬤ {leg.dartsThrown}</span>
							<span class="text-base-content/60 shrink-0">★ {leg.highestTurn}</span>
							<span class="text-base-content/60 shrink-0">⊗ {checkoutLabel(leg.checkoutScore)}</span>
						</div>
					{/each}
				{/if}

				<!-- Current leg in-progress row -->
				<div class="flex items-center gap-2 text-xs px-1 py-0.5 rounded border border-dashed border-base-300" data-testid="leg-history-current">
					<span class="w-10 text-base-content/60 shrink-0">Leg {currentLegNumber}</span>
					<span class="text-base-content/40 italic">— läuft —</span>
				</div>
			</div>
		{/if}
	</div>
</div>
