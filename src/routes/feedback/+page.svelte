<script lang="ts">
	import { enhance } from '$app/forms';

	let { form } = $props();

	let submitting = $state(false);
</script>

<div class="max-w-xl mx-auto" data-testid="feedback-page">
	<h1 class="text-2xl font-bold mb-6">Feedback</h1>
	<p class="text-base-content/70 mb-6">
		Bug gefunden oder eine Idee? Dein Feedback wird direkt als GitHub-Issue erstellt.
	</p>

	{#if form?.success}
		<div class="alert alert-success mb-6" data-testid="feedback-success">
			<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
			</svg>
			<div>
				<p class="font-semibold">Feedback gesendet!</p>
				<p>
					Issue
					<a href={form.issueUrl} target="_blank" rel="noopener noreferrer" class="link link-primary">
						#{form.issueNumber}
					</a>
					wurde erstellt.
				</p>
			</div>
		</div>
	{/if}

	{#if form?.error}
		<div class="alert alert-error mb-6" data-testid="feedback-error">
			<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
			</svg>
			<span>{form.error}</span>
		</div>
	{/if}

	<form
		method="POST"
		use:enhance={() => {
			submitting = true;
			return async ({ update }) => {
				await update();
				submitting = false;
			};
		}}
		class="flex flex-col gap-4"
		data-testid="feedback-form"
	>
		<div class="form-control">
			<label class="label" for="category">
				<span class="label-text">Kategorie</span>
			</label>
			<select
				id="category"
				name="category"
				class="select select-bordered w-full"
				required
				value={form?.category ?? 'Bug'}
				data-testid="feedback-category"
			>
				<option value="Bug">Bug</option>
				<option value="Feature">Feature-Wunsch</option>
				<option value="Sonstiges">Sonstiges</option>
			</select>
		</div>

		<div class="form-control">
			<label class="label" for="title">
				<span class="label-text">Titel</span>
			</label>
			<input
				id="title"
				name="title"
				type="text"
				class="input input-bordered w-full"
				placeholder="Kurze Zusammenfassung..."
				required
				minlength="3"
				value={form?.title ?? ''}
				data-testid="feedback-title"
			/>
		</div>

		<div class="form-control">
			<label class="label" for="description">
				<span class="label-text">Beschreibung</span>
			</label>
			<textarea
				id="description"
				name="description"
				class="textarea textarea-bordered w-full h-32"
				placeholder="Was ist passiert? Was hast du erwartet?"
				required
				minlength="10"
				data-testid="feedback-description"
			>{form?.description ?? ''}</textarea>
		</div>

		<button
			type="submit"
			class="btn btn-primary"
			disabled={submitting}
			data-testid="feedback-submit"
		>
			{#if submitting}
				<span class="loading loading-spinner loading-sm"></span>
				Wird gesendet...
			{:else}
				Feedback senden
			{/if}
		</button>
	</form>
</div>
