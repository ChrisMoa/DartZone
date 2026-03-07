<script lang="ts">
	import { enhance } from '$app/forms';

	let { form } = $props();
</script>

<div class="flex flex-col gap-6" data-testid="import-page">
	<h1 class="text-2xl font-bold">Excel Import</h1>

	<div class="card bg-base-100 shadow-sm">
		<div class="card-body">
			<h2 class="card-title">Vereine & Spieler importieren</h2>
			<p class="text-sm text-base-content/60">
				Lade eine Excel-Datei (.xlsx) mit den Tabellenblaettern <strong>"Vereine"</strong> und <strong>"Spieler"</strong> hoch.
			</p>

			<div class="mt-4 p-4 bg-base-200 rounded-lg text-sm">
				<p class="font-medium mb-2">Erwartetes Format:</p>
				<div class="grid gap-3 md:grid-cols-2">
					<div>
						<p class="font-medium text-primary">Blatt "Vereine"</p>
						<ul class="list-disc list-inside text-base-content/70">
							<li>name (Pflicht)</li>
							<li>short_name (Pflicht)</li>
							<li>primary_color</li>
							<li>secondary_color</li>
							<li>contact_email</li>
						</ul>
					</div>
					<div>
						<p class="font-medium text-secondary">Blatt "Spieler"</p>
						<ul class="list-disc list-inside text-base-content/70">
							<li>first_name (Pflicht)</li>
							<li>last_name (Pflicht)</li>
							<li>nickname</li>
							<li>club_short_name (Pflicht)</li>
						</ul>
					</div>
				</div>
			</div>

			<form method="POST" action="?/upload" enctype="multipart/form-data" use:enhance class="mt-4">
				<div class="form-control">
					<input
						type="file"
						name="file"
						accept=".xlsx,.xls"
						class="file-input file-input-bordered w-full"
						data-testid="import-file-input"
					/>
				</div>
				<button type="submit" class="btn btn-primary mt-4" data-testid="import-submit-btn">
					Importieren
				</button>
			</form>
		</div>
	</div>

	{#if form?.success}
		<div class="alert alert-success" data-testid="import-success">
			<div>
				<p class="font-medium">Import erfolgreich!</p>
				<p class="text-sm">{form.clubs_imported} Vereine und {form.players_imported} Spieler importiert.</p>
			</div>
		</div>
	{/if}

	{#if form?.error}
		<div class="alert alert-error" data-testid="import-error">
			<p>{form.error}</p>
		</div>
	{/if}

	{#if form?.errors && form.errors.length > 0}
		<div class="alert alert-warning">
			<div>
				<p class="font-medium">Hinweise:</p>
				<ul class="list-disc list-inside text-sm">
					{#each form.errors as err}
						<li>{err}</li>
					{/each}
				</ul>
			</div>
		</div>
	{/if}
</div>
