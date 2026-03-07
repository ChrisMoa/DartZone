<script lang="ts">
	import type { Club } from '$lib/types/club.js';
	import ClubCrest from './ClubCrest.svelte';

	interface Props {
		club: Club;
		href?: string;
	}

	let { club, href = `/clubs/${club.id}` }: Props = $props();
</script>

<a
	{href}
	class="card card-border bg-base-100 shadow-sm transition-shadow hover:shadow-md"
	data-testid="club-card"
>
	<div class="card-body flex-row items-center gap-4">
		<ClubCrest
			club_id={club.id}
			has_crest={club.has_crest}
			crest_url={club.crest_url}
			club_name={club.name}
			primary_color={club.primary_color}
			size={56}
		/>
		<div class="flex-1 min-w-0">
			<h2 class="card-title text-base" data-testid="club-card-name">{club.name}</h2>
			<p class="text-sm text-base-content/60" data-testid="club-card-short-name">{club.short_name}</p>
		</div>
		<div class="flex gap-1">
			<span
				class="inline-block h-4 w-4 rounded-full border border-base-300"
				style="background-color: {club.primary_color};"
			></span>
			<span
				class="inline-block h-4 w-4 rounded-full border border-base-300"
				style="background-color: {club.secondary_color};"
			></span>
		</div>
	</div>
</a>
