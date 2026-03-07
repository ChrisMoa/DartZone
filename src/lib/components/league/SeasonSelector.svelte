<script lang="ts">
	import type { Season } from '$lib/types/league.js';

	interface Props {
		seasons: Season[];
		selected: string;
	}

	let { seasons, selected }: Props = $props();
</script>

<select
	class="select select-bordered w-full max-w-xs"
	value={selected}
	onchange={(e) => {
		const val = (e.target as HTMLSelectElement).value;
		if (val) window.location.href = `/seasons/${val}`;
	}}
	data-testid="season-selector"
>
	{#each seasons as season (season.id)}
		<option value={season.id}>
			{season.name}
			{#if season.is_active}(aktiv){/if}
		</option>
	{/each}
</select>
