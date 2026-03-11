<script lang="ts">
	import { onMount } from 'svelte';

	interface Props {
		playerName?: string;
		ondone?: () => void;
	}

	let { playerName = '', ondone }: Props = $props();

	const confetti = Array.from({ length: 30 }, (_, i) => ({
		id: i,
		color: ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#ffd700'][i % 7],
		left: Math.random() * 100,
		delay: Math.random() * 0.5,
		duration: 1.5 + Math.random() * 1,
		drift: (Math.random() - 0.5) * 200,
		size: 4 + Math.random() * 8,
		isRect: Math.random() > 0.5
	}));

	onMount(() => {
		const timer = setTimeout(() => ondone?.(), 3500);
		return () => clearTimeout(timer);
	});
</script>

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
<div
	class="fixed inset-0 z-50 flex items-start justify-center pt-20 overflow-hidden pointer-events-none"
	data-testid="checkout-effect"
>
	{#each confetti as c (c.id)}
		<div
			class="confetti-piece"
			style="
				left: {c.left}%;
				background-color: {c.color};
				width: {c.size}px;
				height: {c.isRect ? c.size * 2 : c.size}px;
				border-radius: {c.isRect ? '2px' : '50%'};
				animation-delay: {c.delay}s;
				animation-duration: {c.duration}s;
				--drift: {c.drift}px;
			"
		></div>
	{/each}

	<div class="checkout-banner">
		<div class="text-3xl font-black">CHECKOUT!</div>
		{#if playerName}
			<div class="text-lg mt-1">{playerName} gewinnt das Leg!</div>
		{/if}
	</div>
</div>

<style>
	.pointer-events-none {
		pointer-events: none;
	}

	.confetti-piece {
		position: absolute;
		top: -20px;
		pointer-events: none;
		animation: confetti-fall linear forwards;
	}

	.checkout-banner {
		position: relative;
		background: oklch(0.72 0.19 142.5);
		color: white;
		padding: 1rem 2rem;
		border-radius: 1rem;
		box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
		text-align: center;
		text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
		animation: banner-enter 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards,
			banner-exit 0.5s ease-in 3s forwards;
	}

	@keyframes confetti-fall {
		0% { transform: translateY(0) translateX(0) rotate(0deg); opacity: 1; }
		100% { transform: translateY(100vh) translateX(var(--drift)) rotate(720deg); opacity: 0; }
	}

	@keyframes banner-enter {
		0% { transform: translateY(-100px); opacity: 0; }
		100% { transform: translateY(0); opacity: 1; }
	}

	@keyframes banner-exit {
		to { transform: translateY(-50px); opacity: 0; }
	}
</style>
