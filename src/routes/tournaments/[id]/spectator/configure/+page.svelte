<script lang="ts">
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import type { Match } from '$lib/types/league.js';

	let { data } = $props();

	type Layout = '1x1' | '2x1' | '2x2' | '3x2' | '4x2' | '3x3';

	interface LayoutDef {
		id: Layout;
		label: string;
		cols: number;
		rows: number;
	}

	const LAYOUTS: LayoutDef[] = [
		{ id: '1x1', label: '1 (1×1)', cols: 1, rows: 1 },
		{ id: '2x1', label: '2 (2×1)', cols: 2, rows: 1 },
		{ id: '2x2', label: '4 (2×2)', cols: 2, rows: 2 },
		{ id: '3x2', label: '6 (3×2)', cols: 3, rows: 2 },
		{ id: '4x2', label: '8 (4×2)', cols: 4, rows: 2 },
		{ id: '3x3', label: '9 (3×3)', cols: 3, rows: 3 }
	];

	const ROUND_ORDER = ['Runde 1', 'Achtelfinale', 'Viertelfinale', 'Halbfinale', 'Finale'];

	const storageKey = `spectator-${data.tournament.id}`;

	let selectedLayout = $state<Layout>('2x2');
	let selectedMatchIds = $state<string[]>([]);
	let loaded = $state(false);
	let matches = $state<Match[]>(data.matches);

	// Live-poll matches so newly generated rounds (Achtel→Viertel) appear automatically
	async function refreshMatches() {
		try {
			const res = await fetch(`/api/tournaments/${data.tournament.id}/live`);
			if (!res.ok) return;
			const body = await res.json();
			if (Array.isArray(body.matches)) matches = body.matches;
		} catch {
			/* ignore */
		}
	}
	onMount(() => {
		if (!browser) return;
		const interval = setInterval(refreshMatches, 2500);
		return () => clearInterval(interval);
	});

	const rounds = $derived.by(() => {
		const present = new Set<string>();
		for (const m of matches) present.add(m.round ?? '_other');
		const ordered = ROUND_ORDER.filter((r) => present.has(r));
		const unknown = [...present].filter((r) => !ROUND_ORDER.includes(r));
		return [...ordered, ...unknown];
	});

	const activeRound = $derived.by(() => {
		for (const r of rounds) {
			if (matches.some((m) => (m.round ?? '_other') === r && m.status !== 'completed')) {
				return r;
			}
		}
		return rounds[rounds.length - 1] ?? null;
	});

	type Tab = string | '_all';
	let manualTab = $state<Tab | null>(null);
	const selectedTab = $derived<Tab>(manualTab ?? activeRound ?? '_all');

	let lastActiveRound = $state<string | null>(null);
	$effect(() => {
		if (activeRound !== lastActiveRound) {
			if (manualTab === lastActiveRound || manualTab === null) {
				manualTab = null; // re-track active
			}
			lastActiveRound = activeRound;
		}
	});

	const visibleMatches = $derived.by(() => {
		if (selectedTab === '_all') return matches;
		return matches.filter((m) => (m.round ?? '_other') === selectedTab);
	});

	function roundCounts(round: string): { live: number; scheduled: number; completed: number } {
		const r = matches.filter((m) => (m.round ?? '_other') === round);
		return {
			live: r.filter((m) => m.status === 'in_progress').length,
			scheduled: r.filter((m) => m.status === 'scheduled').length,
			completed: r.filter((m) => m.status === 'completed').length
		};
	}

	$effect(() => {
		if (!browser || loaded) return;
		// Prefer the server-side config (cross-device source of truth) over localStorage.
		(async () => {
			try {
				const res = await fetch(`/api/tournaments/${data.tournament.id}/spectator-config`);
				if (res.ok) {
					const cfg = (await res.json()) as { layout: Layout; matchIds: string[]; updated_at: number };
					if (cfg.updated_at > 0) {
						if (cfg.layout) selectedLayout = cfg.layout;
						if (Array.isArray(cfg.matchIds)) selectedMatchIds = cfg.matchIds;
						loaded = true;
						return;
					}
				}
			} catch {
				/* fall through to localStorage */
			}

			const raw = localStorage.getItem(storageKey);
			if (raw) {
				try {
					const saved = JSON.parse(raw) as { layout: Layout; matchIds: string[] };
					if (saved.layout) selectedLayout = saved.layout;
					if (Array.isArray(saved.matchIds)) selectedMatchIds = saved.matchIds;
				} catch {
					/* ignore */
				}
			} else {
				selectedMatchIds = data.matches
					.filter((m: (typeof data.matches)[number]) => m.status === 'in_progress')
					.map((m: (typeof data.matches)[number]) => m.id);
			}
			loaded = true;
		})();
	});

	let bc: BroadcastChannel | null = null;
	$effect(() => {
		if (!browser) return;
		try {
			bc = new BroadcastChannel(storageKey);
		} catch {
			/* not available */
		}
		return () => bc?.close();
	});

	let saveTimer: ReturnType<typeof setTimeout> | null = null;
	$effect(() => {
		if (!browser || !loaded) return;
		const payload = { layout: selectedLayout, matchIds: selectedMatchIds };
		localStorage.setItem(storageKey, JSON.stringify(payload));
		// Same-tab notification (storage event only fires in other tabs)
		bc?.postMessage({ type: 'update' });

		// Debounced PUT to server (cross-device sync)
		if (saveTimer) clearTimeout(saveTimer);
		saveTimer = setTimeout(() => {
			fetch(`/api/tournaments/${data.tournament.id}/spectator-config`, {
				method: 'PUT',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(payload)
			}).catch((err) => console.error('spectator-config save failed', err));
		}, 250);
	});

	const layoutDef = $derived(LAYOUTS.find((l) => l.id === selectedLayout) ?? LAYOUTS[2]);
	const maxTiles = $derived(layoutDef.cols * layoutDef.rows);

	function toggleMatch(id: string) {
		if (selectedMatchIds.includes(id)) {
			selectedMatchIds = selectedMatchIds.filter((x) => x !== id);
		} else {
			selectedMatchIds = [...selectedMatchIds, id];
		}
	}

	function selectAllInProgress() {
		selectedMatchIds = matches
			.filter((m) => m.status === 'in_progress')
			.map((m) => m.id);
	}

	function selectCurrentRoundOpen() {
		// Replace selection with all open (in_progress + scheduled) matches in
		// the currently visible tab. One-click switch when a new round starts.
		const round = selectedTab === '_all' ? activeRound : selectedTab;
		if (!round) return;
		selectedMatchIds = matches
			.filter((m) => (m.round ?? '_other') === round && m.status !== 'completed')
			.map((m) => m.id);
	}

	function clearSelection() {
		selectedMatchIds = [];
	}

	function startSpectator() {
		goto(`/tournaments/${data.tournament.id}/spectator`);
	}
</script>

<div class="flex flex-col gap-4 max-w-4xl mx-auto" data-testid="spectator-configure-page">
	<div class="flex items-center gap-3 flex-wrap">
		<a href="/tournaments/{data.tournament.id}" class="btn btn-ghost btn-sm">Zurueck</a>
		<h1 class="text-2xl font-bold flex-1">Zuschauer-Konfiguration</h1>
		<button
			class="btn btn-primary"
			onclick={startSpectator}
			disabled={selectedMatchIds.length === 0}
			data-testid="spectator-start-btn"
		>
			Zuschauer-Ansicht starten ▶
		</button>
	</div>

	<div class="card bg-base-100 shadow-sm">
		<div class="card-body p-4">
			<h2 class="card-title text-lg">Layout</h2>
			<p class="text-sm text-base-content/60 mb-2">
				Wie viele Spiele sollen gleichzeitig angezeigt werden?
			</p>
			<div class="join flex-wrap" data-testid="spectator-layout-selector">
				{#each LAYOUTS as l (l.id)}
					<button
						class="join-item btn btn-sm {selectedLayout === l.id ? 'btn-primary' : 'btn-outline'}"
						onclick={() => (selectedLayout = l.id)}
					>
						{l.label}
					</button>
				{/each}
			</div>
		</div>
	</div>

	<div class="card bg-base-100 shadow-sm" data-testid="spectator-config">
		<div class="card-body p-4">
			<div class="flex items-center justify-between flex-wrap gap-2">
				<div>
					<h2 class="card-title text-lg">Spiele auswaehlen</h2>
					<p class="text-sm text-base-content/60">
						{selectedMatchIds.length} von max. {maxTiles} ausgewaehlt
					</p>
				</div>
				<div class="flex gap-2 flex-wrap">
					<button
						class="btn btn-sm btn-primary"
						onclick={selectCurrentRoundOpen}
						title="Selektiert alle offenen Spiele der aktuellen Runde"
						data-testid="select-current-round-btn"
					>
						Diese Runde uebernehmen
					</button>
					<button class="btn btn-sm btn-ghost" onclick={selectAllInProgress}>
						Alle laufenden
					</button>
					<button class="btn btn-sm btn-ghost" onclick={clearSelection}>
						Leeren
					</button>
				</div>
			</div>

			<!-- Round tabs -->
			{#if rounds.length > 1}
				<div
					class="flex items-center gap-1 overflow-x-auto py-2 mt-2 border-b border-base-300"
					data-testid="configure-round-tabs"
				>
					{#each rounds as r (r)}
						{@const c = roundCounts(r)}
						{@const isActive = r === selectedTab}
						{@const isCurrent = r === activeRound}
						<button
							class="btn btn-sm shrink-0 {isActive ? 'btn-primary' : 'btn-ghost'} {isCurrent && !isActive ? 'border border-success/60' : ''}"
							onclick={() => (manualTab = r)}
							data-testid="configure-round-tab"
							data-round={r}
						>
							<span class="font-semibold">{r === '_other' ? 'Sonstige' : r}</span>
							{#if c.live > 0}
								<span class="badge badge-xs badge-success">{c.live} live</span>
							{:else if c.scheduled > 0}
								<span class="badge badge-xs badge-info">{c.scheduled}</span>
							{:else}
								<span class="badge badge-xs badge-ghost">{c.completed} ✓</span>
							{/if}
						</button>
					{/each}
					<div class="ml-auto shrink-0">
						<button
							class="btn btn-sm {selectedTab === '_all' ? 'btn-primary' : 'btn-ghost'}"
							onclick={() => (manualTab = '_all')}
						>
							Alle
						</button>
					</div>
				</div>
			{/if}

			<div class="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
				{#each visibleMatches as m (m.id)}
					{@const checked = selectedMatchIds.includes(m.id)}
					{@const disabled = !checked && selectedMatchIds.length >= maxTiles}
					<label
						class="flex items-center gap-3 p-3 rounded border cursor-pointer transition-colors {checked
							? 'border-primary bg-primary/5'
							: 'border-base-300 hover:bg-base-200'} {disabled ? 'opacity-40 cursor-not-allowed' : ''}"
					>
						<input
							type="checkbox"
							class="checkbox checkbox-primary"
							{checked}
							{disabled}
							onchange={() => toggleMatch(m.id)}
						/>
						<div class="flex-1 min-w-0">
							<div class="font-medium truncate">
								{m.home_club.name} vs {m.away_club.name}
							</div>
							<div class="text-xs text-base-content/60 truncate">
								{m.home_club.short_name} vs {m.away_club.short_name}
								{#if m.home_legs_won + m.away_legs_won > 0}
									&middot; {m.home_legs_won}:{m.away_legs_won}
								{/if}
							</div>
						</div>
						<span
							class="badge badge-sm shrink-0 {m.status === 'in_progress'
								? 'badge-success'
								: m.status === 'completed'
									? 'badge-neutral'
									: 'badge-ghost'}"
						>
							{m.status === 'in_progress' ? 'live' : m.status === 'completed' ? 'fertig' : 'geplant'}
						</span>
					</label>
				{/each}
			</div>
		</div>
	</div>
</div>
