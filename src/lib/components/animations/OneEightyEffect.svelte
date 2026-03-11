<script lang="ts">
	import { onMount } from 'svelte';

	interface Props {
		ondone?: () => void;
	}

	let { ondone }: Props = $props();

	onMount(() => {
		const timer = setTimeout(() => ondone?.(), 2500);
		return () => clearTimeout(timer);
	});
</script>

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
<div
	class="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
	data-testid="one-eighty-effect"
>
	<div class="backdrop"></div>
	<div class="one-eighty-text">180!</div>
</div>

<style>
	.pointer-events-none {
		pointer-events: none;
	}

	.backdrop {
		position: absolute;
		inset: 0;
		background: radial-gradient(circle, rgba(255, 215, 0, 0.5) 0%, transparent 70%);
		animation: backdrop-flash 0.3s ease-out forwards, backdrop-fade 0.5s ease-in 2s forwards;
	}

	.one-eighty-text {
		position: relative;
		font-size: 6rem;
		font-weight: 900;
		color: #ffd700;
		text-shadow: 0 0 40px rgba(255, 215, 0, 0.8), 0 0 80px rgba(255, 215, 0, 0.4),
			0 4px 8px rgba(0, 0, 0, 0.5);
		animation: text-entrance 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.1s both,
			text-glow 1s ease-in-out 0.6s 2,
			text-exit 0.5s ease-in 2s forwards;
	}

	@keyframes backdrop-flash {
		0% { opacity: 0; }
		100% { opacity: 1; }
	}

	@keyframes backdrop-fade {
		to { opacity: 0; }
	}

	@keyframes text-entrance {
		0% { transform: scale(0) rotate(-30deg); opacity: 0; }
		100% { transform: scale(1) rotate(0deg); opacity: 1; }
	}

	@keyframes text-glow {
		0%, 100% { text-shadow: 0 0 40px rgba(255, 215, 0, 0.8), 0 0 80px rgba(255, 215, 0, 0.4), 0 4px 8px rgba(0, 0, 0, 0.5); }
		50% { text-shadow: 0 0 60px rgba(255, 215, 0, 1), 0 0 120px rgba(255, 215, 0, 0.6), 0 4px 8px rgba(0, 0, 0, 0.5); }
	}

	@keyframes text-exit {
		to { transform: scale(1.5); opacity: 0; }
	}
</style>
