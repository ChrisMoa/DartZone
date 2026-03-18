<script lang="ts">
	import { getContext, onMount } from 'svelte';
	import type { ThemeStore } from '$lib/stores/theme.svelte.js';
	import type { SettingsStore } from '$lib/stores/settings.svelte.js';

	const theme = getContext<ThemeStore>('theme');
	const store = getContext<SettingsStore>('settings');

	let customPrimary = $state(theme.colors.primary);
	let customAccent = $state(theme.colors.accent);

	function applyCustomColors() {
		theme.setCustomColors(customPrimary, customAccent);
	}

	// Export/Import
	let importError = $state('');
	let importSuccess = $state(false);

	// Custom animation assets
	interface AnimationAssetInfo {
		event: string;
		mime: string;
		duration_ms: number;
		position: string;
		created_at: string;
	}

	const ANIMATION_EVENTS = [
		{ key: 'bullseye', label: 'Bullseye (50)' },
		{ key: 'triple_twenty', label: 'Triple 20' },
		{ key: 'one_eighty', label: '180' },
		{ key: 'checkout', label: 'Checkout / Sieg' }
	] as const;

	let customAssets = $state<Record<string, AnimationAssetInfo | null>>({
		bullseye: null,
		triple_twenty: null,
		one_eighty: null,
		checkout: null
	});
	let uploadStatus = $state<Record<string, string>>({});
	let uploadDuration = $state<Record<string, number>>({
		bullseye: 2000,
		triple_twenty: 2000,
		one_eighty: 2000,
		checkout: 2000
	});
	let uploadPosition = $state<Record<string, string>>({
		bullseye: 'center',
		triple_twenty: 'center',
		one_eighty: 'center',
		checkout: 'center'
	});
	let previewUrls = $state<Record<string, string | null>>({
		bullseye: null,
		triple_twenty: null,
		one_eighty: null,
		checkout: null
	});

	async function loadCustomAssets() {
		try {
			const res = await fetch('/api/animations');
			if (res.ok) {
				const assets: AnimationAssetInfo[] = await res.json();
				for (const asset of assets) {
					customAssets[asset.event] = asset;
					uploadDuration[asset.event] = asset.duration_ms;
					uploadPosition[asset.event] = asset.position;
				}
			}
		} catch { /* ignore */ }
	}

	onMount(() => {
		loadCustomAssets();
	});

	async function handleAnimationUpload(event: string, fileInput: HTMLInputElement) {
		const file = fileInput.files?.[0];
		if (!file) return;

		if (file.size > 2 * 1024 * 1024) {
			uploadStatus[event] = 'Datei zu gross (max. 2 MB)';
			return;
		}

		uploadStatus[event] = 'Wird hochgeladen...';

		const formData = new FormData();
		formData.append('file', file);
		formData.append('duration_ms', uploadDuration[event].toString());
		formData.append('position', uploadPosition[event]);

		try {
			const res = await fetch(`/api/animations/${event}`, {
				method: 'POST',
				body: formData
			});
			if (res.ok) {
				const asset: AnimationAssetInfo = await res.json();
				customAssets[event] = asset;
				uploadStatus[event] = 'Hochgeladen!';
				// Revoke old preview
				if (previewUrls[event]) URL.revokeObjectURL(previewUrls[event]!);
				previewUrls[event] = null;
				setTimeout(() => { uploadStatus[event] = ''; }, 2000);
			} else {
				const err = await res.json().catch(() => ({ message: 'Fehler beim Hochladen' }));
				uploadStatus[event] = err.message || 'Fehler beim Hochladen';
			}
		} catch {
			uploadStatus[event] = 'Netzwerkfehler';
		}
		fileInput.value = '';
	}

	async function handleAnimationDelete(event: string) {
		try {
			const res = await fetch(`/api/animations/${event}`, { method: 'DELETE' });
			if (res.ok) {
				customAssets[event] = null;
				uploadStatus[event] = 'Geloescht';
				if (previewUrls[event]) URL.revokeObjectURL(previewUrls[event]!);
				previewUrls[event] = null;
				setTimeout(() => { uploadStatus[event] = ''; }, 2000);
			}
		} catch {
			uploadStatus[event] = 'Fehler beim Loeschen';
		}
	}

	async function updateAnimationSettings(event: string) {
		if (!customAssets[event]) return;
		// Re-upload with new settings by fetching existing data and re-posting
		// Simpler: we use a dedicated PATCH-like approach via POST with existing file
		// Since we can't easily re-upload without the file, we'll need a settings-only endpoint
		// For now, the settings are applied on next upload
		uploadStatus[event] = 'Einstellungen werden beim naechsten Upload uebernommen';
		setTimeout(() => { uploadStatus[event] = ''; }, 2000);
	}

	function previewFile(event: string, fileInput: HTMLInputElement) {
		const file = fileInput.files?.[0];
		if (!file) return;
		if (previewUrls[event]) URL.revokeObjectURL(previewUrls[event]!);
		previewUrls[event] = URL.createObjectURL(file);
	}

	function getPreviewUrl(event: string): string | null {
		if (previewUrls[event]) return previewUrls[event];
		if (customAssets[event]) return `/api/animations/${event}`;
		return null;
	}

	function isVideoMime(mime: string | undefined): boolean {
		return mime?.startsWith('video/') ?? false;
	}

	function isLottieMime(mime: string | undefined): boolean {
		return mime === 'application/json';
	}

	function handleExport() {
		const json = store.exportJSON();
		const blob = new Blob([json], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'dartzone-settings.json';
		a.click();
		URL.revokeObjectURL(url);
	}

	function handleImportFile(fileInput: HTMLInputElement) {
		importError = '';
		importSuccess = false;
		const file = fileInput.files?.[0];
		if (!file) {
			importError = 'Bitte eine JSON-Datei auswaehlen';
			return;
		}
		const reader = new FileReader();
		reader.onload = () => {
			const text = reader.result as string;
			if (store.importJSON(text)) {
				importSuccess = true;
				setTimeout(() => { importSuccess = false; }, 3000);
			} else {
				importError = 'Ungueltiges JSON-Format';
			}
			fileInput.value = '';
		};
		reader.onerror = () => {
			importError = 'Fehler beim Lesen der Datei';
			fileInput.value = '';
		};
		reader.readAsText(file);
	}
</script>

<div class="mx-auto max-w-2xl">
	<h1 class="text-2xl font-bold mb-6">Einstellungen</h1>

	<!-- Theme / Appearance -->
	<div class="card bg-gradient-to-br from-base-100 to-base-200 shadow-sm mb-6">
		<div class="card-body">
			<h2 class="card-title">Darstellung</h2>
			<div class="flex items-center justify-between">
				<span>Dunkler Modus</span>
				<input
					type="checkbox"
					class="toggle toggle-primary"
					checked={theme.isDark}
					onchange={() => theme.toggle()}
					data-testid="dark-mode-toggle"
				/>
			</div>
		</div>
	</div>

	<!-- Color Presets -->
	<div class="card bg-gradient-to-br from-base-100 to-base-200 shadow-sm mb-6">
		<div class="card-body">
			<h2 class="card-title">Farbschema</h2>
			<p class="text-sm text-base-content/60 mb-4">Waehle ein vordefiniertes Farbschema oder erstelle ein eigenes.</p>

			<div class="grid grid-cols-2 sm:grid-cols-3 gap-3" data-testid="color-presets">
				{#each theme.presets as preset (preset.name)}
					<button
						class="flex items-center gap-3 p-3 rounded-lg border-2 transition-all duration-200 hover:scale-[1.02]"
						class:border-primary={theme.colors.preset === preset.name}
						class:border-base-300={theme.colors.preset !== preset.name}
						class:shadow-md={theme.colors.preset === preset.name}
						onclick={() => {
							theme.setPreset(preset.name);
							customPrimary = preset.primary;
							customAccent = preset.accent;
						}}
						data-testid="preset-{preset.name}"
					>
						<div class="flex gap-1">
							<div class="w-6 h-6 rounded-full border border-base-300/50" style="background-color: {preset.primary}"></div>
							<div class="w-6 h-6 rounded-full border border-base-300/50" style="background-color: {preset.accent}"></div>
						</div>
						<span class="text-sm font-medium">{preset.label}</span>
					</button>
				{/each}
			</div>

			<div class="divider-gradient my-4"></div>

			<h3 class="font-medium text-sm mb-2">Eigene Farben</h3>
			<div class="flex flex-wrap gap-6">
				<div class="form-control">
					<label class="label" for="custom-primary">Primaerfarbe</label>
					<div class="flex items-center gap-2">
						<input type="color" id="custom-primary" bind:value={customPrimary} class="w-12 h-10 rounded cursor-pointer border border-base-300" data-testid="custom-primary" />
						<span class="text-sm font-mono text-base-content/60">{customPrimary}</span>
					</div>
				</div>
				<div class="form-control">
					<label class="label" for="custom-accent">Akzentfarbe</label>
					<div class="flex items-center gap-2">
						<input type="color" id="custom-accent" bind:value={customAccent} class="w-12 h-10 rounded cursor-pointer border border-base-300" data-testid="custom-accent" />
						<span class="text-sm font-mono text-base-content/60">{customAccent}</span>
					</div>
				</div>
			</div>
			<div class="flex gap-2 mt-4">
				<button class="btn btn-primary btn-sm" onclick={applyCustomColors} data-testid="apply-custom-colors">Uebernehmen</button>
				<button class="btn btn-ghost btn-sm" onclick={() => theme.resetToDefault()} data-testid="reset-colors">Zuruecksetzen</button>
			</div>

			<!-- Preview -->
			<div class="divider-gradient my-4"></div>
			<h3 class="font-medium text-sm mb-2">Vorschau</h3>
			<div class="flex flex-wrap gap-2">
				<button class="btn btn-primary btn-xs">Primary</button>
				<button class="btn btn-secondary btn-xs">Secondary</button>
				<button class="btn btn-accent btn-xs">Accent</button>
				<button class="btn btn-info btn-xs">Info</button>
				<button class="btn btn-success btn-xs">Success</button>
				<button class="btn btn-warning btn-xs">Warning</button>
				<button class="btn btn-error btn-xs">Error</button>
			</div>
		</div>
	</div>

	<!-- Animations -->
	<div class="card bg-gradient-to-br from-base-100 to-base-200 shadow-sm mb-6">
		<div class="card-body">
			<div class="flex items-center justify-between">
				<h2 class="card-title">Animationen</h2>
				<button class="btn btn-ghost btn-xs" onclick={() => store.resetSection('animations')}>Zuruecksetzen</button>
			</div>

			<div class="flex items-center justify-between py-2">
				<div>
					<span class="font-medium">Alle Animationen</span>
					<p class="text-xs text-base-content/60">Master-Schalter fuer alle Spielanimationen</p>
				</div>
				<input
					type="checkbox"
					class="toggle toggle-primary"
					checked={store.settings.animationsEnabled}
					onchange={() => store.update('animationsEnabled', !store.settings.animationsEnabled)}
					data-testid="animations-master-toggle"
				/>
			</div>

			{#if store.settings.animationsEnabled}
				<div class="flex flex-col gap-2 pl-4 border-l-2 border-base-300">
					<label class="flex items-center justify-between cursor-pointer py-1">
						<span class="text-sm">Bullseye (50)</span>
						<input
							type="checkbox"
							class="toggle toggle-sm toggle-primary"
							checked={store.settings.animationBullseye}
							onchange={() => store.update('animationBullseye', !store.settings.animationBullseye)}
							data-testid="anim-bullseye"
						/>
					</label>
					<label class="flex items-center justify-between cursor-pointer py-1">
						<span class="text-sm">Triple 20</span>
						<input
							type="checkbox"
							class="toggle toggle-sm toggle-primary"
							checked={store.settings.animationTripleTwenty}
							onchange={() => store.update('animationTripleTwenty', !store.settings.animationTripleTwenty)}
							data-testid="anim-triple-twenty"
						/>
					</label>
					<label class="flex items-center justify-between cursor-pointer py-1">
						<span class="text-sm">180</span>
						<input
							type="checkbox"
							class="toggle toggle-sm toggle-primary"
							checked={store.settings.animationOneEighty}
							onchange={() => store.update('animationOneEighty', !store.settings.animationOneEighty)}
							data-testid="anim-one-eighty"
						/>
					</label>
					<label class="flex items-center justify-between cursor-pointer py-1">
						<span class="text-sm">Checkout / Sieg</span>
						<input
							type="checkbox"
							class="toggle toggle-sm toggle-primary"
							checked={store.settings.animationCheckout}
							onchange={() => store.update('animationCheckout', !store.settings.animationCheckout)}
							data-testid="anim-checkout"
						/>
					</label>
				</div>
			{/if}
		</div>
	</div>

	<!-- Custom Animation Assets -->
	{#if store.settings.animationsEnabled}
		<div class="card bg-gradient-to-br from-base-100 to-base-200 shadow-sm mb-6">
			<div class="card-body">
				<h2 class="card-title">Eigene Animationen</h2>
				<p class="text-sm text-base-content/60 mb-2">
					Lade eigene Animationen hoch (GIF, WebP, MP4, WebM oder Lottie JSON, max. 2 MB).
				</p>

				{#each ANIMATION_EVENTS as { key, label } (key)}
					<div class="border border-base-300 rounded-lg p-3 mb-3" data-testid="custom-anim-{key}">
						<div class="flex items-center justify-between mb-2">
							<span class="font-medium text-sm">{label}</span>
							{#if customAssets[key]}
								<span class="badge badge-sm badge-success">Eigene Animation aktiv</span>
							{/if}
						</div>

						<!-- Preview -->
						{#if getPreviewUrl(key)}
							{@const url = getPreviewUrl(key)}
							<div class="mb-2 flex justify-center bg-base-300/30 rounded-lg p-2 max-h-32 overflow-hidden">
								{#if isVideoMime(customAssets[key]?.mime || previewUrls[key] ? 'video/' : '')}
									<video src={url} class="max-h-28 rounded" autoplay loop muted playsinline></video>
								{:else if isLottieMime(customAssets[key]?.mime)}
									<div class="text-xs text-base-content/60 p-4">Lottie-Vorschau nicht verfuegbar</div>
								{:else}
									<img src={url} alt="Vorschau {label}" class="max-h-28 rounded object-contain" />
								{/if}
							</div>
						{/if}

						<!-- Upload -->
						<div class="flex flex-wrap gap-2 items-end">
							<div class="form-control flex-1 min-w-0">
								<input
									type="file"
									accept=".gif,.webp,.mp4,.webm,.json"
									class="file-input file-input-bordered file-input-xs w-full"
									data-testid="anim-upload-{key}"
									onchange={(e) => {
										const input = e.target as HTMLInputElement;
										previewFile(key, input);
									}}
								/>
							</div>
							<button
								class="btn btn-primary btn-xs"
								data-testid="anim-save-{key}"
								onclick={(e) => {
									const card = (e.target as HTMLElement).closest('[data-testid]')!;
									const input = card.querySelector('input[type="file"]') as HTMLInputElement;
									handleAnimationUpload(key, input);
								}}
							>
								Hochladen
							</button>
							{#if customAssets[key]}
								<button
									class="btn btn-ghost btn-xs text-error"
									data-testid="anim-delete-{key}"
									onclick={() => handleAnimationDelete(key)}
								>
									Entfernen
								</button>
							{/if}
						</div>

						<!-- Duration & Position -->
						<div class="flex flex-wrap gap-4 mt-2">
							<div class="form-control">
								<label class="label py-0">
									<span class="label-text text-xs">Dauer</span>
								</label>
								<div class="flex items-center gap-2">
									<input
										type="range"
										min="1000"
										max="5000"
										step="500"
										class="range range-xs range-primary w-24"
										bind:value={uploadDuration[key]}
										data-testid="anim-duration-{key}"
									/>
									<span class="text-xs font-mono">{(uploadDuration[key] / 1000).toFixed(1)}s</span>
								</div>
							</div>
							<div class="form-control">
								<label class="label py-0">
									<span class="label-text text-xs">Position</span>
								</label>
								<select
									class="select select-bordered select-xs"
									bind:value={uploadPosition[key]}
									data-testid="anim-position-{key}"
								>
									<option value="center">Mitte</option>
									<option value="top">Oben</option>
									<option value="bottom">Unten</option>
								</select>
							</div>
						</div>

						{#if uploadStatus[key]}
							<span class="text-xs mt-1 block {uploadStatus[key].includes('Fehler') || uploadStatus[key].includes('gross') ? 'text-error' : 'text-success'}">
								{uploadStatus[key]}
							</span>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Match Defaults -->
	<div class="card bg-gradient-to-br from-base-100 to-base-200 shadow-sm mb-6">
		<div class="card-body">
			<div class="flex items-center justify-between">
				<h2 class="card-title">Spiel-Standardwerte</h2>
				<button class="btn btn-ghost btn-xs" onclick={() => store.resetSection('match')}>Zuruecksetzen</button>
			</div>

			<div class="flex items-center justify-between py-2">
				<span>Standard-Spielmodus</span>
				<select
					class="select select-bordered select-sm w-28"
					value={store.settings.defaultGameMode}
					onchange={(e) => store.update('defaultGameMode', (e.target as HTMLSelectElement).value as '501' | '301')}
					data-testid="default-game-mode"
				>
					<option value="501">501</option>
					<option value="301">301</option>
				</select>
			</div>

			<div class="flex items-center justify-between py-2">
				<div>
					<span>Einfaches Checkout</span>
					<p class="text-xs text-base-content/60">Standardmaessig aktiviert fuer neue Spiele</p>
				</div>
				<input
					type="checkbox"
					class="toggle toggle-primary"
					checked={store.settings.defaultSoftCheckout}
					onchange={() => store.update('defaultSoftCheckout', !store.settings.defaultSoftCheckout)}
					data-testid="default-soft-checkout"
				/>
			</div>

			<div class="flex items-center justify-between py-2">
				<span>Legs pro Match</span>
				<select
					class="select select-bordered select-sm w-28"
					value={store.settings.defaultLegsPerMatch}
					onchange={(e) => store.update('defaultLegsPerMatch', parseInt((e.target as HTMLSelectElement).value))}
					data-testid="default-legs"
				>
					{#each [1, 3, 5, 7, 9, 11, 13] as n}
						<option value={n}>Best of {n}</option>
					{/each}
				</select>
			</div>

			<div class="flex items-center justify-between py-2">
				<span>Leg-Timer</span>
				<input
					type="checkbox"
					class="toggle toggle-primary"
					checked={store.settings.timerEnabled}
					onchange={() => store.update('timerEnabled', !store.settings.timerEnabled)}
					data-testid="default-timer"
				/>
			</div>
		</div>
	</div>

	<!-- Display -->
	<div class="card bg-gradient-to-br from-base-100 to-base-200 shadow-sm mb-6">
		<div class="card-body">
			<div class="flex items-center justify-between">
				<h2 class="card-title">Anzeige</h2>
				<button class="btn btn-ghost btn-xs" onclick={() => store.resetSection('display')}>Zuruecksetzen</button>
			</div>

			<div class="flex items-center justify-between py-2">
				<span>Eingabemodus</span>
				<select
					class="select select-bordered select-sm w-36"
					value={store.settings.inputMode}
					onchange={(e) => store.update('inputMode', (e.target as HTMLSelectElement).value as 'dartboard' | 'keypad' | 'both')}
					data-testid="default-input-mode"
				>
					<option value="dartboard">Dartboard</option>
					<option value="keypad">Tastatur</option>
					<option value="both">Beides</option>
				</select>
			</div>

			<div class="flex items-center justify-between py-2">
				<span>Checkout-Hilfe anzeigen</span>
				<input
					type="checkbox"
					class="toggle toggle-primary"
					checked={store.settings.showCheckoutHelper}
					onchange={() => store.update('showCheckoutHelper', !store.settings.showCheckoutHelper)}
					data-testid="show-checkout-helper"
				/>
			</div>
		</div>
	</div>

	<!-- Export / Import -->
	<div class="card bg-gradient-to-br from-base-100 to-base-200 shadow-sm mb-6">
		<div class="card-body">
			<h2 class="card-title">Einstellungen sichern</h2>

			<div class="flex gap-2">
				<button class="btn btn-outline btn-sm" onclick={handleExport} data-testid="export-settings">
					Exportieren
				</button>
				<button class="btn btn-ghost btn-sm text-error" onclick={() => { store.resetAll(); theme.resetToDefault(); }} data-testid="reset-all">
					Alles zuruecksetzen
				</button>
			</div>

			<div class="divider-gradient my-3"></div>

			<h3 class="font-medium text-sm mb-2">Importieren</h3>
			<div class="flex flex-wrap gap-2 items-end">
				<input
					type="file"
					accept=".json"
					class="file-input file-input-bordered file-input-sm flex-1 min-w-0"
					data-testid="import-file"
					onchange={(e) => handleImportFile(e.target as HTMLInputElement)}
				/>
			</div>
			{#if importError}
				<span class="text-error text-xs mt-1">{importError}</span>
			{/if}
			{#if importSuccess}
				<span class="text-success text-xs mt-1">Einstellungen importiert!</span>
			{/if}
		</div>
	</div>

	<!-- Version -->
	<div class="text-center text-xs text-base-content/40 py-4" data-testid="app-version">
		DartZone v{__APP_VERSION__} &middot; Build: {__APP_BUILD_DATE__}
	</div>
</div>
