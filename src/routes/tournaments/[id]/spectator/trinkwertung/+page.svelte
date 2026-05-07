<script lang="ts">
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import ClubCrest from '$lib/components/clubs/ClubCrest.svelte';
	import type { DrinkingGame, DrinkingScore } from '$lib/types/league.js';

	let { data } = $props();

	let drinkingGame = $state<DrinkingGame | null>(data.drinkingGame);
	let scores = $state<DrinkingScore[]>(data.scores);
	let fullscreen = $state(false);
	let chromeVisible = $state(true);
	let chromeTimer: ReturnType<typeof setTimeout> | null = null;

	const sortedScores = $derived(
		[...scores].sort(
			(a, b) => b.drink_count - a.drink_count || a.club_name.localeCompare(b.club_name)
		)
	);
	const top = $derived(sortedScores.slice(0, 4));
	const rest = $derived(sortedScores.slice(4));
	const maxCount = $derived(Math.max(1, ...scores.map((s) => s.drink_count)));

	async function fetchScores() {
		try {
			const res = await fetch(`/api/tournaments/${data.tournament.id}/trinkwertung`);
			if (!res.ok) return;
			const result = await res.json();
			if (result.game) drinkingGame = result.game;
			if (Array.isArray(result.scores)) scores = result.scores;
		} catch {
			/* ignore */
		}
	}

	onMount(() => {
		if (!browser) return;
		const interval = setInterval(fetchScores, 2000);
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

	// Visual treatment for top 4 ranks (gold / silver / bronze / blue)
	function rankStyle(rank: number): { ring: string; bg: string; medal: string; label: string } {
		if (rank === 1)
			return {
				ring: 'ring-4 ring-yellow-400',
				bg: 'bg-gradient-to-b from-yellow-200/40 to-base-100',
				medal: '🥇',
				label: '1.'
			};
		if (rank === 2)
			return {
				ring: 'ring-4 ring-zinc-300',
				bg: 'bg-gradient-to-b from-zinc-200/40 to-base-100',
				medal: '🥈',
				label: '2.'
			};
		if (rank === 3)
			return {
				ring: 'ring-4 ring-amber-700',
				bg: 'bg-gradient-to-b from-amber-300/30 to-base-100',
				medal: '🥉',
				label: '3.'
			};
		return {
			ring: 'ring-2 ring-base-300',
			bg: 'bg-base-100',
			medal: '',
			label: `${rank}.`
		};
	}
</script>

<svelte:head>
	<title>Trinkwertung · {data.tournament.name}</title>
</svelte:head>

<!-- svelte-ignore a11y_no_static_element_interactions a11y_mouse_events_have_key_events -->
<div
	class="fixed inset-0 z-50 bg-base-200 flex flex-col trink-page"
	data-testid="spectator-trinkwertung-page"
	onmousemove={showChrome}
	ontouchstart={showChrome}
>
	<!-- Title bar -->
	<div class="shrink-0 px-4 py-2 bg-base-100 shadow-sm flex items-center gap-3 flex-wrap">
		<span class="text-3xl">🍺</span>
		<h1 class="font-bold truncate leading-tight text-2xl md:text-3xl">
			Trinkwertung · {data.tournament.name}
		</h1>
		{#if drinkingGame}
			<span
				class="badge {drinkingGame.status === 'running' ? 'badge-success' : 'badge-neutral'} text-sm md:text-base px-3 py-2"
			>
				{drinkingGame.status === 'running' ? 'Laufend' : 'Beendet'}
			</span>
		{/if}
		<span class="ml-auto text-base-content/60 text-sm md:text-base">
			{scores.length} Vereine
		</span>
	</div>

	{#if !drinkingGame}
		<div class="flex-1 flex flex-col items-center justify-center gap-4 p-6 text-center">
			<p class="text-2xl text-base-content/60">Noch keine Trinkwertung gestartet.</p>
			<a
				href="/tournaments/{data.tournament.id}/trinkwertung"
				class="btn btn-primary"
				data-testid="trinkwertung-create-link"
			>
				Trinkwertung starten
			</a>
		</div>
	{:else if scores.length === 0}
		<div class="flex-1 flex items-center justify-center p-6">
			<p class="text-2xl text-base-content/60">Noch keine Vereine in der Trinkwertung.</p>
		</div>
	{:else}
		<!-- Top-4 row: each takes 1/N width, fills upper portion of viewport -->
		<div
			class="grid gap-3 p-3 min-h-0 {rest.length > 0 ? 'flex-[3_1_0]' : 'flex-1'}"
			style="grid-template-columns: repeat({Math.min(top.length, 4)}, minmax(0, 1fr));"
			data-testid="trinkwertung-top"
		>
			{#each top as score, idx (score.club_id)}
				{@const rank = idx + 1}
				{@const style = rankStyle(rank)}
				{@const pct = (score.drink_count / maxCount) * 100}
				<div
					class="top-tile relative rounded-2xl shadow-lg overflow-hidden flex flex-col {style.bg} {style.ring}"
					data-testid="trinkwertung-top-tile"
					data-rank={rank}
				>
					<!-- Rank badge (top-left) -->
					<div
						class="absolute top-2 left-3 font-black leading-none text-base-content/30"
						style="font-size: clamp(2rem, 8cqw, 7rem);"
					>
						{style.label}
					</div>
					<!-- Medal (top-right) -->
					{#if style.medal}
						<div class="absolute top-2 right-3 leading-none" style="font-size: clamp(2rem, 8cqw, 6rem);">
							{style.medal}
						</div>
					{/if}

					<!-- Body: crest + name + count, vertically distributed -->
					<div class="flex-1 flex flex-col items-center justify-around p-3 min-h-0">
						<div
							class="crest-fit"
							style="width: clamp(64px, 20cqw, 240px); height: clamp(64px, 20cqw, 240px);"
						>
							<ClubCrest
								club_id={score.club_id}
								has_crest={score.has_crest}
								club_name={score.club_name}
								primary_color={score.primary_color}
								size={240}
							/>
						</div>
						<div class="flex flex-col items-center gap-0 min-w-0 max-w-full">
							<span
								class="font-bold truncate max-w-full text-center leading-tight"
								style="font-size: clamp(1.75rem, 7cqw, 6.5rem);"
							>
								{score.club_name}
							</span>
							<span
								class="text-base-content/50 truncate max-w-full uppercase tracking-wider leading-tight"
								style="font-size: clamp(0.8rem, 2cqw, 2rem);"
							>
								{score.short_name}
							</span>
						</div>
						<div class="flex items-baseline gap-2">
							<span
								class="font-black tabular-nums leading-none"
								style="font-size: clamp(4rem, 26cqw, 18rem); color: {score.primary_color};"
								data-testid="trinkwertung-top-count"
							>
								{score.drink_count}
							</span>
							<span
								class="text-base-content/50 leading-none"
								style="font-size: clamp(1rem, 3.5cqw, 3rem);"
							>
								🍺
							</span>
						</div>
					</div>

					<!-- Progress bar at bottom -->
					<div class="h-2 bg-base-300 shrink-0">
						<div
							class="h-full transition-all duration-500"
							style="width: {Math.max(pct, 2)}%; background-color: {score.primary_color};"
						></div>
					</div>
				</div>
			{/each}
		</div>

		<!-- Rest list: 2 columns, fills remaining space -->
		{#if rest.length > 0}
			<div
				class="flex-[2_1_0] grid grid-cols-1 md:grid-cols-2 gap-2 p-3 pt-0 min-h-0 overflow-y-auto"
				data-testid="trinkwertung-rest"
			>
				{#each rest as score, idx (score.club_id)}
					{@const rank = idx + 5}
					{@const pct = (score.drink_count / maxCount) * 100}
					<div
						class="rest-row flex items-center gap-3 px-4 py-2 rounded-lg bg-base-100 shadow-sm border border-base-300 min-h-0"
						data-testid="trinkwertung-rest-row"
						data-rank={rank}
					>
						<span
							class="font-bold tabular-nums text-base-content/50 shrink-0"
							style="font-size: clamp(1rem, 2.6cqw, 2.5rem); min-width: 2.5em;"
						>
							{rank}.
						</span>
						<div
							class="shrink-0 crest-fit"
							style="width: clamp(36px, 5cqw, 80px); height: clamp(36px, 5cqw, 80px);"
						>
							<ClubCrest
								club_id={score.club_id}
								has_crest={score.has_crest}
								club_name={score.club_name}
								primary_color={score.primary_color}
								size={80}
							/>
						</div>
						<div class="flex-1 min-w-0 flex flex-col">
							<span
								class="font-semibold truncate leading-tight"
								style="font-size: clamp(0.95rem, 2.4cqw, 2.25rem);"
							>
								{score.club_name}
							</span>
							<div class="h-1.5 bg-base-300 rounded-full overflow-hidden mt-1">
								<div
									class="h-full"
									style="width: {Math.max(pct, 2)}%; background-color: {score.primary_color};"
								></div>
							</div>
						</div>
						<div class="flex items-baseline gap-1 shrink-0">
							<span
								class="font-black tabular-nums leading-none"
								style="font-size: clamp(1.5rem, 4cqw, 4rem); color: {score.primary_color};"
							>
								{score.drink_count}
							</span>
							<span
								class="text-base-content/40 leading-none"
								style="font-size: clamp(0.7rem, 1.6cqw, 1.5rem);"
							>
								🍺
							</span>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	{/if}

	<!-- Floating chrome -->
	<div
		class="absolute top-2 right-2 flex items-center gap-2 transition-opacity duration-300 {chromeVisible
			? 'opacity-100'
			: 'opacity-0 pointer-events-none'}"
	>
		<a
			href="/tournaments/{data.tournament.id}/spectator"
			class="btn btn-sm btn-neutral shadow-lg"
			title="Live-Kacheln"
		>
			▦ Kacheln
		</a>
		<a
			href="/tournaments/{data.tournament.id}/spectator/overview"
			class="btn btn-sm btn-neutral shadow-lg"
			title="Spielplan"
		>
			≡ Spielplan
		</a>
		<button
			class="btn btn-sm btn-neutral shadow-lg"
			onclick={toggleFullscreen}
			title={fullscreen ? 'Vollbild verlassen' : 'Vollbild'}
		>
			{fullscreen ? '⛶ Verlassen' : '⛶ Vollbild'}
		</button>
		<a
			href="/tournaments/{data.tournament.id}"
			class="btn btn-sm btn-ghost bg-base-100 shadow-lg"
			title="Zurueck"
		>
			✕
		</a>
	</div>
</div>

<style>
	.trink-page {
		container-type: inline-size;
	}
	.top-tile {
		container-type: inline-size;
	}
	.rest-row {
		container-type: inline-size;
	}
	.crest-fit :global(svg),
	.crest-fit :global(img) {
		width: 100% !important;
		height: 100% !important;
		display: block;
	}
</style>
