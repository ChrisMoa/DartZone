<script lang="ts">
	import { onMount } from 'svelte';

	interface Props {
		event: string;
		mime: string;
		duration_ms: number;
		position: 'center' | 'top' | 'bottom';
		ondone: () => void;
	}

	let { event, mime, duration_ms, position, ondone }: Props = $props();

	const src = `/api/animations/${event}`;
	const isVideo = mime.startsWith('video/');
	const isLottie = mime === 'application/json';

	const positionClass = {
		center: 'items-center',
		top: 'items-start pt-12',
		bottom: 'items-end pb-12'
	}[position] ?? 'items-center';

	let timeoutId: ReturnType<typeof setTimeout>;

	onMount(() => {
		timeoutId = setTimeout(ondone, duration_ms);
		return () => clearTimeout(timeoutId);
	});
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="fixed inset-0 z-50 flex justify-center {positionClass} bg-black/40 backdrop-blur-sm pointer-events-none"
	data-testid="custom-animation-overlay"
>
	{#if isVideo}
		<!-- svelte-ignore a11y_media_has_caption -->
		<video
			{src}
			class="max-w-[80vw] max-h-[60vh] rounded-xl shadow-2xl"
			autoplay
			playsinline
			muted
			onended={ondone}
		></video>
	{:else if isLottie}
		<div class="text-white text-xl font-bold animate-pulse p-8">
			{event === 'bullseye' ? 'BULLSEYE!' : event === 'triple_twenty' ? 'T20!' : event === 'one_eighty' ? '180!' : 'CHECKOUT!'}
		</div>
	{:else}
		<img
			{src}
			alt="Animation"
			class="max-w-[80vw] max-h-[60vh] rounded-xl shadow-2xl"
		/>
	{/if}
</div>
