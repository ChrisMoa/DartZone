<script lang="ts">
	let { data } = $props();
</script>

<div class="flex flex-col gap-6" data-testid="stats-page">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold">Statistiken</h1>
	</div>

	<div class="card bg-base-100 shadow-sm">
		<div class="card-body">
			<h2 class="card-title">Spieler</h2>
			<div class="overflow-x-auto">
				<table class="table" data-testid="player-list-table">
					<thead>
						<tr>
							<th>Name</th>
							<th>Verein</th>
							<th></th>
						</tr>
					</thead>
					<tbody>
						{#each data.players as player (player.id)}
							<tr class="hover">
								<td>
									<div class="font-medium">{player.first_name} {player.last_name}</div>
									{#if player.nickname}
										<div class="text-sm text-base-content/60">"{player.nickname}"</div>
									{/if}
								</td>
								<td>{player.club_short_name}</td>
								<td>
									<a href="/stats/{player.id}" class="btn btn-ghost btn-sm">Details</a>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	</div>
</div>
