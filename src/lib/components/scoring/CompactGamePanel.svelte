<script lang="ts">
	import ClubCrest from '$lib/components/clubs/ClubCrest.svelte';
	import type { GameStore } from '$lib/stores/game.svelte.js';
	import type { CricketGameStore } from '$lib/stores/cricket-game.svelte.js';
	import type { Match } from '$lib/types/league.js';
	import type { Player } from '$lib/types/club.js';
	import type { DartThrow } from '$lib/types/game.js';

	interface Props {
		match: Match;
		game: GameStore | CricketGameStore | null;
		homePlayers: Player[];
		awayPlayers: Player[];
		homeLegsWon: number;
		awayLegsWon: number;
		legNumber: number;
		isActive: boolean;
		panelIndex: number;
		matchStarted: boolean;
		matchCompleted: boolean;
		isCricket: boolean;
		starting?: boolean;
		error?: string | null;
		onselect: () => void;
		onstart: (homePlayerIndex: number, awayPlayerIndex: number) => void;
	}

	let {
		match,
		game,
		homePlayers,
		awayPlayers,
		homeLegsWon,
		awayLegsWon,
		legNumber,
		isActive,
		panelIndex,
		matchStarted,
		matchCompleted,
		isCricket,
		starting = false,
		error = null,
		onselect,
		onstart
	}: Props = $props();

	let homePlayerIndex = $state(0);
	let awayPlayerIndex = $state(0);

	function handleStart() {
		onstart(homePlayerIndex, awayPlayerIndex);
	}

	function formatThrow(t: DartThrow): string {
		if (t.is_bust) return 'BUST';
		if (t.sector === 0 || t.multiplier === 0) return 'Miss';
		const prefix = t.multiplier === 3 ? 'T' : t.multiplier === 2 ? 'D' : '';
		return `${prefix}${t.sector}`;
	}

	function throwClass(t: DartThrow): string {
		if (t.is_bust) return 'text-error';
		if (t.multiplier === 3) return 'text-warning';
		if (t.multiplier === 2) return 'text-success';
		return '';
	}

	const currentTurnThrows = $derived(game?.currentTurnThrows ?? []);
</script>

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
<div
	class="card bg-base-100 shadow-sm cursor-pointer transition-all duration-200 {isActive ? 'ring-2 ring-primary shadow-lg shadow-primary/20' : 'hover:shadow-md'}"
	onclick={onselect}
	data-testid="compact-game-panel-{panelIndex}"
>
	<div class="card-body p-3 gap-2">
		<!-- Panel header with number badge -->
		<div class="flex items-center justify-between">
			<span class="badge badge-sm {isActive ? 'badge-primary' : 'badge-ghost'}" data-testid="panel-badge-{panelIndex}">
				{panelIndex + 1}
			</span>
			{#if matchCompleted}
				<span class="badge badge-sm badge-success">Beendet</span>
			{:else if matchStarted}
				<span class="badge badge-sm badge-info">Live</span>
			{:else}
				<span class="badge badge-sm badge-ghost">Bereit</span>
			{/if}
		</div>

		<!-- Club names + score -->
		<div class="flex items-center justify-between gap-2">
			<div class="flex items-center gap-1 flex-1 min-w-0">
				<ClubCrest
					club_id={match.home_club.id}
					has_crest={match.home_club.has_crest}
					crest_url={match.home_club.crest_url}
					club_name={match.home_club.name}
					primary_color={match.home_club.primary_color}
					size={20}
				/>
				<span class="text-xs font-medium truncate">{match.home_club.short_name}</span>
			</div>
			<div class="text-lg font-bold tabular-nums shrink-0" data-testid="panel-legs-{panelIndex}">
				{homeLegsWon} : {awayLegsWon}
			</div>
			<div class="flex items-center gap-1 flex-1 min-w-0 justify-end">
				<span class="text-xs font-medium truncate">{match.away_club.short_name}</span>
				<ClubCrest
					club_id={match.away_club.id}
					has_crest={match.away_club.has_crest}
					crest_url={match.away_club.crest_url}
					club_name={match.away_club.name}
					primary_color={match.away_club.primary_color}
					size={20}
				/>
			</div>
		</div>

		{#if matchCompleted}
			<!-- Completed state -->
			<div class="text-center text-sm font-medium text-success">
				{homeLegsWon > awayLegsWon ? match.home_club.name : match.away_club.name} gewinnt!
			</div>
		{:else if matchStarted && !game}
			<!-- Started on another connection -->
			<div class="text-center text-xs text-warning py-2">
				Wird bereits auf einem anderen Geraet gespielt
			</div>
		{:else if !matchStarted}
			<!-- Player selection (compact) -->
			<div class="flex flex-col gap-1">
				<select class="select select-bordered select-xs w-full" bind:value={homePlayerIndex} data-testid="panel-home-player-{panelIndex}">
					{#each homePlayers as player, i (player.id)}
						<option value={i}>{player.first_name} {player.last_name}</option>
					{/each}
				</select>
				<select class="select select-bordered select-xs w-full" bind:value={awayPlayerIndex} data-testid="panel-away-player-{panelIndex}">
					{#each awayPlayers as player, i (player.id)}
						<option value={i}>{player.first_name} {player.last_name}</option>
					{/each}
				</select>
				{#if error}
					<div class="text-xs text-error">{error}</div>
				{/if}
				<button
					class="btn btn-primary btn-xs mt-1"
					onclick={(e) => { e.stopPropagation(); handleStart(); }}
					disabled={starting}
					data-testid="panel-start-{panelIndex}"
				>
					{#if starting}
						<span class="loading loading-spinner loading-xs"></span>
					{/if}
					Starten
				</button>
			</div>
		{:else if game}
			<!-- Active game scoreboard (compact) -->
			<div class="grid grid-cols-3 gap-1">
				<div class="text-center {game.current_player_id === game.home_player.id ? 'text-primary font-bold' : ''}">
					<div class="text-[0.65rem] truncate">{game.home_player.first_name}</div>
					<div class="text-xl font-bold tabular-nums" data-testid="panel-home-remaining-{panelIndex}">
						{game.home_remaining}
					</div>
				</div>
				<div class="flex flex-col items-center justify-center text-[0.6rem] text-base-content/50">
					<span>Leg {legNumber}</span>
					<span>R{game.current_turn}</span>
					<!-- Dart indicators -->
					<div class="flex gap-0.5 mt-0.5">
						{#each [1, 2, 3] as dartNum}
							<div class="w-2 h-2 rounded-full {dartNum < game.current_dart ? 'bg-base-content/20' : dartNum === game.current_dart ? 'bg-primary' : 'bg-base-300'}"></div>
						{/each}
					</div>
				</div>
				<div class="text-center {game.current_player_id === game.away_player.id ? 'text-secondary font-bold' : ''}">
					<div class="text-[0.65rem] truncate">{game.away_player.first_name}</div>
					<div class="text-xl font-bold tabular-nums" data-testid="panel-away-remaining-{panelIndex}">
						{game.away_remaining}
					</div>
				</div>
			</div>

			<!-- Current turn throws -->
			<div class="flex gap-1 justify-center">
				{#each [0, 1, 2] as i}
					<div class="text-xs text-center px-1.5 py-0.5 rounded bg-base-200 min-w-[2rem]">
						{#if currentTurnThrows[i]}
							<span class={throwClass(currentTurnThrows[i])}>{formatThrow(currentTurnThrows[i])}</span>
						{:else}
							<span class="text-base-content/30">-</span>
						{/if}
					</div>
				{/each}
			</div>

			{#if game.status === 'completed'}
				<div class="badge badge-success badge-sm mx-auto animate-pulse">Checkout!</div>
			{/if}
		{/if}
	</div>
</div>
