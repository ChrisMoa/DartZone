<script lang="ts">
	import { browser } from '$app/environment';
	import SpectatorTile from '$lib/components/scoring/SpectatorTile.svelte';

	let { data } = $props();

	const legsToWin = $derived(Math.ceil(data.tournament.sets_per_match / 2));

	type Layout = '1x1' | '2x1' | '2x2' | '3x2' | '4x2' | '3x3';

	interface LayoutDef {
		id: Layout;
		label: string;
		cols: number;
		rows: number;
	}

	const LAYOUTS: LayoutDef[] = [
		{ id: '1x1', label: '1', cols: 1, rows: 1 },
		{ id: '2x1', label: '2', cols: 2, rows: 1 },
		{ id: '2x2', label: '4', cols: 2, rows: 2 },
		{ id: '3x2', label: '6', cols: 3, rows: 2 },
		{ id: '4x2', label: '8', cols: 4, rows: 2 },
		{ id: '3x3', label: '9', cols: 3, rows: 3 }
	];

	// Persist selection in localStorage so reloads keep the chosen layout
	const storageKey = `spectator-${data.tournament.id}`;

	let selectedLayout = $state<Layout>('2x2');
	let selectedMatchIds = $state<string[]>([]);
	let configOpen = $state(true);
	let fullscreen = $state(false);

	$effect(() => {
		if (!browser) return;
		const raw = localStorage.getItem(storageKey);
		if (!raw) {
			// Default: show all currently in-progress matches
			selectedMatchIds = data.matches
				.filter((m: (typeof data.matches)[number]) => m.status === 'in_progress')
				.map((m: (typeof data.matches)[number]) => m.id);
			return;
		}
		try {
			const saved = JSON.parse(raw) as { layout: Layout; matchIds: string[] };
			if (saved.layout) selectedLayout = saved.layout;
			if (Array.isArray(saved.matchIds)) selectedMatchIds = saved.matchIds;
		} catch {
			/* ignore */
		}
	});

	$effect(() => {
		if (!browser) return;
		localStorage.setItem(
			storageKey,
			JSON.stringify({ layout: selectedLayout, matchIds: selectedMatchIds })
		);
	});

	const layoutDef = $derived(LAYOUTS.find((l) => l.id === selectedLayout) ?? LAYOUTS[2]);
	const maxTiles = $derived(layoutDef.cols * layoutDef.rows);
	const visibleMatchIds = $derived(selectedMatchIds.slice(0, maxTiles));

	function toggleMatch(id: string) {
		if (selectedMatchIds.includes(id)) {
			selectedMatchIds = selectedMatchIds.filter((x) => x !== id);
		} else {
			selectedMatchIds = [...selectedMatchIds, id];
		}
	}

	function selectAllInProgress() {
		selectedMatchIds = data.matches
			.filter((m: (typeof data.matches)[number]) => m.status === 'in_progress')
			.map((m: (typeof data.matches)[number]) => m.id);
	}

	function clearSelection() {
		selectedMatchIds = [];
	}

	async function toggleFullscreen() {
		if (!browser) return;
		try {
			if (!document.fullscreenElement) {
				await document.documentElement.requestFullscreen();
				fullscreen = true;
			} else {
				await document.exitFullscreen();
				fullscreen = false;
			}
		} catch {
			/* ignore */
		}
	}

	$effect(() => {
		if (!browser) return;
		function onChange() {
			fullscreen = !!document.fullscreenElement;
		}
		document.addEventListener('fullscreenchange', onChange);
		return () => document.removeEventListener('fullscreenchange', onChange);
	});
</script>

<div class="flex flex-col h-[calc(100vh-2rem)] gap-2" data-testid="spectator-page">
	<!-- Compact toolbar -->
	<div class="flex items-center gap-2 flex-wrap shrink-0">
		<a href="/tournaments/{data.tournament.id}" class="btn btn-ghost btn-sm">Zurueck</a>
		<h1 class="text-lg font-bold flex-1 truncate">Zuschauer · {data.tournament.name}</h1>

		<!-- Layout selector -->
		<div class="join" data-testid="spectator-layout-selector">
			{#each LAYOUTS as l (l.id)}
				<button
					class="join-item btn btn-sm {selectedLayout === l.id ? 'btn-primary' : 'btn-outline'}"
					onclick={() => (selectedLayout = l.id)}
					title="{l.cols}x{l.rows}"
				>
					{l.label}
				</button>
			{/each}
		</div>

		<button
			class="btn btn-sm btn-ghost"
			onclick={() => (configOpen = !configOpen)}
			data-testid="spectator-toggle-config"
		>
			{configOpen ? 'Konfiguration ▲' : 'Konfiguration ▼'}
		</button>

		<button
			class="btn btn-sm btn-outline"
			onclick={toggleFullscreen}
			data-testid="spectator-fullscreen"
		>
			{fullscreen ? '⛶ Verlassen' : '⛶ Vollbild'}
		</button>
	</div>

	{#if configOpen}
		<div class="card bg-base-100 shadow-sm shrink-0" data-testid="spectator-config">
			<div class="card-body p-3">
				<div class="flex items-center gap-2 flex-wrap">
					<span class="text-sm font-medium">Spiele auswaehlen ({selectedMatchIds.length} / max {maxTiles}):</span>
					<button class="btn btn-xs btn-ghost" onclick={selectAllInProgress}>Alle laufenden</button>
					<button class="btn btn-xs btn-ghost" onclick={clearSelection}>Leeren</button>
				</div>
				<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1 mt-1 max-h-48 overflow-y-auto">
					{#each data.matches as m (m.id)}
						{@const checked = selectedMatchIds.includes(m.id)}
						{@const disabled = !checked && selectedMatchIds.length >= maxTiles}
						<label
							class="flex items-center gap-2 p-1.5 rounded cursor-pointer hover:bg-base-200 text-xs {disabled ? 'opacity-40 cursor-not-allowed' : ''}"
						>
							<input
								type="checkbox"
								class="checkbox checkbox-xs checkbox-primary"
								{checked}
								{disabled}
								onchange={() => toggleMatch(m.id)}
							/>
							<span class="flex-1 truncate">
								{m.home_club.short_name} vs {m.away_club.short_name}
							</span>
							<span
								class="badge badge-xs {m.status === 'in_progress'
									? 'badge-success'
									: m.status === 'completed'
										? 'badge-neutral'
										: 'badge-ghost'}"
							>
								{m.status === 'in_progress' ? 'live' : m.status === 'completed' ? '✓' : '–'}
							</span>
						</label>
					{/each}
				</div>
			</div>
		</div>
	{/if}

	<!-- Tile grid -->
	{#if visibleMatchIds.length === 0}
		<div class="flex-1 flex items-center justify-center bg-base-100 rounded-lg">
			<p class="text-base-content/60">
				Keine Spiele ausgewaehlt. Oeffne die Konfiguration, um Spiele anzuzeigen.
			</p>
		</div>
	{:else}
		<div
			class="flex-1 grid gap-2 min-h-0"
			style="grid-template-columns: repeat({layoutDef.cols}, minmax(0, 1fr)); grid-template-rows: repeat({layoutDef.rows}, minmax(0, 1fr));"
			data-testid="spectator-tile-grid"
		>
			{#each visibleMatchIds as mid (mid)}
				<SpectatorTile matchId={mid} {legsToWin} />
			{/each}
		</div>
	{/if}
</div>
