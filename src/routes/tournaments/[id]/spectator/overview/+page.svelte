<script lang="ts">
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import ClubCrest from '$lib/components/clubs/ClubCrest.svelte';
	import type { Match, Tournament } from '$lib/types/league.js';

	let { data } = $props();

	let tournament = $state<Tournament>(data.tournament);
	let matches = $state<Match[]>(data.matches);
	let fullscreen = $state(false);
	let chromeVisible = $state(true);
	let chromeTimer: ReturnType<typeof setTimeout> | null = null;

	const inProgress = $derived(matches.filter((m) => m.status === 'in_progress'));
	const scheduled = $derived(matches.filter((m) => m.status === 'scheduled'));
	const completed = $derived(matches.filter((m) => m.status === 'completed'));

	const ROUND_ORDER = ['Runde 1', 'Achtelfinale', 'Viertelfinale', 'Halbfinale', 'Finale'];

	// Distinct round labels in canonical order; matches without a round get bucketed as '_other'.
	const rounds = $derived.by(() => {
		const present = new Set<string>();
		for (const m of matches) present.add(m.round ?? '_other');
		const ordered = ROUND_ORDER.filter((r) => present.has(r));
		const unknown = [...present].filter((r) => !ROUND_ORDER.includes(r));
		return [...ordered, ...unknown];
	});

	// Active round = first round in canonical order that still has open matches;
	// fall back to the latest round present if everything is done.
	const activeRound = $derived.by(() => {
		for (const r of rounds) {
			if (matches.some((m) => (m.round ?? '_other') === r && m.status !== 'completed')) {
				return r;
			}
		}
		return rounds[rounds.length - 1] ?? null;
	});

	let manualRound = $state<string | null>(null);
	const selectedRound = $derived(manualRound ?? activeRound);

	// When the auto-detected active round changes (e.g. Achtel → Viertel after sim), and the
	// user hasn't manually picked a different tab, follow the change automatically.
	let lastActiveRound = $state<string | null>(null);
	$effect(() => {
		if (activeRound !== lastActiveRound) {
			if (manualRound === lastActiveRound || manualRound === null) {
				manualRound = null; // re-track active
			}
			lastActiveRound = activeRound;
		}
	});

	const visibleMatches = $derived.by(() => {
		const filtered = matches.filter((m) => (m.round ?? '_other') === selectedRound);
		const live = filtered.filter((m) => m.status === 'in_progress');
		const sched = filtered.filter((m) => m.status === 'scheduled');
		const done = filtered.filter((m) => m.status === 'completed');
		return [...live, ...sched, ...done];
	});

	function roundCounts(round: string): { live: number; scheduled: number; completed: number } {
		const r = matches.filter((m) => (m.round ?? '_other') === round);
		return {
			live: r.filter((m) => m.status === 'in_progress').length,
			scheduled: r.filter((m) => m.status === 'scheduled').length,
			completed: r.filter((m) => m.status === 'completed').length
		};
	}

	// Cap columns at 2 so each card stays wide enough to read from across a room.
	const cols = $derived(visibleMatches.length <= 1 ? 1 : 2);
	const rows = $derived(Math.max(1, Math.ceil(visibleMatches.length / cols)));

	async function fetchLive() {
		try {
			const res = await fetch(`/api/tournaments/${data.tournament.id}/live`);
			if (!res.ok) return;
			const body = await res.json();
			if (body.tournament) tournament = body.tournament;
			if (body.matches) matches = body.matches;
		} catch {
			/* ignore */
		}
	}

	onMount(() => {
		if (!browser) return;
		const interval = setInterval(fetchLive, 2000);
		return () => clearInterval(interval);
	});

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

	function statusBadge(s: Match['status']): { label: string; cls: string } {
		if (s === 'in_progress') return { label: 'LIVE', cls: 'bg-success text-success-content' };
		if (s === 'completed') return { label: 'FERTIG', cls: 'bg-base-300 text-base-content/70' };
		return { label: 'GEPLANT', cls: 'bg-info/30 text-info-content' };
	}
</script>

<svelte:head>
	<title>Spielplan · {tournament.name}</title>
</svelte:head>

<!-- svelte-ignore a11y_no_static_element_interactions a11y_mouse_events_have_key_events -->
<div
	class="fixed inset-0 z-50 bg-base-200 flex flex-col overview-container"
	data-testid="spectator-overview-page"
	onmousemove={showChrome}
	ontouchstart={showChrome}
>
	<!-- Compact title bar -->
	<div class="shrink-0 px-4 py-2 bg-base-100 shadow-sm flex items-center justify-between gap-4">
		<div class="flex items-baseline gap-4 min-w-0">
			<h1 class="font-bold truncate leading-tight text-2xl md:text-3xl">
				{tournament.name}
			</h1>
			<span class="text-base-content/60 shrink-0 text-sm md:text-base">
				{inProgress.length} live · {scheduled.length} geplant · {completed.length} fertig
			</span>
		</div>
	</div>

	<!-- Round tabs -->
	{#if rounds.length > 1}
		<div
			class="shrink-0 px-2 py-2 bg-base-100/70 border-b border-base-300 flex items-center gap-2 overflow-x-auto"
			data-testid="overview-round-tabs"
		>
			{#each rounds as r (r)}
				{@const c = roundCounts(r)}
				{@const isActive = r === selectedRound}
				{@const isCurrent = r === activeRound}
				<button
					class="btn btn-sm shrink-0 {isActive ? 'btn-primary' : 'btn-ghost'} {isCurrent && !isActive ? 'border border-success/60' : ''}"
					onclick={() => (manualRound = r)}
					data-testid="overview-round-tab"
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
		</div>
	{/if}

	<!-- Match grid (fills remaining viewport) -->
	{#if matches.length === 0}
		<div class="flex-1 flex items-center justify-center">
			<p class="text-base-content/60 text-2xl">Noch keine Spiele geplant.</p>
		</div>
	{:else}
		<div
			class="flex-1 grid gap-2 p-2 min-h-0 overflow-y-auto"
			style="grid-template-columns: repeat({cols}, minmax(0, 1fr)); grid-template-rows: repeat({rows}, minmax(0, 1fr));"
			data-testid="overview-match-grid"
		>
			<!-- Live matches first, then scheduled, then completed -->
			{#each visibleMatches as match (match.id)}
				{@const sb = statusBadge(match.status)}
				<div
					class="match-row flex items-stretch rounded-lg shadow-sm bg-base-100 overflow-hidden border-2 {match.status === 'in_progress' ? 'border-success animate-pulse-slow' : 'border-base-300'}"
					data-testid="overview-match"
					data-match-id={match.id}
				>
					<!-- Home -->
					<div class="flex-1 flex items-center justify-end gap-4 px-4 min-w-0">
						<div class="flex flex-col items-end min-w-0">
							<span
								class="font-bold truncate max-w-full leading-tight text-right"
								style="font-size: clamp(1.5rem, 5.5cqw, 7rem);"
							>
								{match.home_club.name}
							</span>
							<span
								class="text-base-content/50 truncate max-w-full leading-tight uppercase tracking-wider"
								style="font-size: clamp(0.85rem, 2.2cqw, 2.5rem);"
							>
								{match.home_club.short_name}
							</span>
						</div>
						<div
							class="shrink-0 crest-fit"
							style="width: clamp(64px, 12cqw, 240px); height: clamp(64px, 12cqw, 240px);"
						>
							<ClubCrest
								club_id={match.home_club.id}
								has_crest={match.home_club.has_crest}
								crest_url={match.home_club.crest_url}
								club_name={match.home_club.name}
								primary_color={match.home_club.primary_color}
								size={240}
							/>
						</div>
					</div>

					<!-- Score / status -->
					<div class="flex flex-col items-center justify-center px-3 shrink-0 gap-1">
						<span
							class="rounded-full font-bold uppercase tracking-widest leading-none px-3 py-1 {sb.cls}"
							style="font-size: clamp(0.75rem, 1.8cqw, 1.75rem);"
						>
							{sb.label}
						</span>
						{#if match.status === 'completed' || match.status === 'in_progress'}
							<span
								class="font-black tabular-nums leading-none"
								style="font-size: clamp(3rem, 11cqw, 14rem);"
								data-testid="overview-match-score"
							>
								{match.home_legs_won}:{match.away_legs_won}
							</span>
						{:else}
							<span
								class="font-light text-base-content/40 leading-none"
								style="font-size: clamp(3rem, 11cqw, 14rem);"
							>
								–
							</span>
						{/if}
						{#if match.round}
							<span
								class="text-base-content/50 leading-none uppercase tracking-wider"
								style="font-size: clamp(0.75rem, 1.8cqw, 1.75rem);"
							>
								{match.round}
							</span>
						{/if}
					</div>

					<!-- Away -->
					<div class="flex-1 flex items-center justify-start gap-4 px-4 min-w-0">
						<div
							class="shrink-0 crest-fit"
							style="width: clamp(64px, 12cqw, 240px); height: clamp(64px, 12cqw, 240px);"
						>
							<ClubCrest
								club_id={match.away_club.id}
								has_crest={match.away_club.has_crest}
								crest_url={match.away_club.crest_url}
								club_name={match.away_club.name}
								primary_color={match.away_club.primary_color}
								size={240}
							/>
						</div>
						<div class="flex flex-col items-start min-w-0">
							<span
								class="font-bold truncate max-w-full leading-tight text-left"
								style="font-size: clamp(1.5rem, 5.5cqw, 7rem);"
							>
								{match.away_club.name}
							</span>
							<span
								class="text-base-content/50 truncate max-w-full leading-tight uppercase tracking-wider"
								style="font-size: clamp(0.85rem, 2.2cqw, 2.5rem);"
							>
								{match.away_club.short_name}
							</span>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}

	<!-- Floating chrome -->
	<div
		class="absolute top-2 right-2 flex items-center gap-2 transition-opacity duration-300 {chromeVisible
			? 'opacity-100'
			: 'opacity-0 pointer-events-none'}"
	>
		<a
			href="/tournaments/{tournament.id}/spectator"
			class="btn btn-sm btn-neutral shadow-lg"
			title="Live-Kacheln"
		>
			▦ Kacheln
		</a>
		<a
			href="/tournaments/{tournament.id}/spectator/trinkwertung"
			class="btn btn-sm btn-neutral shadow-lg"
			title="Trinkwertung"
		>
			🍺 Trinkwertung
		</a>
		<a
			href="/tournaments/{tournament.id}/spectator/configure"
			class="btn btn-sm btn-neutral shadow-lg"
			title="Konfigurieren"
		>
			⚙
		</a>
		<button
			class="btn btn-sm btn-neutral shadow-lg"
			onclick={toggleFullscreen}
			title={fullscreen ? 'Vollbild verlassen' : 'Vollbild'}
		>
			{fullscreen ? '⛶ Verlassen' : '⛶ Vollbild'}
		</button>
		<a
			href="/tournaments/{tournament.id}"
			class="btn btn-sm btn-ghost bg-base-100 shadow-lg"
			title="Zurueck"
		>
			✕
		</a>
	</div>
</div>

<style>
	.overview-container {
		container-type: inline-size;
	}
	.match-row {
		container-type: inline-size;
	}
	.crest-fit :global(svg),
	.crest-fit :global(img) {
		width: 100% !important;
		height: 100% !important;
		display: block;
	}
	@keyframes pulseSlow {
		0%, 100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); }
		50% { box-shadow: 0 0 0 6px rgba(34, 197, 94, 0); }
	}
	.animate-pulse-slow {
		animation: pulseSlow 2s ease-in-out infinite;
	}
</style>
