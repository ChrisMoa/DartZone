<script lang="ts">
	import { getContext } from 'svelte';
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
	let importText = $state('');
	let importError = $state('');
	let importSuccess = $state(false);

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

	function handleImport() {
		importError = '';
		importSuccess = false;
		if (!importText.trim()) {
			importError = 'Bitte JSON einfuegen';
			return;
		}
		if (store.importJSON(importText)) {
			importSuccess = true;
			importText = '';
		} else {
			importError = 'Ungueltiges JSON-Format';
		}
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
			<textarea
				class="textarea textarea-bordered w-full text-xs font-mono"
				rows="3"
				placeholder="JSON-Einstellungen hier einfuegen..."
				bind:value={importText}
				data-testid="import-textarea"
			></textarea>
			{#if importError}
				<span class="text-error text-xs">{importError}</span>
			{/if}
			{#if importSuccess}
				<span class="text-success text-xs">Einstellungen importiert!</span>
			{/if}
			<button class="btn btn-outline btn-sm mt-1" onclick={handleImport} data-testid="import-settings">
				Importieren
			</button>
		</div>
	</div>
</div>
