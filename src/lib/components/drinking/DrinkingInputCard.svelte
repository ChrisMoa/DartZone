<script lang="ts">
	import ClubCrest from '$lib/components/clubs/ClubCrest.svelte';

	interface Props {
		club_id: string;
		club_name: string;
		has_crest: boolean;
		primary_color: string;
		drink_count: number;
		disabled?: boolean;
		onincrement?: () => void;
		ondecrement?: () => void;
	}

	let {
		club_id,
		club_name,
		has_crest,
		primary_color,
		drink_count,
		disabled = false,
		onincrement,
		ondecrement
	}: Props = $props();
</script>

<div class="card bg-base-100 shadow-sm" data-testid="drinking-input-card">
	<div class="card-body p-4 flex-row items-center gap-4">
		<ClubCrest
			{club_id}
			{has_crest}
			{club_name}
			{primary_color}
			size={40}
		/>
		<div class="flex flex-col flex-1 min-w-0">
			<span class="font-semibold truncate" data-testid="drinking-input-name">{club_name}</span>
			<span class="text-2xl font-bold tabular-nums" data-testid="drinking-input-count">
				{drink_count}
			</span>
		</div>
		<div class="flex flex-col gap-2">
			<button
				type="button"
				class="btn btn-success btn-lg"
				{disabled}
				onclick={onincrement}
				data-testid="drinking-increment-btn"
			>
				+
			</button>
			<button
				type="button"
				class="btn btn-outline btn-sm"
				disabled={disabled || drink_count === 0}
				onclick={ondecrement}
				data-testid="drinking-decrement-btn"
			>
				-
			</button>
		</div>
	</div>
</div>
