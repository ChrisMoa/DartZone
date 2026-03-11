<script lang="ts">
	import { onMount } from 'svelte';
	import type { AnimationStore } from '$lib/stores/animation.svelte.js';
	import BullseyeEffect from './BullseyeEffect.svelte';
	import TripleTwentyEffect from './TripleTwentyEffect.svelte';
	import OneEightyEffect from './OneEightyEffect.svelte';
	import CheckoutEffect from './CheckoutEffect.svelte';
	import CustomAnimationPlayer from './CustomAnimationPlayer.svelte';

	interface CustomAssetMeta {
		event: string;
		mime: string;
		duration_ms: number;
		position: 'center' | 'top' | 'bottom';
	}

	interface Props {
		animations: AnimationStore;
		playerName?: string;
	}

	let { animations, playerName = '' }: Props = $props();

	let customAssets = $state<Record<string, CustomAssetMeta | null>>({});

	onMount(async () => {
		try {
			const res = await fetch('/api/animations');
			if (res.ok) {
				const assets: CustomAssetMeta[] = await res.json();
				for (const asset of assets) {
					customAssets[asset.event] = asset;
				}
			}
		} catch { /* fallback to defaults */ }
	});

	function hasCustomAsset(eventType: string): boolean {
		return customAssets[eventType] != null;
	}

	function getCustomAsset(eventType: string): CustomAssetMeta | null {
		return customAssets[eventType] ?? null;
	}
</script>

{#if animations.currentEvent}
	{@const eventType = animations.currentEvent.type}
	{@const custom = eventType ? getCustomAsset(eventType) : null}
	{#if custom && eventType}
		<CustomAnimationPlayer
			event={eventType}
			mime={custom.mime}
			duration_ms={custom.duration_ms}
			position={custom.position}
			ondone={() => animations.dismiss()}
		/>
	{:else if eventType === 'bullseye'}
		<BullseyeEffect ondone={() => animations.dismiss()} />
	{:else if eventType === 'triple_twenty'}
		<TripleTwentyEffect ondone={() => animations.dismiss()} />
	{:else if eventType === 'one_eighty'}
		<OneEightyEffect ondone={() => animations.dismiss()} />
	{:else if eventType === 'checkout'}
		<CheckoutEffect {playerName} ondone={() => animations.dismiss()} />
	{/if}
{/if}
