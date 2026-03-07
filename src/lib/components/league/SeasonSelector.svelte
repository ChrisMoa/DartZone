<script lang="ts">
	import type { Tournament } from '$lib/types/league.js';

	interface Props {
		tournaments: Tournament[];
		selected: string;
	}

	let { tournaments, selected }: Props = $props();
</script>

<select
	class="select select-bordered w-full max-w-xs"
	value={selected}
	onchange={(e) => {
		const val = (e.target as HTMLSelectElement).value;
		if (val) window.location.href = `/tournaments/${val}`;
	}}
	data-testid="tournament-selector"
>
	{#each tournaments as tournament (tournament.id)}
		<option value={tournament.id}>
			{tournament.name}
			{#if tournament.is_active}(aktiv){/if}
		</option>
	{/each}
</select>
