<script lang="ts">
	interface Props {
		club_id?: string;
		crest_url?: string | null;
		has_crest?: boolean;
		club_name: string;
		primary_color: string;
		secondary_color?: string;
		size?: number;
	}

	let { club_id, crest_url, has_crest = false, club_name, primary_color, secondary_color = '#ffffff', size = 48 }: Props = $props();

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
		class="object-cover"
		style="width: {size}px; height: {size}px;"
		data-testid="club-crest-img"
	/>
{:else}
	<!-- Dummy shield crest – replace by uploading a real crest in club settings -->
	<svg
		width={size}
		height={size}
		viewBox="0 0 100 110"
		xmlns="http://www.w3.org/2000/svg"
		data-testid="club-crest-fallback"
		aria-label="{club_name} Wappen"
	>
		<!-- Shield shape -->
		<path
			d="M50 4 L96 20 L96 58 C96 80 73 98 50 106 C27 98 4 80 4 58 L4 20 Z"
			fill={primary_color}
			stroke={secondary_color}
			stroke-width="3"
		/>
		<!-- Inner shield outline -->
		<path
			d="M50 14 L86 27 L86 57 C86 75 67 90 50 97 C33 90 14 75 14 57 L14 27 Z"
			fill="none"
			stroke={secondary_color}
			stroke-width="1.5"
			opacity="0.5"
		/>
		<!-- Initials -->
		<text
			x="50"
			y="62"
			text-anchor="middle"
			dominant-baseline="middle"
			fill={secondary_color}
			font-family="system-ui, sans-serif"
			font-weight="bold"
			font-size={initials.length > 2 ? 22 : 26}
		>{initials}</text>
	</svg>
{/if}
