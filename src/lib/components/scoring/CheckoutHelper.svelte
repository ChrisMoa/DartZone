<script lang="ts">
	import type { CheckoutRoute } from '$lib/utils/checkout.js';

	interface Props {
		remaining: number;
		checkoutRoutes: CheckoutRoute[];
	}

	let { remaining, checkoutRoutes }: Props = $props();

	function dartClass(multiplier: number): string {
		switch (multiplier) {
			case 3:
				return 'bg-warning/20 text-warning border-warning/30';
			case 2:
				return 'bg-success/20 text-success border-success/30';
			default:
				return 'bg-base-300/50 text-base-content border-base-300';
		}
	}
</script>

<div data-testid="checkout-helper">
	{#if checkoutRoutes.length > 0}
		<div class="flex flex-col gap-1 p-2 bg-success/10 rounded-lg border border-success/20">
			<span class="text-xs font-medium text-success">
				Checkout — {remaining}
			</span>
			{#each checkoutRoutes as route, i}
				<div class="flex items-center gap-1.5" data-testid="checkout-route">
					<span class="text-xs text-base-content/50 w-4">{i + 1}.</span>
					{#each route as dart}
						<span
							class="px-1.5 py-0.5 text-xs font-mono font-bold rounded border {dartClass(dart.multiplier)}"
							data-testid="checkout-dart"
						>
							{dart.label}
						</span>
					{/each}
					{#if i === 0}
						<span class="ml-auto text-xs text-warning font-medium" data-testid="optimal-badge">★ Opt</span>
					{/if}
				</div>
			{/each}
		</div>
	{:else if remaining <= 170 && remaining > 1}
		<div class="text-xs text-base-content/40 p-2">Kein Checkout moeglich</div>
	{/if}
</div>
