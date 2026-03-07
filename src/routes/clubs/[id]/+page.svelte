<script lang="ts">
	import ClubCrest from '$lib/components/clubs/ClubCrest.svelte';

	let { data } = $props();
</script>

<div class="flex flex-col gap-6">
	<div class="flex items-center gap-4">
		<a href="/clubs" class="btn btn-ghost btn-sm">Zurueck</a>
	</div>

	<div class="card bg-base-100 shadow-sm">
		<div class="card-body">
			<div class="flex items-center gap-6">
				<ClubCrest
					club_id={data.club.id}
					has_crest={data.club.has_crest}
					crest_url={data.club.crest_url}
					club_name={data.club.name}
					primary_color={data.club.primary_color}
					size={80}
				/>
				<div>
					<h1 class="text-2xl font-bold" data-testid="club-detail-name">{data.club.name}</h1>
					<p class="text-base-content/60">{data.club.short_name}</p>
					{#if data.club.contact_email}
						<p class="text-sm mt-1">{data.club.contact_email}</p>
					{/if}
				</div>
				<div class="ml-auto flex gap-2">
					<a href="/clubs/{data.club.id}/edit" class="btn btn-outline btn-sm" data-testid="edit-club-btn">Bearbeiten</a>
					<form method="POST" action="?/delete">
						<button type="submit" class="btn btn-error btn-outline btn-sm" data-testid="delete-club-btn">Loeschen</button>
					</form>
				</div>
			</div>

			<div class="flex gap-2 mt-4">
				<span
					class="inline-block h-6 w-6 rounded-full border border-base-300"
					style="background-color: {data.club.primary_color};"
				></span>
				<span
					class="inline-block h-6 w-6 rounded-full border border-base-300"
					style="background-color: {data.club.secondary_color};"
				></span>
			</div>
		</div>
	</div>

	<div class="card bg-base-100 shadow-sm">
		<div class="card-body">
			<h2 class="card-title">Spieler ({data.players.length})</h2>
			{#if data.players.length === 0}
				<p class="text-base-content/60">Keine Spieler registriert.</p>
			{:else}
				<div class="overflow-x-auto">
					<table class="table">
						<thead>
							<tr>
								<th>Name</th>
								<th>Spitzname</th>
							</tr>
						</thead>
						<tbody>
							{#each data.players as player (player.id)}
								<tr>
									<td>{player.first_name} {player.last_name}</td>
									<td>{player.nickname ?? '-'}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</div>
	</div>
</div>
