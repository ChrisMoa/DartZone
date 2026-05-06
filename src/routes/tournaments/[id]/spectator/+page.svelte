<script lang="ts">
	import { browser } from '$app/environment';
	import SpectatorTile from '$lib/components/scoring/SpectatorTile.svelte';

	let { data } = $props();

	const legsToWin = $derived(Math.ceil(data.tournament.sets_per_match / 2));

	type Layout = '1x1' | '2x1' | '2x2' | '3x2' | '4x2' | '3x3';

	interface LayoutDef {
		id: Layout;
		cols: number;
		rows: number;
	}

	const LAYOUTS: LayoutDef[] = [
		{ id: '1x1', cols: 1, rows: 1 },
		{ id: '2x1', cols: 2, rows: 1 },
		{ id: '2x2', cols: 2, rows: 2 },
		{ id: '3x2', cols: 3, rows: 2 },
		{ id: '4x2', cols: 4, rows: 2 },
		{ id: '3x3', cols: 3, rows: 3 }
	];

	const storageKey = `spectator-${data.tournament.id}`;

	let selectedLayout = $state<Layout>('2x2');
	let selectedMatchIds = $state<string[]>([]);
	let fullscreen = $state(false);
	let chromeVisible = $state(true);
	let chromeTimer: ReturnType<typeof setTimeout> | null = null;

	function loadFromStorage() {
		const raw = localStorage.getItem(storageKey);
		if (raw) {
			try {
				const saved = JSON.parse(raw) as { layout: Layout; matchIds: string[] };
				if (saved.layout) selectedLayout = saved.layout;
				if (Array.isArray(saved.matchIds)) selectedMatchIds = saved.matchIds;
				return;
			} catch {
				/* ignore */
			}
		}
		selectedMatchIds = data.matches
			.filter((m: (typeof data.matches)[number]) => m.status === 'in_progress')
			.map((m: (typeof data.matches)[number]) => m.id);
	}

	$effect(() => {
		if (!browser) return;
		loadFromStorage();

		// Cross-tab live updates from /configure
		function onStorage(e: StorageEvent) {
			if (e.key !== storageKey) return;
			loadFromStorage();
		}
		window.addEventListener('storage', onStorage);

		// Same-origin BroadcastChannel for richer in-process signalling
		let bc: BroadcastChannel | null = null;
		try {
			bc = new BroadcastChannel(storageKey);
			bc.onmessage = () => loadFromStorage();
		} catch {
			/* BroadcastChannel may not be available */
		}

		return () => {
			window.removeEventListener('storage', onStorage);
			bc?.close();
		};
	});

	const layoutDef = $derived(LAYOUTS.find((l) => l.id === selectedLayout) ?? LAYOUTS[2]);
	const maxTiles = $derived(layoutDef.cols * layoutDef.rows);
	const visibleMatchIds = $derived(selectedMatchIds.slice(0, maxTiles));

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

	function showChrome() {
		chromeVisible = true;
		if (chromeTimer) clearTimeout(chromeTimer);
		chromeTimer = setTimeout(() => {
			chromeVisible = false;
		}, 3000);
	}

	$effect(() => {
		if (!browser) return;
		showChrome();
		return () => {
			if (chromeTimer) clearTimeout(chromeTimer);
		};
	});
</script>

<svelte:head>
	<title>Zuschauer · {data.tournament.name}</title>
</svelte:head>

<!-- svelte-ignore a11y_no_static_element_interactions a11y_mouse_events_have_key_events -->
<div
	class="fixed inset-0 z-50 bg-base-200 flex flex-col"
	data-testid="spectator-page"
	onmousemove={showChrome}
	ontouchstart={showChrome}
>
	{#if visibleMatchIds.length === 0}
		<div class="flex-1 flex flex-col items-center justify-center gap-4 p-6">
			<p class="text-lg text-base-content/60 text-center">
				Keine Spiele ausgewaehlt.
			</p>
			<a
				href="/tournaments/{data.tournament.id}/spectator/configure"
				class="btn btn-primary"
				data-testid="spectator-configure-link-empty"
			>
				Spiele auswaehlen
			</a>
			<a href="/tournaments/{data.tournament.id}" class="btn btn-ghost btn-sm">Zum Turnier</a>
		</div>
	{:else}
		<!-- Tile grid fills the entire viewport -->
		<div
			class="flex-1 grid gap-2 p-2 min-h-0"
			style="grid-template-columns: repeat({layoutDef.cols}, minmax(0, 1fr)); grid-template-rows: repeat({layoutDef.rows}, minmax(0, 1fr));"
			data-testid="spectator-tile-grid"
		>
			{#each visibleMatchIds as mid (mid)}
				<SpectatorTile matchId={mid} {legsToWin} />
			{/each}
		</div>
	{/if}

	<!-- Floating chrome (fades after 3s of no input) -->
	<div
		class="absolute top-2 right-2 flex items-center gap-2 transition-opacity duration-300 {chromeVisible
			? 'opacity-100'
			: 'opacity-0 pointer-events-none'}"
	>
		<a
			href="/tournaments/{data.tournament.id}/spectator/configure"
			class="btn btn-sm btn-neutral shadow-lg"
			title="Konfigurieren"
			data-testid="spectator-configure-link"
		>
			⚙ Konfigurieren
		</a>
		<button
			class="btn btn-sm btn-neutral shadow-lg"
			onclick={toggleFullscreen}
			title={fullscreen ? 'Vollbild verlassen' : 'Vollbild'}
			data-testid="spectator-fullscreen"
		>
			{fullscreen ? '⛶ Verlassen' : '⛶ Vollbild'}
		</button>
		<a
			href="/tournaments/{data.tournament.id}"
			class="btn btn-sm btn-ghost bg-base-100 shadow-lg"
			title="Zurueck zum Turnier"
		>
			✕
		</a>
	</div>
</div>
