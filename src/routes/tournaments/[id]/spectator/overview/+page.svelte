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
	<!-- Big title bar -->
	<div class="shrink-0 px-6 py-3 bg-base-100 shadow-sm flex items-center justify-between gap-4">
		<div class="flex items-baseline gap-4 min-w-0">
			<h1
				class="font-bold truncate leading-tight"
				style="font-size: clamp(1.75rem, 4cqw, 5rem);"
			>
				{tournament.name}
			</h1>
			<span
				class="text-base-content/60 shrink-0"
				style="font-size: clamp(0.875rem, 1.6cqw, 2rem);"
			>
				{inProgress.length} live · {scheduled.length} geplant · {completed.length} fertig
			</span>
		</div>
	</div>

	<!-- Match grid (fills remaining viewport) -->
	{#if matches.length === 0}
		<div class="flex-1 flex items-center justify-center">
			<p class="text-base-content/60 text-2xl">Noch keine Spiele geplant.</p>
		</div>
	{:else}
		<div
			class="flex-1 grid gap-2 p-2 min-h-0 overflow-y-auto auto-rows-fr"
			style="grid-template-columns: repeat(auto-fit, minmax(min(100%, 480px), 1fr));"
			data-testid="overview-match-grid"
		>
			<!-- Live matches first, then scheduled, then completed -->
			{#each [...inProgress, ...scheduled, ...completed] as match (match.id)}
				{@const sb = statusBadge(match.status)}
				<div
					class="match-row flex items-stretch rounded-lg shadow-sm bg-base-100 overflow-hidden border-2 {match.status === 'in_progress' ? 'border-success animate-pulse-slow' : 'border-base-300'}"
					data-testid="overview-match"
					data-match-id={match.id}
				>
					<!-- Home -->
					<div class="flex-1 flex items-center justify-end gap-3 px-3 min-w-0">
						<div class="flex flex-col items-end min-w-0">
							<span
								class="font-bold truncate max-w-full leading-tight text-right"
								style="font-size: clamp(1.25rem, 3cqw, 3.5rem);"
							>
								{match.home_club.name}
							</span>
							<span
								class="text-base-content/50 truncate max-w-full leading-tight"
								style="font-size: clamp(0.75rem, 1.4cqw, 1.5rem);"
							>
								{match.home_club.short_name}
							</span>
						</div>
						<div
							class="shrink-0 crest-fit"
							style="width: clamp(48px, 7cqw, 128px); height: clamp(48px, 7cqw, 128px);"
						>
							<ClubCrest
								club_id={match.home_club.id}
								has_crest={match.home_club.has_crest}
								crest_url={match.home_club.crest_url}
								club_name={match.home_club.name}
								primary_color={match.home_club.primary_color}
								size={128}
							/>
						</div>
					</div>

					<!-- Score / status -->
					<div class="flex flex-col items-center justify-center px-2 shrink-0 gap-0.5">
						<span
							class="rounded-full font-bold uppercase tracking-widest leading-none px-2 py-0.5 {sb.cls}"
							style="font-size: clamp(0.6rem, 1.2cqw, 1rem);"
						>
							{sb.label}
						</span>
						{#if match.status === 'completed' || match.status === 'in_progress'}
							<span
								class="font-black tabular-nums leading-none"
								style="font-size: clamp(2rem, 6cqw, 7rem);"
								data-testid="overview-match-score"
							>
								{match.home_legs_won}:{match.away_legs_won}
							</span>
						{:else}
							<span
								class="font-light text-base-content/40 leading-none"
								style="font-size: clamp(2rem, 6cqw, 7rem);"
							>
								–
							</span>
						{/if}
						{#if match.round}
							<span
								class="text-base-content/50 leading-none uppercase tracking-wider"
								style="font-size: clamp(0.6rem, 1.2cqw, 1rem);"
							>
								{match.round}
							</span>
						{/if}
					</div>

					<!-- Away -->
					<div class="flex-1 flex items-center justify-start gap-3 px-3 min-w-0">
						<div
							class="shrink-0 crest-fit"
							style="width: clamp(48px, 7cqw, 128px); height: clamp(48px, 7cqw, 128px);"
						>
							<ClubCrest
								club_id={match.away_club.id}
								has_crest={match.away_club.has_crest}
								crest_url={match.away_club.crest_url}
								club_name={match.away_club.name}
								primary_color={match.away_club.primary_color}
								size={128}
							/>
						</div>
						<div class="flex flex-col items-start min-w-0">
							<span
								class="font-bold truncate max-w-full leading-tight text-left"
								style="font-size: clamp(1.25rem, 3cqw, 3.5rem);"
							>
								{match.away_club.name}
							</span>
							<span
								class="text-base-content/50 truncate max-w-full leading-tight"
								style="font-size: clamp(0.75rem, 1.4cqw, 1.5rem);"
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
			title="Zur Kachel-Ansicht"
		>
			▦ Kacheln
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
