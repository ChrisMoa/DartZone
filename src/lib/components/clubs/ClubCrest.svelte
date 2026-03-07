<script lang="ts">
	interface Props {
		crest_url: string | null;
		club_name: string;
		primary_color: string;
		size?: number;
	}

	let { crest_url, club_name, primary_color, size = 48 }: Props = $props();

	const initials = $derived(
		club_name
			.split(' ')
			.map((w) => w[0])
			.join('')
			.slice(0, 3)
			.toUpperCase()
	);
</script>

{#if crest_url}
	<img
		src={crest_url}
		alt="{club_name} Wappen"
		width={size}
		height={size}
		class="rounded-full object-cover"
		style="width: {size}px; height: {size}px;"
		data-testid="club-crest-img"
	/>
{:else}
	<div
		class="flex items-center justify-center rounded-full font-bold text-white"
		style="width: {size}px; height: {size}px; background-color: {primary_color}; font-size: {size * 0.35}px;"
		data-testid="club-crest-fallback"
	>
		{initials}
	</div>
{/if}
