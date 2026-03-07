<script lang="ts">
	import { formatCheckoutRoute, type CheckoutRoute } from '$lib/utils/checkout.js';

	interface Props {
		remaining: number;
		checkoutRoute: CheckoutRoute | null;
	}

	let { remaining, checkoutRoute }: Props = $props();
</script>

<div data-testid="checkout-helper">
	{#if checkoutRoute}
		<div class="flex items-center gap-2 p-2 bg-success/10 rounded-lg border border-success/20">
			<span class="text-xs font-medium text-success">Checkout:</span>
			<span class="font-mono text-sm font-bold" data-testid="checkout-route">
				{formatCheckoutRoute(checkoutRoute)}
			</span>
		</div>
	{:else if remaining <= 170 && remaining > 1}
		<div class="text-xs text-base-content/40 p-2">Kein Checkout moeglich</div>
	{/if}
</div>
