<script lang="ts">
	import { onMount } from 'svelte';

	interface Props {
		ondone?: () => void;
	}

	let { ondone }: Props = $props();

	onMount(() => {
		const timer = setTimeout(() => ondone?.(), 2000);
		return () => clearTimeout(timer);
	});
</script>

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
<div
	class="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
	data-testid="bullseye-effect"
	onclick={() => ondone?.()}
>
	<div class="bullseye-container">
		<div class="pulse-ring"></div>
		<div class="pulse-ring delay-1"></div>
		<div class="bullseye-text">BULLSEYE!</div>
	</div>
</div>

<style>
	.bullseye-container {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.pulse-ring {
		position: absolute;
		width: 120px;
		height: 120px;
		border-radius: 50%;
		border: 4px solid #e74c3c;
		animation: pulse-expand 1s ease-out forwards;
	}

	.pulse-ring.delay-1 {
		animation-delay: 0.3s;
		opacity: 0;
	}

	.bullseye-text {
		font-size: 3rem;
		font-weight: 900;
		color: #e74c3c;
		text-shadow: 0 0 20px rgba(231, 76, 60, 0.8), 0 4px 8px rgba(0, 0, 0, 0.5);
		animation: text-pop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards,
			text-fade 0.5s ease-in 1.5s forwards;
	}

	@keyframes pulse-expand {
		0% { transform: scale(0); opacity: 1; }
		100% { transform: scale(3); opacity: 0; }
	}

	@keyframes text-pop {
		0% { transform: scale(0); opacity: 0; }
		100% { transform: scale(1); opacity: 1; }
	}

	@keyframes text-fade {
		to { opacity: 0; transform: scale(1.2); }
	}
</style>
