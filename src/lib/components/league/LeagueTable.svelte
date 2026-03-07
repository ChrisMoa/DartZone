<script lang="ts">
	import type { Standing } from '$lib/types/league.js';
	import ClubCrest from '$lib/components/clubs/ClubCrest.svelte';

	interface Props {
		standings: Standing[];
	}

	let { standings }: Props = $props();
</script>

<div class="overflow-x-auto" data-testid="league-table">
	<table class="table">
		<thead>
			<tr>
				<th class="w-8">#</th>
				<th>Verein</th>
				<th class="text-center">Sp</th>
				<th class="text-center">S</th>
				<th class="text-center">U</th>
				<th class="text-center">N</th>
				<th class="text-center">LF</th>
				<th class="text-center">LA</th>
				<th class="text-center">LD</th>
				<th class="text-center font-bold">Pkt</th>
			</tr>
		</thead>
		<tbody>
			{#each standings as standing, i (standing.club_id)}
				<tr class="hover" data-testid="league-table-row">
					<td class="font-bold">{i + 1}</td>
					<td>
						<div class="flex items-center gap-2">
							<ClubCrest
								club_id={standing.club_id}
								has_crest={standing.has_crest}
								crest_url={standing.crest_url}
								club_name={standing.club_name}
								primary_color="#666"
								size={28}
							/>
							<div>
								<span class="font-medium" data-testid="standing-club-name">{standing.club_name}</span>
								<span class="text-xs text-base-content/50 ml-1">({standing.short_name})</span>
							</div>
						</div>
					</td>
					<td class="text-center" data-testid="standing-played">{standing.played}</td>
					<td class="text-center" data-testid="standing-won">{standing.won}</td>
					<td class="text-center" data-testid="standing-drawn">{standing.drawn}</td>
					<td class="text-center" data-testid="standing-lost">{standing.lost}</td>
					<td class="text-center">{standing.legs_for}</td>
					<td class="text-center">{standing.legs_against}</td>
					<td class="text-center">{standing.legs_for - standing.legs_against}</td>
					<td class="text-center font-bold text-primary" data-testid="standing-points">{standing.points}</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
