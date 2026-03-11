<script lang="ts">
	import { getContext } from 'svelte';
	import type { ThemeStore } from '$lib/stores/theme.svelte.js';
	import { hslToHex, hexToHSL } from '$lib/utils/color.js';

	const theme = getContext<ThemeStore>('theme');

	let customPrimary = $state(theme.colors.primary);
	let customAccent = $state(theme.colors.accent);

	function applyCustom() {
		theme.setCustomColors(customPrimary, customAccent);
	}
</script>

<div class="mx-auto max-w-2xl">
	<h1 class="text-2xl font-bold mb-6">Einstellungen</h1>

	<!-- Theme Mode -->
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
							<div
								class="w-6 h-6 rounded-full border border-base-300/50"
								style="background-color: {preset.primary}"
							></div>
							<div
								class="w-6 h-6 rounded-full border border-base-300/50"
								style="background-color: {preset.accent}"
							></div>
						</div>
						<span class="text-sm font-medium">{preset.label}</span>
					</button>
				{/each}
			</div>
		</div>
	</div>

	<!-- Custom Colors -->
	<div class="card bg-gradient-to-br from-base-100 to-base-200 shadow-sm mb-6">
		<div class="card-body">
			<h2 class="card-title">Eigene Farben</h2>
			<div class="flex flex-wrap gap-6">
				<div class="form-control">
					<label class="label" for="custom-primary">Primaerfarbe</label>
					<div class="flex items-center gap-2">
						<input
							type="color"
							id="custom-primary"
							bind:value={customPrimary}
							class="w-12 h-10 rounded cursor-pointer border border-base-300"
							data-testid="custom-primary"
						/>
						<span class="text-sm font-mono text-base-content/60">{customPrimary}</span>
					</div>
				</div>
				<div class="form-control">
					<label class="label" for="custom-accent">Akzentfarbe</label>
					<div class="flex items-center gap-2">
						<input
							type="color"
							id="custom-accent"
							bind:value={customAccent}
							class="w-12 h-10 rounded cursor-pointer border border-base-300"
							data-testid="custom-accent"
						/>
						<span class="text-sm font-mono text-base-content/60">{customAccent}</span>
					</div>
				</div>
			</div>
			<div class="flex gap-2 mt-4">
				<button
					class="btn btn-primary btn-sm"
					onclick={applyCustom}
					data-testid="apply-custom-colors"
				>
					Uebernehmen
				</button>
				<button
					class="btn btn-ghost btn-sm"
					onclick={() => theme.resetToDefault()}
					data-testid="reset-colors"
				>
					Zuruecksetzen
				</button>
			</div>
		</div>
	</div>

	<!-- Preview -->
	<div class="card bg-gradient-to-br from-base-100 to-base-200 shadow-sm mb-6">
		<div class="card-body">
			<h2 class="card-title">Vorschau</h2>
			<div class="flex flex-wrap gap-2">
				<button class="btn btn-primary btn-sm">Primary</button>
				<button class="btn btn-secondary btn-sm">Secondary</button>
				<button class="btn btn-accent btn-sm">Accent</button>
				<button class="btn btn-info btn-sm">Info</button>
				<button class="btn btn-success btn-sm">Success</button>
				<button class="btn btn-warning btn-sm">Warning</button>
				<button class="btn btn-error btn-sm">Error</button>
			</div>
			<div class="flex flex-wrap gap-2 mt-3">
				<div class="badge badge-primary">Primary</div>
				<div class="badge badge-secondary">Secondary</div>
				<div class="badge badge-accent">Accent</div>
				<div class="badge badge-neutral">Neutral</div>
			</div>
			<div class="flex gap-2 mt-3">
				<div class="w-16 h-8 rounded bg-base-100 border border-base-300 flex items-center justify-center text-xs">100</div>
				<div class="w-16 h-8 rounded bg-base-200 border border-base-300 flex items-center justify-center text-xs">200</div>
				<div class="w-16 h-8 rounded bg-base-300 border border-base-300 flex items-center justify-center text-xs">300</div>
			</div>
		</div>
	</div>
</div>
