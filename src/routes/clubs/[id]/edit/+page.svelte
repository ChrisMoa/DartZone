<script lang="ts">
	import ClubForm from '$lib/components/clubs/ClubForm.svelte';

	let { data, form } = $props();
</script>

<div class="mx-auto max-w-lg">
	<ClubForm club={data.club} errors={form?.errors} />
</div>
