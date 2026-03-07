<script lang="ts">
	const today = new Date().toISOString().slice(0, 10);

	let importFile = $state<File | null>(null);
	let importFormat = $state<'json' | 'db'>('json');
	let importing = $state(false);
	let importMessage = $state<{ text: string; type: 'success' | 'error' } | null>(null);

	function handleFileChange(event: Event) {
		const input = event.target as HTMLInputElement;
		importFile = input.files?.[0] ?? null;

		if (importFile) {
			if (importFile.name.endsWith('.db')) {
				importFormat = 'db';
			} else {
				importFormat = 'json';
			}
		}
	}

	async function handleImport() {
		if (!importFile) return;
		importing = true;
		importMessage = null;

		try {
			const formData = new FormData();
			formData.set('file', importFile);
			formData.set('format', importFormat);

			const response = await fetch('/api/import', {
				method: 'POST',
				body: formData
			});

			const result = await response.json();

			if (response.ok) {
				importMessage = { text: result.message, type: 'success' };
				if (importFormat === 'db') {
					setTimeout(() => window.location.reload(), 1500);
				}
			} else {
				importMessage = { text: result.message ?? 'Import fehlgeschlagen', type: 'error' };
			}
		} catch (err) {
			importMessage = { text: 'Fehler beim Import', type: 'error' };
		} finally {
			importing = false;
		}
	}
</script>

<div class="flex flex-col gap-6">
	<h1 class="text-2xl font-bold">Daten exportieren & importieren</h1>

	<!-- Export -->
	<h2 class="text-lg font-semibold">Export</h2>
	<div class="grid gap-4 md:grid-cols-2">
		<div class="card bg-base-100 shadow-sm">
			<div class="card-body">
				<h3 class="card-title text-base">JSON Export</h3>
				<p class="text-sm text-base-content/60">
					Alle Vereine, Spieler, Turniere und Ergebnisse als lesbare JSON-Datei.
				</p>
				<a
					href="/api/export?format=json"
					download="dartzone-export-{today}.json"
					class="btn btn-primary btn-sm mt-2"
				>
					JSON herunterladen
				</a>
			</div>
		</div>

		<div class="card bg-base-100 shadow-sm">
			<div class="card-body">
				<h3 class="card-title text-base">Datenbank-Backup</h3>
				<p class="text-sm text-base-content/60">
					Komplette SQLite-Datenbank inkl. Wappen-Bilder als Datei.
				</p>
				<a
					href="/api/export?format=db"
					download="dartzone-{today}.db"
					class="btn btn-outline btn-sm mt-2"
				>
					Datenbank herunterladen
				</a>
			</div>
		</div>
	</div>

	<!-- Import -->
	<h2 class="text-lg font-semibold">Import</h2>
	<div class="card bg-base-100 shadow-sm">
		<div class="card-body">
			<p class="text-sm text-base-content/60 mb-4">
				Zuvor exportierte Daten wiederherstellen. JSON-Import fuegt Daten hinzu (ohne Duplikate).
				Datenbank-Import ersetzt alle bestehenden Daten (ein Backup wird automatisch erstellt).
			</p>

			<div class="flex flex-col gap-3">
				<input
					type="file"
					accept=".json,.db"
					class="file-input file-input-bordered file-input-sm w-full max-w-md"
					onchange={handleFileChange}
				/>

				{#if importFile}
					<div class="flex items-center gap-3">
						<span class="text-sm">
							{importFile.name}
							<span class="badge badge-sm ml-1">
								{importFormat === 'db' ? 'Datenbank-Restore' : 'JSON-Import'}
							</span>
						</span>
						<button
							class="btn btn-primary btn-sm"
							onclick={handleImport}
							disabled={importing}
						>
							{#if importing}
								<span class="loading loading-spinner loading-xs"></span>
							{/if}
							Importieren
						</button>
					</div>
				{/if}

				{#if importMessage}
					<div class="alert {importMessage.type === 'success' ? 'alert-success' : 'alert-error'} text-sm">
						{importMessage.text}
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>
