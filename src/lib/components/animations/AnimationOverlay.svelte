<script lang="ts">
	import type { AnimationStore } from '$lib/stores/animation.svelte.js';
	import BullseyeEffect from './BullseyeEffect.svelte';
	import TripleTwentyEffect from './TripleTwentyEffect.svelte';
	import OneEightyEffect from './OneEightyEffect.svelte';
	import CheckoutEffect from './CheckoutEffect.svelte';

	interface Props {
		animations: AnimationStore;
		playerName?: string;
	}

	let { animations, playerName = '' }: Props = $props();
</script>

{#if animations.currentEvent}
	{#if animations.currentEvent.type === 'bullseye'}
		<BullseyeEffect ondone={() => animations.dismiss()} />
	{:else if animations.currentEvent.type === 'triple_twenty'}
		<TripleTwentyEffect ondone={() => animations.dismiss()} />
	{:else if animations.currentEvent.type === 'one_eighty'}
		<OneEightyEffect ondone={() => animations.dismiss()} />
	{:else if animations.currentEvent.type === 'checkout'}
		<CheckoutEffect {playerName} ondone={() => animations.dismiss()} />
	{/if}
{/if}
