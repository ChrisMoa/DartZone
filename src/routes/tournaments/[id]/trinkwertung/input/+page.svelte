<script lang="ts">
	import ClubCrest from '$lib/components/clubs/ClubCrest.svelte';
	import type { DrinkingScore } from '$lib/types/league.js';

	let { data } = $props();

	let scores = $state<DrinkingScore[]>([...data.scores].sort((a, b) => a.club_name.localeCompare(b.club_name)));
	let selectedClubId = $state<string | null>(scores.length > 0 ? scores[0].club_id : null);
	let inputValue = $state('1');
	let sending = $state(false);

	const isRunning = $derived(data.drinkingGame.status === 'running');
	const selectedScore = $derived(scores.find((s) => s.club_id === selectedClubId));

	function selectClub(clubId: string) {
		selectedClubId = clubId;
	}

	function appendDigit(digit: string) {
		if (inputValue === '0') {
			inputValue = digit;
		} else {
			inputValue = inputValue + digit;
		}
	}

	function clearInput() {
		inputValue = '1';
	}

	function backspace() {
		if (inputValue.length <= 1) {
			inputValue = '0';
		} else {
			inputValue = inputValue.slice(0, -1);
		}
	}

	async function submitAmount(amount: number) {
		if (!selectedClubId || amount === 0 || sending) return;

		sending = true;
		try {
			const res = await fetch(`/api/tournaments/${data.tournament.id}/trinkwertung`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ clubId: selectedClubId, amount })
			});
			if (res.ok) {
				const result = await res.json();
				scores = (result.scores as DrinkingScore[]).sort((a, b) => a.club_name.localeCompare(b.club_name));
			}
		} finally {
			sending = false;
			inputValue = '1';
		}
	}

	function handleAdd() {
		const val = parseInt(inputValue, 10);
		if (!isNaN(val) && val > 0) {
			submitAmount(val);
		}
	}

	function handleSubtract() {
		const val = parseInt(inputValue, 10);
		if (!isNaN(val) && val > 0) {
			submitAmount(-val);
		}
	}
</script>

<div class="flex flex-col gap-4 max-w-lg mx-auto">
	<div class="flex items-center gap-4">
		<a href="/tournaments/{data.tournament.id}/trinkwertung" class="btn btn-ghost btn-sm">Zurueck</a>
		<h1 class="text-2xl font-bold">Trinkwertung – Eingabe</h1>
	</div>

	{#if !isRunning}
		<div class="alert alert-warning">
			Die Trinkwertung ist beendet. Aenderungen sind nicht mehr moeglich.
		</div>
	{/if}

	<!-- Team selection -->
	<div class="flex flex-col gap-2" data-testid="drinking-team-selection">
		{#each scores as score (score.club_id)}
			<button
				type="button"
				class="flex items-center gap-3 p-3 rounded-lg border-2 transition-all {selectedClubId === score.club_id ? 'border-primary bg-primary/10 shadow-md' : 'border-base-300 bg-base-100'}"
				onclick={() => selectClub(score.club_id)}
				data-testid="team-select-btn"
			>
				<ClubCrest
					club_id={score.club_id}
					has_crest={score.has_crest}
					club_name={score.club_name}
					primary_color={score.primary_color}
					size={36}
				/>
				<span class="font-semibold flex-1 text-left truncate">{score.club_name}</span>
				<span class="text-2xl font-bold tabular-nums min-w-[3ch] text-right" data-testid="team-drink-count">
					{score.drink_count}
				</span>
			</button>
		{/each}
	</div>

	{#if isRunning && selectedScore}
		<!-- Keypad -->
		<div class="card bg-base-100 shadow-sm" data-testid="drinking-keypad">
			<div class="card-body p-4 gap-3">
				<div class="text-center">
					<span class="text-sm text-base-content/60">Anzahl fuer</span>
					<span class="font-semibold ml-1">{selectedScore.club_name}</span>
				</div>

				<!-- Display -->
				<div class="text-center text-4xl font-bold tabular-nums py-2" data-testid="keypad-display">
					{inputValue}
				</div>

				<!-- Number grid -->
				<div class="grid grid-cols-3 gap-2">
					{#each ['1', '2', '3', '4', '5', '6', '7', '8', '9'] as digit}
						<button
							type="button"
							class="btn btn-lg"
							onclick={() => appendDigit(digit)}
							data-testid="keypad-{digit}"
						>
							{digit}
						</button>
					{/each}
					<button type="button" class="btn btn-lg" onclick={clearInput} data-testid="keypad-clear">
						C
					</button>
					<button type="button" class="btn btn-lg" onclick={() => appendDigit('0')} data-testid="keypad-0">
						0
					</button>
					<button type="button" class="btn btn-lg" onclick={backspace} data-testid="keypad-backspace">
						←
					</button>
				</div>

				<!-- Action buttons -->
				<div class="grid grid-cols-2 gap-2 mt-2">
					<button
						type="button"
						class="btn btn-error btn-lg text-xl"
						disabled={sending || !selectedClubId || parseInt(inputValue) === 0 || (selectedScore?.drink_count ?? 0) === 0}
						onclick={handleSubtract}
						data-testid="keypad-subtract"
					>
						- {inputValue}
					</button>
					<button
						type="button"
						class="btn btn-success btn-lg text-xl"
						disabled={sending || !selectedClubId || parseInt(inputValue) === 0}
						onclick={handleAdd}
						data-testid="keypad-add"
					>
						+ {inputValue}
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>
