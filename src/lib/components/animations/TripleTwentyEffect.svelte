<script lang="ts">
	import { onMount } from 'svelte';

	interface Props {
		ondone?: () => void;
	}

	let { ondone }: Props = $props();

	onMount(() => {
		const timer = setTimeout(() => ondone?.(), 1800);
		return () => clearTimeout(timer);
	});
</script>

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
<div
	class="fixed inset-0 z-50 flex items-center justify-center bg-black/20"
	data-testid="triple-twenty-effect"
	onclick={() => ondone?.()}
>
	<div class="streak"></div>
	<div class="t20-text">T20!</div>
</div>

<style>
	.streak {
		position: absolute;
		height: 4px;
		width: 200px;
		top: 50%;
		background: linear-gradient(90deg, transparent, #ff6600, #ff3300, transparent);
		filter: blur(2px);
		animation: streak-move 0.6s ease-in forwards;
	}

	.t20-text {
		font-size: 3rem;
		font-weight: 900;
		color: #ff6600;
		text-shadow: 0 0 20px rgba(255, 102, 0, 0.8), 0 4px 8px rgba(0, 0, 0, 0.5);
		animation: text-pop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.1s both,
			text-fade 0.5s ease-in 1.3s forwards;
	}

	@keyframes streak-move {
		0% { transform: translateX(-100vw); opacity: 0.8; }
		100% { transform: translateX(100vw); opacity: 0; }
	}

	@keyframes text-pop {
		0% { transform: scale(0) rotate(-15deg); opacity: 0; }
		100% { transform: scale(1.2) rotate(0deg); opacity: 1; }
	}

	@keyframes text-fade {
		to { opacity: 0; transform: scale(1); }
	}
</style>
