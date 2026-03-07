<script lang="ts">
	interface Props {
		club_id?: string;
		crest_url?: string | null;
		has_crest?: boolean;
		club_name: string;
		primary_color: string;
		size?: number;
	}

	let { club_id, crest_url, has_crest = false, club_name, primary_color, size = 48 }: Props = $props();

	const imgSrc = $derived(
		has_crest && club_id
			? `/api/clubs/${club_id}/crest`
			: crest_url ?? null
	);

	const initials = $derived(
		club_name
			.split(' ')
			.map((w) => w[0])
			.join('')
			.slice(0, 3)
			.toUpperCase()
	);
</script>

{#if imgSrc}
	<img
		src={imgSrc}
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
