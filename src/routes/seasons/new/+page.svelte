<script lang="ts">
	let { form } = $props();
</script>

<div class="mx-auto max-w-lg">
	<h1 class="text-2xl font-bold mb-6">Neue Saison</h1>

	<form method="POST" class="flex flex-col gap-4" data-testid="season-form">
		<div class="form-control">
			<label class="label" for="name">Name</label>
			<input
				type="text"
				id="name"
				name="name"
				class="input input-bordered w-full"
				class:input-error={form?.errors?.name}
				required
				placeholder="z.B. Saison 2025/26"
				data-testid="season-form-name"
			/>
			{#if form?.errors?.name}
				<span class="label text-error text-sm">{form.errors.name}</span>
			{/if}
		</div>

		<div class="form-control">
			<label class="label" for="game_mode">Spielmodus</label>
			<select id="game_mode" name="game_mode" class="select select-bordered w-full" data-testid="season-form-mode">
				<option value="501">501</option>
				<option value="301">301</option>
				<option value="cricket">Cricket</option>
			</select>
		</div>

		<div class="flex gap-4">
			<div class="form-control flex-1">
				<label class="label" for="legs_per_set">Legs pro Set</label>
				<input type="number" id="legs_per_set" name="legs_per_set" class="input input-bordered w-full" value="3" min="1" max="15" />
			</div>
			<div class="form-control flex-1">
				<label class="label" for="sets_per_match">Sets pro Match</label>
				<input type="number" id="sets_per_match" name="sets_per_match" class="input input-bordered w-full" value="5" min="1" max="13" />
			</div>
		</div>

		<div class="flex gap-4">
			<div class="form-control flex-1">
				<label class="label" for="start_date">Startdatum</label>
				<input type="date" id="start_date" name="start_date" class="input input-bordered w-full" />
			</div>
			<div class="form-control flex-1">
				<label class="label" for="end_date">Enddatum</label>
				<input type="date" id="end_date" name="end_date" class="input input-bordered w-full" />
				{#if form?.errors?.end_date}
					<span class="label text-error text-sm">{form.errors.end_date}</span>
				{/if}
			</div>
		</div>

		<div class="form-control">
			<label class="label cursor-pointer justify-start gap-2">
				<input type="checkbox" name="is_active" class="checkbox" />
				<span>Aktive Saison</span>
			</label>
		</div>

		<div class="flex gap-2 justify-end mt-4">
			<a href="/seasons" class="btn btn-ghost">Abbrechen</a>
			<button type="submit" class="btn btn-primary" data-testid="season-form-submit">Erstellen</button>
		</div>
	</form>
</div>
