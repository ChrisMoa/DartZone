<script lang="ts">
	import ClubCrest from '$lib/components/clubs/ClubCrest.svelte';

	interface Props {
		club_id: string;
		club_name: string;
		short_name: string;
		has_crest: boolean;
		primary_color: string;
		drink_count: number;
		max_count: number;
	}

	let { club_id, club_name, short_name, has_crest, primary_color, drink_count, max_count }: Props = $props();

	const percentage = $derived(max_count > 0 ? (drink_count / max_count) * 100 : 0);
</script>

<div class="flex items-center gap-3" data-testid="drinking-progress-row">
	<div class="flex items-center gap-2 w-36 shrink-0">
		<ClubCrest
			{club_id}
			{has_crest}
			{club_name}
			{primary_color}
			size={28}
		/>
		<span class="font-medium text-sm truncate" data-testid="drinking-progress-name">{short_name}</span>
	</div>
	<div class="flex-1 bg-base-200 rounded-full h-8 relative overflow-hidden">
		<div
			class="h-full rounded-full transition-all duration-500 ease-out flex items-center justify-end pr-3"
			style="width: {Math.max(percentage, 8)}%; background-color: {primary_color};"
			data-testid="drinking-progress-bar"
		>
			<span class="text-sm font-bold text-white drop-shadow-md" data-testid="drinking-progress-count">
				{drink_count}
			</span>
		</div>
	</div>
</div>
