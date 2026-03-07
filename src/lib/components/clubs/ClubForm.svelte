<script lang="ts">
	import type { Club } from '$lib/types/club.js';
	import ClubCrest from './ClubCrest.svelte';

	interface Props {
		club?: Club;
		errors?: Record<string, string>;
	}

	let { club, errors = {} }: Props = $props();

	let name = $state(club?.name ?? '');
	let short_name = $state(club?.short_name ?? '');
	let primary_color = $state(club?.primary_color ?? '#1a5276');
	let secondary_color = $state(club?.secondary_color ?? '#ffffff');
	let contact_email = $state(club?.contact_email ?? '');
	let crestPreview = $state<string | null>(null);

	function handleCrestChange(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = () => {
				crestPreview = reader.result as string;
			};
			reader.readAsDataURL(file);
		} else {
			crestPreview = null;
		}
	}
</script>

<form method="POST" enctype="multipart/form-data" class="flex flex-col gap-4" data-testid="club-form">
	<div class="flex items-center gap-4">
		{#if crestPreview}
			<img
				src={crestPreview}
				alt="Wappen Vorschau"
				class="rounded-full object-cover"
				style="width: 64px; height: 64px;"
			/>
		{:else}
			<ClubCrest
				club_id={club?.id}
				has_crest={club?.has_crest}
				crest_url={club?.crest_url}
				club_name={name || 'Neuer Verein'}
				{primary_color}
				size={64}
			/>
		{/if}
		<div class="flex-1">
			<h2 class="text-lg font-semibold">{club ? 'Verein bearbeiten' : 'Neuer Verein'}</h2>
			<label class="btn btn-xs btn-outline mt-1">
				Wappen hochladen
				<input
					type="file"
					name="crest"
					accept="image/png,image/jpeg,image/svg+xml,image/webp"
					class="hidden"
					onchange={handleCrestChange}
					data-testid="club-form-crest"
				/>
			</label>
		</div>
	</div>

	<div class="form-control">
		<label class="label" for="name">Name</label>
		<input
			type="text"
			id="name"
			name="name"
			class="input input-bordered w-full"
			class:input-error={errors.name}
			bind:value={name}
			required
			minlength={2}
			maxlength={100}
			placeholder="z.B. DC Bullseye Berlin"
			data-testid="club-form-name"
		/>
		{#if errors.name}
			<span class="label text-error text-sm" data-testid="error-name">{errors.name}</span>
		{/if}
	</div>

	<div class="form-control">
		<label class="label" for="short_name">Kurzname</label>
		<input
			type="text"
			id="short_name"
			name="short_name"
			class="input input-bordered w-full"
			class:input-error={errors.short_name}
			bind:value={short_name}
			required
			minlength={2}
			maxlength={10}
			placeholder="z.B. BCB"
			data-testid="club-form-short-name"
		/>
		{#if errors.short_name}
			<span class="label text-error text-sm" data-testid="error-short-name">{errors.short_name}</span>
		{/if}
	</div>

	<div class="flex gap-4">
		<div class="form-control flex-1">
			<label class="label" for="primary_color">Primaerfarbe</label>
			<input
				type="color"
				id="primary_color"
				name="primary_color"
				class="input input-bordered h-12 w-full"
				bind:value={primary_color}
				data-testid="club-form-primary-color"
			/>
		</div>
		<div class="form-control flex-1">
			<label class="label" for="secondary_color">Sekundaerfarbe</label>
			<input
				type="color"
				id="secondary_color"
				name="secondary_color"
				class="input input-bordered h-12 w-full"
				bind:value={secondary_color}
				data-testid="club-form-secondary-color"
			/>
		</div>
	</div>

	<div class="form-control">
		<label class="label" for="contact_email">E-Mail (optional)</label>
		<input
			type="email"
			id="contact_email"
			name="contact_email"
			class="input input-bordered w-full"
			class:input-error={errors.contact_email}
			bind:value={contact_email}
			placeholder="kontakt@verein.de"
			data-testid="club-form-email"
		/>
		{#if errors.contact_email}
			<span class="label text-error text-sm" data-testid="error-email">{errors.contact_email}</span>
		{/if}
	</div>

	<div class="flex gap-2 justify-end mt-4">
		<a href="/clubs" class="btn btn-ghost">Abbrechen</a>
		<button type="submit" class="btn btn-primary" data-testid="club-form-submit">
			{club ? 'Speichern' : 'Erstellen'}
		</button>
	</div>
</form>
